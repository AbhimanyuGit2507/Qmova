import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VisitStepService } from '../visit-step/visit-step.service';
import { RedisService } from '../redis/redis.service';
import { TenantPaymentsService } from '../tenant-payments/tenant-payments.service';
import { PaystackService } from '../tenant-payments/paystack.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly instanceId = `${process.pid}-${Math.random().toString(36).substring(2, 9)}`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly visitStepService: VisitStepService,
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => TenantPaymentsService))
    private readonly tenantPaymentsService: TenantPaymentsService,
    @Inject(forwardRef(() => PaystackService))
    private readonly paystackService: PaystackService,
  ) {}

  /**
   * Acquire a distributed Redis lock to prevent duplicate cron executions across multiple horizontal nodes.
   */
  private async withDistributedLock(
    lockName: string,
    ttlSeconds: number,
    action: () => Promise<void>,
  ): Promise<void> {
    const lockKey = `lock:cron:${lockName}`;
    let acquired = false;
    try {
      if (this.redisService?.client) {
        const res = await this.redisService.client.set(
          lockKey,
          this.instanceId,
          'EX',
          ttlSeconds,
          'NX',
        );
        acquired = res === 'OK';
      } else {
        acquired = true;
      }
    } catch (err: any) {
      this.logger.warn(
        `Failed to query Redis lock for ${lockKey}: ${err?.message}. Executing action with caution.`,
      );
      acquired = true;
    }

    if (!acquired) {
      this.logger.debug(
        `[DistributedLock] Cron ${lockName} is currently running or locked on another cluster instance. Skipping.`,
      );
      return;
    }

    try {
      await action();
    } catch (err) {
      this.logger.error(`Error executing cron job ${lockName}`, err);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOutboxRetention() {
    await this.withDistributedLock('handleOutboxRetention', 3600, async () => {
      this.logger.log('Running daily cleanup of completed OutboxEvents...');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count } = await this.prisma.outboxEvent.deleteMany({
        where: {
          status: 'COMPLETED',
          createdAt: { lt: sevenDaysAgo },
        },
      });

      this.logger.log(`Deleted ${count} expired OutboxEvents.`);
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanupExpiredInvitations() {
    await this.withDistributedLock(
      'handleCleanupExpiredInvitations',
      3600,
      async () => {
        this.logger.log('Running daily cleanup of expired invitations...');
        const now = new Date();

        const expiredInvites = await this.prisma.invitation.findMany({
          where: {
            OR: [
              { expiresAt: { lt: now }, used: false },
              {
                usedCount: { gte: this.prisma.invitation.fields.maxUses },
                used: false,
              },
            ],
          },
          include: { tenant: { select: { name: true, id: true } } },
        });

        if (expiredInvites.length === 0) {
          this.logger.log('No expired invitations to clean up.');
          return;
        }

        let cleanupCount = 0;

        for (const invite of expiredInvites) {
          try {
            await this.prisma.invitation.update({
              where: { id: invite.id },
              data: { used: true },
            });
            cleanupCount++;

            if (invite.email) {
              const tenantAdmin = await this.prisma.user.findFirst({
                where: {
                  tenantId: invite.tenantId,
                  role: 'OWNER',
                },
              });

              if (tenantAdmin?.email) {
                this.emailService.sendInvitationExpiredNotification(
                  tenantAdmin.email,
                  invite.email,
                  invite.tenant?.name || 'Your Team',
                );
              }
            }
          } catch (err) {
            this.logger.error(`Failed to cleanup invite ${invite.id}`, err);
          }
        }

        this.logger.log(`Cleaned up ${cleanupCount} expired invitations.`);
      },
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDataRetentionLifecycle() {
    await this.withDistributedLock(
      'handleDataRetentionLifecycle',
      3600,
      async () => {
        this.logger.log('Running data retention lifecycle check...');
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        try {
          const visitResult = await this.prisma.visit.deleteMany({
            where: { createdAt: { lt: twoYearsAgo } },
          });

          this.logger.log(
            `Data Retention: Cleaned up ${visitResult.count} old visits.`,
          );
        } catch (err) {
          this.logger.error('Failed to run data retention cleanup', err);
        }
      },
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDeferredCancellations() {
    await this.withDistributedLock(
      'handleDeferredCancellations',
      3600,
      async () => {
        this.logger.log('Running daily cleanup of deferred cancellations...');
        const now = new Date();

        const subscriptionsToCancel = await this.prisma.subscription.findMany({
          where: {
            cancelAtPeriodEnd: true,
            status: 'ACTIVE',
            currentPeriodEnd: { lte: now },
          },
          include: { plan: true },
        });

        if (subscriptionsToCancel.length === 0) {
          this.logger.log('No deferred cancellations to process.');
          return;
        }

        for (const sub of subscriptionsToCancel) {
          try {
            await this.prisma.subscription.update({
              where: { id: sub.id },
              data: {
                status: 'CANCELLED',
                endedAt: now,
                nextBillingDate: null,
                cancelAtPeriodEnd: false, // Reset flag
                metadata: {
                  ...((sub.metadata as object) || {}),
                  cancelledAt: now.toISOString(),
                },
              },
            });

            // Send email to owner
            const owner = await this.prisma.user.findFirst({
              where: {
                tenantId: sub.tenantId,
                role: { in: ['OWNER', 'ADMIN'] },
              },
              select: { email: true },
            });

            if (owner?.email && sub.plan?.name) {
              await this.emailService.sendSubscriptionCancelledEmail(
                owner.email,
                sub.plan.name,
              );
            }
          } catch (err: any) {
            this.logger.error(
              `Failed to cancel deferred subscription ${sub.id}`,
              err,
            );
          }
        }

        this.logger.log(
          `Processed ${subscriptionsToCancel.length} deferred cancellations.`,
        );
      },
    );
  }

  /**
   * Cleanup abandoned upfront payment visits every 15 minutes.
   * Checks gateway payment intent/transaction status via API before canceling a visit,
   * completely preventing the race condition where a 16-minute bank EFT or 3D-Secure
   * checkout has its visit canceled before webhook arrival.
   */
  @Cron('*/15 * * * *')
  async handleAbandonedPaymentsCleanup() {
    await this.withDistributedLock(
      'handleAbandonedPaymentsCleanup',
      800,
      async () => {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        try {
          const expiredVisits = await this.prisma.visit.findMany({
            where: {
              currentState: 'PENDING_PAYMENT',
              createdAt: { lt: fifteenMinutesAgo },
            },
            include: {
              bookingPayments: {
                where: { status: 'PENDING' },
                include: { paymentAccount: true },
              },
            },
          });

          if (expiredVisits.length === 0) return;

          let cleanedCount = 0;

          for (const visit of expiredVisits) {
            let skipCancel = false;

            for (const payment of visit.bookingPayments) {
              // 1. Verify with Stripe API if payment intent exists
              if (
                payment.stripePaymentIntentId &&
                this.tenantPaymentsService
              ) {
                const connectedAccountId =
                  payment.paymentAccount?.connectedAccountId;
                const intent =
                  await this.tenantPaymentsService.retrieveStripePaymentIntent(
                    payment.stripePaymentIntentId,
                    connectedAccountId,
                  );

                if (intent) {
                  if (intent.status === 'succeeded') {
                    this.logger.log(
                      `Sweeper detected succeeded Stripe intent ${intent.id} for visit ${visit.id}. Reconciling payment.`,
                    );
                    await this.tenantPaymentsService.completePayment(
                      payment.id,
                      'CARD_PRESENT',
                      {
                        description:
                          'Reconciled succeeded Stripe checkout by sweeper',
                      },
                    );
                    skipCancel = true;
                    break;
                  } else if (
                    intent.status === 'processing' ||
                    intent.status === 'requires_action'
                  ) {
                    this.logger.log(
                      `Customer actively in payment flow (${intent.status}) for visit ${visit.id}. Postponing cancellation.`,
                    );
                    skipCancel = true;
                    break;
                  }
                }
              }

              // 2. Verify with Paystack API if reference exists
              if (payment.paystackReference && this.paystackService) {
                try {
                  const verification =
                    await this.paystackService.verifyTransaction(
                      payment.paystackReference,
                    );
                  if (verification.isSuccessful) {
                    this.logger.log(
                      `Sweeper detected succeeded Paystack payment ${payment.paystackReference} for visit ${visit.id}. Reconciling payment.`,
                    );
                    await this.tenantPaymentsService.completePayment(
                      payment.id,
                      'CARD_PRESENT',
                      {
                        description: `Paystack online payment (${verification.channel || 'card'}) reconciled by sweeper`,
                      },
                    );
                    skipCancel = true;
                    break;
                  }
                } catch (err: any) {
                  this.logger.warn(
                    `Failed to verify Paystack reference ${payment.paystackReference}: ${err.message}`,
                  );
                }
              }
            }

            if (skipCancel) {
              continue;
            }

            // Confirmed abandoned: Cancel visit and payment records
            await this.prisma.$transaction(async (tx) => {
              await tx.bookingPayment.updateMany({
                where: { visitId: visit.id, status: 'PENDING' },
                data: {
                  status: 'CANCELLED',
                  refundReason: 'Checkout abandoned by customer',
                },
              });
              await tx.visit.updateMany({
                where: { id: visit.id, currentState: 'PENDING_PAYMENT' },
                data: {
                  currentState: 'CANCELLED',
                  cancelReason: 'Payment abandoned by customer',
                  completedAt: new Date(),
                },
              });
            });
            cleanedCount++;
          }

          if (cleanedCount > 0) {
            this.logger.log(
              `Cleaned up ${cleanedCount} verified abandoned PENDING_PAYMENT checkouts.`,
            );
          }
        } catch (err) {
          this.logger.error('Failed to run abandoned payments cleanup', err);
        }
      },
    );
  }

  /**
   * Check-in reminders: runs every minute and sends WhatsApp nudges
   * to customers who have upcoming or overdue appointments.
   * Uses Redis distributed lock to prevent duplicate WhatsApp reminders across horizontal cluster instances.
   */
  @Cron('* * * * *') // Every minute
  async handleCheckinReminders() {
    await this.withDistributedLock('handleCheckinReminders', 55, async () => {
      const now = new Date();

      // Find scheduled visits where service has requireManualCheckIn = true
      const upcomingVisits = await this.prisma.visit.findMany({
        where: {
          currentState: { in: ['SCHEDULED', 'CREATED'] },
          scheduledTime: { not: null },
          service: { requireManualCheckIn: true },
        },
        include: {
          customer: { select: { name: true, phone: true } },
          service: { select: { name: true, expectedDuration: true } },
          location: { select: { name: true } },
          tenant: { select: { name: true, id: true } },
        },
      });

      for (const visit of upcomingVisits) {
        const phone = visit.customer?.phone;
        if (!phone || !visit.scheduledTime) continue;

        const diffMins =
          (visit.scheduledTime.getTime() - now.getTime()) / 60000;
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.qmova.yqbuddy.com'}`;
        const statusUrl = `${baseUrl}/customer/status/${visit.accessToken}`;

        let message: string | null = null;

        // T-15: Get ready reminder
        if (diffMins > 14 && diffMins <= 15) {
          message =
            `🔔 *Reminder!* Your appointment at *${visit.location?.name || visit.tenant?.name}* is in *15 minutes*.\n\n` +
            `📋 Service: *${visit.service?.name}*\n\n` +
            `Head to the location and check in when you arrive: ${statusUrl}`;
        }

        // T-5: Head there now
        if (diffMins > 4 && diffMins <= 5) {
          message =
            `🚶 *Time to head over!* Your appointment at *${visit.location?.name}* is in *5 minutes*.\n\n` +
            `Check in when you arrive: ${statusUrl}`;
        }

        // T+0 to T+10: Overdue — gentle nudge
        if (diffMins < 0 && diffMins >= -10) {
          message =
            `⚠️ *You're late!* Your appointment at *${visit.location?.name}* was scheduled for now.\n\n` +
            `Please check in immediately or your spot may be released: ${statusUrl}\n\n` +
            `Reply *CANCEL* to free your spot.`;
        }

        if (message) {
          await this.notificationsService
            .sendWhatsAppMessage(phone, message, visit.tenant?.id)
            .catch((e) =>
              this.logger.warn(
                `Reminder send failed for visit ${visit.id}: ${e.message}`,
              ),
            );
        }
      }
    });
  }

  /**
   * Clean up expired, unverified OTPs every 10 minutes.
   */
  @Cron('*/10 * * * *')
  async handleOtpCleanup() {
    await this.withDistributedLock('handleOtpCleanup', 500, async () => {
      const result = await this.prisma.checkInOtp.deleteMany({
        where: { expiresAt: { lt: new Date() }, verified: false },
      });
      if (result.count > 0) {
        this.logger.log(`Cleaned up ${result.count} expired check-in OTPs`);
      }
    });
  }

  /**
   * Check for expired SEF steps.
   */
  @Cron('*/15 * * * *')
  async handleExpiredStepsCleanup() {
    await this.withDistributedLock(
      'handleExpiredStepsCleanup',
      800,
      async () => {
        const now = new Date();
        const expiredSteps = await this.prisma.visitStep.findMany({
          where: {
            status: { in: ['PENDING', 'ACTIVE', 'DEFERRED'] },
            expiresAt: { lt: now },
          },
        });

        for (const step of expiredSteps) {
          try {
            await this.prisma.visitStep.update({
              where: { id: step.id },
              data: {
                status: 'SKIPPED',
                completedAt: now,
                staffNotes: 'Auto-skipped due to step expiration',
              },
            });

            // Let the normal SEF engine move them along
            await this.visitStepService.evaluateNextSteps(
              step.visitId,
              step.id,
              'EXPIRED',
            );
          } catch (err) {
            this.logger.error(`Failed to handle expired step ${step.id}`, err);
          }
        }

        if (expiredSteps.length > 0) {
          this.logger.log(
            `Cleaned up ${expiredSteps.length} expired visit steps.`,
          );
        }
      },
    );
  }

  /**
   * SLA Monitor: runs every minute to check if WAITING customers breached their SLA.
   */
  @Cron('* * * * *')
  async handleSlaMonitoring() {
    await this.withDistributedLock('handleSlaMonitoring', 55, async () => {
      const visits = await this.prisma.visit.findMany({
        where: {
          currentState: 'WAITING',
          slaStatus: { not: 'BREACHED' },
          service: { slaPolicyId: { not: null } },
          queue: { status: { not: 'PAUSED' } }, // ✅ Skip paused queues — timers don't run
        },
        include: {
          service: { include: { slaPolicy: true } },
          customer: { select: { name: true } },
          tenant: { select: { id: true, name: true } },
        },
      });

      const now = new Date();
      for (const v of visits) {
        if (!v.waitingStart || !v.service?.slaPolicy) continue;
        const waitMins = (now.getTime() - v.waitingStart.getTime()) / 60000;
        const policy = v.service.slaPolicy;
        let newStatus = v.slaStatus;

        if (
          waitMins >= policy.breachThresholdMins &&
          v.slaStatus !== 'BREACHED'
        ) {
          newStatus = 'BREACHED';
        } else if (
          waitMins >= policy.warningThresholdMins &&
          v.slaStatus === 'OK'
        ) {
          newStatus = 'WARNING';
        }

        if (newStatus !== v.slaStatus) {
          await this.prisma.visit.update({
            where: { id: v.id },
            data: { slaStatus: newStatus },
          });

          if (
            newStatus === 'BREACHED' &&
            policy.escalationPhones &&
            policy.escalationPhones.length > 0
          ) {
            const msg = `🚨 *SLA BREACH* 🚨\nCustomer *${v.customer.name}* has been waiting *${Math.floor(waitMins)} mins* for *${v.service.name}* at *${v.tenant.name}*.`;
            for (const phone of policy.escalationPhones) {
              await this.notificationsService
                .sendWhatsAppMessage(phone, msg, v.tenant.id)
                .catch((e) => this.logger.error(e));
            }
          }
        }
      }
    });
  }

  /**
   * CSAT Surveys: runs every 5 mins, checks for COMPLETED visits ~1hr ago, sends survey.
   */
  @Cron('*/5 * * * *')
  async handleCsatSurveys() {
    await this.withDistributedLock('handleCsatSurveys', 250, async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const oneHourFiveMinsAgo = new Date(Date.now() - 65 * 60 * 1000);

      const visits = await this.prisma.visit.findMany({
        where: {
          currentState: 'COMPLETED',
          surveySent: false,
          completedAt: {
            lte: oneHourAgo,
            gte: oneHourFiveMinsAgo,
          },
          customer: { phone: { not: null } },
        },
        include: {
          customer: { select: { name: true, phone: true } },
          tenant: { select: { id: true } },
          location: { select: { name: true } },
        },
      });

      for (const v of visits) {
        if (!v.customer?.phone) continue;
        const msg = `Hi ${v.customer.name}, thanks for visiting ${v.location.name}! How was your experience? Reply 1 (Terrible) to 5 (Excellent).`;
        await this.notificationsService
          .sendWhatsAppMessage(v.customer.phone, msg, v.tenant.id)
          .catch((e) => this.logger.error(e));
        await this.prisma.visit.update({
          where: { id: v.id },
          data: { surveySent: true },
        });
      }
    });
  }

  /**
   * WAITING_PERIOD Auto-Advance: runs every minute to check if timed preparation/waiting stages have expired.
   */
  @Cron('* * * * *')
  async handleWaitingPeriodAutoAdvance() {
    await this.withDistributedLock('handleWaitingPeriodAutoAdvance', 55, async () => {
      const now = new Date();
      const expiredSteps = await this.prisma.visitStep.findMany({
        where: {
          status: 'ACTIVE',
          type: 'WAITING_PERIOD',
          deferredUntil: { lte: now },
        },
        include: { visit: true },
        take: 50,
      });

      for (const step of expiredSteps) {
        if (
          !step.visit ||
          step.visit.currentState === 'COMPLETED' ||
          step.visit.currentState === 'CANCELLED' ||
          step.visit.currentState === 'NO_SHOW'
        ) {
          continue;
        }
        try {
          await this.visitStepService.advanceStep(
            step.tenantId,
            step.id,
            'SYSTEM',
            { outcome: 'TIMER_ELAPSED' },
          );
          this.logger.log(
            `Auto-advanced waiting/prep step ${step.id} for visit ${step.visitId}`,
          );
        } catch (e) {
          this.logger.error(
            `Failed to auto-advance waiting/prep step ${step.id}`,
            e,
          );
        }
      }
    });
  }
}
