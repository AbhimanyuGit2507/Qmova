import { PrismaService } from '../prisma/prisma.service';
import { ServiceService } from '../service/service.service';
import { AppointmentService } from '../appointment/appointment.service';
import { VisitService } from '../visit/visit.service';
import { TenantPaymentsService } from '../tenant-payments/tenant-payments.service';
import { normalizePhoneZA, phoneMatchCondition } from '../utils/phone.util';

export class WhatsappChatbot {
  constructor(
    private prisma: PrismaService,
    private sendMsg: (jid: string, text: string) => Promise<void>,
    private sendListMsg: (jid: string, payload: any) => Promise<void>,
    private serviceService?: ServiceService,
    private appointmentService?: AppointmentService,
    private visitService?: VisitService,
    private tenantPaymentsService?: TenantPaymentsService,
  ) {}

  async process(
    tenant: any,
    phone: string,
    jid: string,
    rawText: string,
  ): Promise<{ handled: boolean; isHumanPaused: boolean }> {
    const text = rawText.trim();
    const upperText = text.toUpperCase();
    const tenantId = tenant.id;

    // Default configuration if missing
    const config = tenant.chatbotConfig || {
      botName: 'Assistant',
      welcomeMessage: 'Hi there! How can I help you today?',
      quickReplies: { status: true, cancel: true, human: true },
    };

    const normalizedPhone = normalizePhoneZA(phone);
    const session = await this.prisma.chatSession.upsert({
      where: { tenantId_phone: { tenantId, phone: normalizedPhone } },
      create: { tenantId, phone: normalizedPhone, step: 0, context: {} },
      update: { lastActive: new Date() },
    });

    // Auto-expire sessions older than 24 hours back to initial step 0
    const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000;
    if (
      session.lastActive &&
      Date.now() - new Date(session.lastActive).getTime() > SESSION_TIMEOUT_MS &&
      session.step !== 0
    ) {
      await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { step: 0, context: {}, lastActive: new Date() },
      });
      session.step = 0;
      (session as any).context = {};
    }

    const isGreeting = ['HI', 'HELLO', 'HEY', 'START', 'MENU', '0'].includes(
      upperText,
    );
    const isTransactionalReply = [
      'OK',
      'OKAY',
      'THANKS',
      'THANK YOU',
      '👍',
    ].includes(upperText);

    // If human mode is active, block the bot from auto-replying unless they say MENU
    if (session.context && (session.context as any).isHumanPaused) {
      if (isGreeting) {
        // User wants to exit human mode and go back to bot
        await this.updateSession(session.id, 0, {});
        await this.sendMenu(jid, config);
        return { handled: true, isHumanPaused: false };
      }
      // Return that it's paused so the service can log it
      return { handled: true, isHumanPaused: true };
    }

    if (isTransactionalReply) {
      // Just ignore it entirely to not annoy the customer when they say Thanks to automated alerts
      return { handled: true, isHumanPaused: false };
    }

    if (isGreeting) {
      await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { step: 0, context: {} },
      });
      await this.sendMenu(jid, config);
      return { handled: true, isHumanPaused: false };
    }

    // Process Menu Options
    if (session.step === 0) {
      let index = 1;
      const statusOption =
        config.quickReplies?.status !== false ? (index++).toString() : null;
      const humanOption =
        config.quickReplies?.human !== false ? (index++).toString() : null;
      const bookOption = (index++).toString();
      const cancelOption =
        config.quickReplies?.cancel !== false ? (index++).toString() : null;

      if (
        statusOption &&
        (upperText === statusOption ||
          upperText.includes('STATUS') ||
          upperText === 'check_status')
      ) {
        await this.handleStatusCheck(tenantId, phone, jid);
        return { handled: true, isHumanPaused: false };
      }

      if (
        upperText.includes('CHECKIN') ||
        upperText.includes('CHECK IN') ||
        upperText === 'CHECK-IN' ||
        upperText === 'check_in'
      ) {
        await this.handleAppointmentCheckin(tenantId, phone, jid);
        return { handled: true, isHumanPaused: false };
      }

      if (
        upperText === 'PAY' ||
        upperText.includes('PAY ONLINE') ||
        upperText.includes('PAYMENT') ||
        upperText === 'pay_online'
      ) {
        await this.handlePaymentRequest(tenantId, phone, jid);
        return { handled: true, isHumanPaused: false };
      }

      if (
        humanOption &&
        (upperText === humanOption ||
          upperText.includes('HUMAN') ||
          upperText.includes('AGENT') ||
          upperText.includes('SUPPORT') ||
          upperText === 'chat_human')
      ) {
        await this.sendMsg(
          jid,
          'I have paused automated replies. A human agent will respond to you shortly.',
        );
        await this.updateSession(session.id, undefined, {
          isHumanPaused: true,
        });
        return { handled: true, isHumanPaused: true }; // Trigger inbox saving
      }

      if (
        cancelOption &&
        (upperText === cancelOption ||
          upperText.includes('CANCEL') ||
          upperText === 'cancel_ticket')
      ) {
        await this.handleCancel(tenantId, phone, jid);
        return { handled: true, isHumanPaused: false };
      }

      if (
        upperText === bookOption ||
        upperText.includes('BOOK') ||
        upperText.includes('APPOINTMENT') ||
        upperText === 'book_new'
      ) {
        await this.handleBookingStart(tenantId, phone, jid, session);
        return { handled: true, isHumanPaused: false };
      }
    }

    if (session.step === 10) {
      await this.handleLocationSelection(tenantId, phone, jid, session, text);
      return { handled: true, isHumanPaused: false };
    }

    if (session.step === 11) {
      await this.handleServiceSelection(tenantId, phone, jid, session, text);
      return { handled: true, isHumanPaused: false };
    }

    if (session.step === 12) {
      await this.handleModeSelection(tenantId, phone, jid, session, text);
      return { handled: true, isHumanPaused: false };
    }

    if (session.step === 13) {
      await this.handleDateSelection(tenantId, phone, jid, session, text);
      return { handled: true, isHumanPaused: false };
    }

    if (session.step === 14) {
      await this.handleTimeSelection(tenantId, phone, jid, session, text);
      return { handled: true, isHumanPaused: false };
    }

    if (session.step === 15) {
      await this.handleCatalogSelection(tenantId, phone, jid, session, text);
      return { handled: true, isHumanPaused: false };
    }

    if (session.step === 16) {
      await this.handleNameInput(tenantId, phone, jid, session, text);
      return { handled: true, isHumanPaused: false };
    }

    if (session.step === 17) {
      await this.handlePaymentMethodSelection(tenantId, phone, jid, session, text);
      return { handled: true, isHumanPaused: false };
    }

    if (session.step === 18) {
      await this.handlePendingPaymentState(tenantId, phone, jid, session, text);
      return { handled: true, isHumanPaused: false };
    }

    if (session.step === 20) {
      await this.handleReviewRating(tenantId, phone, jid, session, text);
      return { handled: true, isHumanPaused: false };
    }

    // Fallback: If they typed something we didn't understand, reset step and show menu
    await this.updateSession(session.id, 0, {});

    if (
      ['[IMAGE]', '[AUDIO]', '[VIDEO]', '[DOCUMENT]', '[STICKER]'].includes(
        upperText,
      )
    ) {
      await this.sendMsg(
        jid,
        'I am an automated assistant and cannot process media files like images or audio right now. Please select an option from the menu below:',
      );
    }

    await this.sendMenu(jid, config);
    return { handled: true, isHumanPaused: false };
  }

  private async sendMenu(jid: string, config: any) {
    const botName = config?.botName || 'Assistant';
    const welcome =
      config?.welcomeMessage || 'Hi there! How can I help you today?';

    let msg = `*${botName}*\n\n${welcome}\n\n`;

    const quickReplies = config?.quickReplies || {
      status: true,
      cancel: true,
      human: true,
    };

    let index = 1;
    if (quickReplies.status !== false) {
      msg += `${index++}. Check Status\n`;
    }
    if (quickReplies.human !== false) {
      msg += `${index++}. Chat with Human\n`;
    }
    msg += `${index++}. Book a Service / Join Line\n`;
    if (quickReplies.cancel !== false) {
      msg += `${index++}. Cancel Ticket\n`;
    }
    msg += `\nReply with a number to proceed.`;

    await this.sendMsg(jid, msg);
  }

  /**
   * FIX (1C): Migrated from deprecated `prisma.token` to `prisma.visit`.
   * The Token table is empty — all queue data now lives in the Visit model.
   * We find an active Visit by matching the customer's phone number against
   * the Customer record linked to the Visit.
   */
  private async handleStatusCheck(
    tenantId: string,
    phone: string,
    jid: string,
  ) {
    const visit = await this.prisma.visit.findFirst({
      where: {
        tenantId,
        customer: {
          phone: phoneMatchCondition(phone),
        },
        currentState: { in: ['WAITING', 'CHECKED_IN', 'IN_SERVICE'] },
      },
      include: {
        queue: { select: { name: true } },
        service: { select: { name: true, basePrice: true } },
        location: { select: { name: true } },
        visitSteps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!visit) {
      // Check if user has an upcoming appointment scheduled for TODAY
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayAppt = await this.prisma.appointment.findFirst({
        where: {
          tenantId,
          customer: { phone: phoneMatchCondition(phone) },
          scheduledStart: { gte: todayStart, lte: todayEnd },
          status: { in: ['CONFIRMED', 'SCHEDULED'] },
        },
        include: {
          service: { select: { name: true } },
          location: { select: { name: true } },
        },
        orderBy: { scheduledStart: 'asc' },
      });

      if (todayAppt) {
        const timeStr = new Date(todayAppt.scheduledStart).toLocaleTimeString(
          [],
          {
            hour: '2-digit',
            minute: '2-digit',
          },
        );
        const serviceName = todayAppt.service?.name || 'Appointment';
        const locName = todayAppt.location?.name
          ? ` at *${todayAppt.location.name}*`
          : '';

        await this.sendMsg(
          jid,
          `📅 *Upcoming Appointment Today*\n\n` +
            `Service: *${serviceName}*${locName}\n` +
            `Time: *${timeStr}*\n` +
            `Status: *${todayAppt.status}*\n\n` +
            `Ready to join the queue? Reply *CHECKIN* to check in now and receive your live ticket!`,
        );
        return;
      }

      await this.sendMsg(
        jid,
        "I couldn't find any active queue tickets or appointments scheduled for today under this number.\n\nReply '0' for the main menu.",
      );
      return;
    }

    const baseAppUrl =
      process.env.APP_URL ||
      (process.env.DOMAIN_BASE
        ? `https://${process.env.DOMAIN_BASE}`
        : 'https://qmova.yqbuddy.com');
    const trackerUrl = `${baseAppUrl}/customer/status/${visit.id}`;

    if (visit.currentState === 'IN_SERVICE') {
      let inServiceMsg = `🟢 *Your ticket ${visit.displayId || 'Unknown'} is currently being served!*\n\n`;
      if (visit.service?.name)
        inServiceMsg += `Service: *${visit.service.name}*\n`;
      if (visit.location?.name)
        inServiceMsg += `Location: *${visit.location.name}*\n`;
      inServiceMsg += `\nPlease proceed to the service counter now.\n\n📲 Live Tracker:\n🔗 ${trackerUrl}`;
      await this.sendMsg(jid, inServiceMsg);
      return;
    }

    // Calculate position — count visits created before this one that are still waiting
    const position = await this.prisma.visit.count({
      where: {
        queueId: visit.queueId,
        currentState: { in: ['WAITING', 'CHECKED_IN'] },
        createdAt: { lt: visit.createdAt },
      },
    });

    const queueName = visit.queue?.name || 'Main Queue';
    const serviceName = visit.service?.name || '';
    const locName = visit.location?.name || '';

    let msg = `🎫 *Live Ticket: ${visit.displayId || 'In Queue'}*\n`;
    if (locName) msg += `📍 Location: *${locName}*\n`;
    if (serviceName) msg += `💼 Service: *${serviceName}*\n`;
    msg += `👥 Queue: *${queueName}*\n\n`;

    msg += `⏳ *Status:* Waiting in Queue\n`;
    msg += `🔢 Ahead of you: *${position}* ${position === 1 ? 'person' : 'people'}\n`;

    // Multi-stage Journey Builder inspection
    const steps = visit.visitSteps;
    if (steps && steps.length > 0) {
      const totalSteps = steps.length;
      const activeStep: any =
        steps.find((s: any) => s.status === 'ACTIVE') ||
        steps.find((s: any) => s.status === 'QUEUED') ||
        steps.find((s: any) => s.status === 'PENDING') ||
        steps[0];
      const activeIdx = steps.findIndex((s: any) => s.id === activeStep?.id);

      if (totalSteps > 1) {
        msg += `\n🔄 *Journey Progress:* Stage ${activeIdx + 1} of ${totalSteps}\n`;
        msg += `📍 Current Stage: *${activeStep.name || activeStep.type}*\n`;
        if (activeIdx + 1 < totalSteps) {
          const nextStep = steps[activeIdx + 1];
          msg += `➡️ Next Up: ${nextStep.name || nextStep.type}\n`;
        }
      }

      if (
        activeStep?.type === 'PAYMENT' &&
        activeStep.paymentStatus !== 'PAID' &&
        activeStep.amountCharged
      ) {
        const amountFormatted = (activeStep.amountCharged / 100).toFixed(2);
        const appBase =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.APP_URL ||
          'https://qmova.yqbuddy.com';
        const directPayUrl = `${appBase}/pay/${activeStep.id}`;
        msg += `\n💳 *Payment Due: R${amountFormatted}*\n`;
        msg += `Pay online securely:\n🔗 ${directPayUrl}\n`;
        msg += `Or pay at the counter before proceeding.\n`;
      }
    }

    msg += `\n📲 *Live Updates & Mobile Calling:*\n🔗 ${trackerUrl}\n\n`;
    msg += `Reply '0' for the main menu.`;

    await this.sendMsg(jid, msg);
  }

  /**
   * Directly handles customer asking to pay or settle their bill
   */
  private async handlePaymentRequest(
    tenantId: string,
    phone: string,
    jid: string,
  ) {
    const visit = await this.prisma.visit.findFirst({
      where: {
        tenantId,
        customer: { phone: phoneMatchCondition(phone) },
        currentState: { in: ['WAITING', 'CHECKED_IN', 'IN_SERVICE'] },
      },
      include: {
        service: true,
        tenant: true,
        visitSteps: { orderBy: { stepOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!visit) {
      await this.sendMsg(
        jid,
        `You don't have an active queue ticket with pending payments right now.\n\nReply '1' to check your queue status or '0' for the main menu.`,
      );
      return;
    }

    const paymentStep = visit.visitSteps?.find(
      (s: any) =>
        (s.type === 'PAYMENT' || s.templateStep?.type === 'PAYMENT') &&
        s.paymentStatus !== 'PAID' &&
        s.status !== 'COMPLETED',
    );

    const appBase =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      'https://qmova.yqbuddy.com';

    if (paymentStep) {
      const payUrl = `${appBase}/pay/${paymentStep.id}`;
      const amount = paymentStep.amountCharged
        ? `R${(paymentStep.amountCharged / 100).toFixed(2)}`
        : null;

      await this.sendMsg(
        jid,
        `💳 *Payment Required for Ticket #${visit.displayId}*\n\n` +
          `Service: *${visit.service?.name || 'Service'}*\n` +
          (amount ? `Amount Due: *${amount}*\n\n` : '\n') +
          `Click below to complete your payment securely via Card / Stripe:\n🔗 ${payUrl}\n\n` +
          `Once paid, your ticket will advance to the next step automatically.`,
      );
      return;
    }

    const trackerUrl = `${appBase}/customer/status/${visit.id}`;
    await this.sendMsg(
      jid,
      `✅ You have no outstanding payments due for ticket *#${visit.displayId}*.\n\n` +
        `Live ticket tracker:\n🔗 ${trackerUrl}\n\n` +
        `Reply '0' for the main menu.`,
    );
  }

  /**
   * 1-Click WhatsApp Check-in for Today's Scheduled Appointments
   */
  private async handleAppointmentCheckin(
    tenantId: string,
    phone: string,
    jid: string,
  ) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const appt = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        customer: { phone: phoneMatchCondition(phone) },
        scheduledStart: { gte: todayStart, lte: todayEnd },
        status: { in: ['CONFIRMED', 'SCHEDULED'] },
      },
      include: {
        customer: true,
        service: true,
        location: true,
      },
      orderBy: { scheduledStart: 'asc' },
    });

    if (!appt) {
      await this.sendMsg(
        jid,
        `I couldn't find an appointment scheduled for today under this phone number.\n\nReply *0* for the main menu to check status or book an appointment.`,
      );
      return;
    }

    // Check if customer already has an active visit
    if (appt.customerId) {
      const existingVisit = await this.prisma.visit.findFirst({
        where: {
          tenantId,
          customerId: appt.customerId,
          currentState: { in: ['WAITING', 'CHECKED_IN', 'IN_SERVICE'] },
        },
      });

      if (existingVisit) {
        await this.sendMsg(
          jid,
          `You are already checked in with Ticket *${existingVisit.displayId}*!\n\nReply *1* to check your live queue position and journey status.`,
        );
        return;
      }
    }

    // Determine target queue
    const queue = await this.prisma.queue.findFirst({
      where: {
        tenantId,
        locationId: appt.locationId,
        status: 'ACTIVE',
      },
    });

    if (!queue) {
      await this.sendMsg(
        jid,
        `⚠️ Could not automatically check you in: no open queue found for this location. Please approach the front desk.`,
      );
      return;
    }

    try {
      let createdVisit: any = null;
      if (this.visitService) {
        createdVisit = await this.visitService.joinQueue(queue.id, {
          name: appt.customer?.name || 'Guest',
          phone: appt.customer?.phone || phone,
          serviceId: appt.serviceId,
        });
        if (createdVisit?.id) {
          await this.prisma.visit.update({
            where: { id: createdVisit.id },
            data: { appointmentId: appt.id },
          });
        }
      }

      if (!createdVisit) {
        throw new Error('Could not create queue ticket');
      }

      // Mark appointment as checked in
      await this.prisma.appointment.update({
        where: { id: appt.id },
        data: { status: 'CHECKED_IN' },
      });

      const baseAppUrl =
        process.env.APP_URL ||
        (process.env.DOMAIN_BASE
          ? `https://${process.env.DOMAIN_BASE}`
          : 'https://qmova.yqbuddy.com');
      const trackerUrl = `${baseAppUrl}/customer/status/${createdVisit.id}`;

      await this.sendMsg(
        jid,
        `✅ *Check-In Successful!*\n\n` +
          `🎫 Ticket Number: *${createdVisit.displayId || 'Checked In'}*\n` +
          `💼 Service: *${appt.service?.name || 'General'}*\n` +
          `📍 Location: *${appt.location?.name || 'Main Branch'}*\n\n` +
          `You have joined the queue. You can track your position live and be notified when called here:\n` +
          `🔗 ${trackerUrl}\n\n` +
          `Reply *1* at any time to check your status.`,
      );
    } catch (err: any) {
      await this.sendMsg(
        jid,
        `Sorry, we encountered an error checking you in. Please see the front desk for assistance.`,
      );
    }
  }

  /**
   * FIX (1C): Migrated from deprecated `prisma.token` to `prisma.visit`.
   * Cancel by setting Visit.currentState to 'CANCELLED'.
   */
  private async handleCancel(tenantId: string, phone: string, jid: string) {
    const visit = await this.prisma.visit.findFirst({
      where: {
        tenantId,
        customer: {
          phone: phoneMatchCondition(phone),
        },
        currentState: { in: ['WAITING', 'CHECKED_IN'] },
      },
      include: {
        queue: { select: { name: true } },
        tenant: true,
      },
    });

    if (!visit) {
      await this.sendMsg(
        jid,
        "I couldn't find any active tickets to cancel for this number.\n\nReply '0' for the main menu.",
      );
      return;
    }

    const hasPayment = await this.prisma.bookingPayment.findFirst({
      where: { visitId: visit.id, status: 'SUCCEEDED' },
    });

    if (hasPayment) {
      const tenantEmail = visit.tenant.supportEmail || 'the business directly';
      await this.sendMsg(
        jid,
        `Your ticket *${visit.displayId || 'Unknown'}* has an active payment and cannot be cancelled automatically.\n\nPlease contact ${tenantEmail} for assistance with cancellations and refunds.\n\nReply '0' for the main menu.`,
      );
      return;
    }

    const existingMeta =
      typeof visit.metadata === 'object' && visit.metadata !== null
        ? (visit.metadata as Record<string, any>)
        : {};

    const updated = await this.prisma.visit.update({
      where: { id: visit.id },
      data: {
        currentState: 'CANCELLED',
        completedAt: new Date(),
        cancelledBy: 'CUSTOMER',
        cancelReason: 'Cancelled by customer via WhatsApp',
        metadata: {
          ...existingMeta,
          cancellation: {
            reason: 'Cancelled by customer via WhatsApp',
            category: 'CUSTOMER_REQUEST',
            cancelledAt: new Date().toISOString(),
            cancelledBy: 'CUSTOMER',
          },
        },
      },
    });

    if (visit.appointmentId) {
      await this.prisma.appointment
        .update({
          where: { id: visit.appointmentId },
          data: { status: 'CANCELLED' },
        })
        .catch(() => null);
    }

    await this.prisma.outboxEvent.create({
      data: {
        type: 'VISIT_CANCELLED',
        payload: {
          visitId: updated.id,
          queueId: updated.queueId,
          tenantId: updated.tenantId,
          cancelledBy: 'CUSTOMER',
          cancelReason: 'Cancelled by customer via WhatsApp',
          reasonCategory: 'CUSTOMER_REQUEST',
        },
      },
    });

    const queueName = visit.queue?.name || 'queue';
    await this.sendMsg(
      jid,
      `Your ticket *${visit.displayId || 'Unknown'}* in the *${queueName}* queue has been successfully cancelled.\n\nReply '0' for the main menu.`,
    );
  }
  private async handleBookingStart(
    tenantId: string,
    phone: string,
    jid: string,
    session: any,
  ) {
    const locations = await this.prisma.location.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    if (locations.length === 0) {
      await this.sendMsg(
        jid,
        "Booking is currently unavailable (no locations setup).\n\nReply '0' for the main menu.",
      );
      return;
    }

    if (locations.length === 1) {
      // Skip location selection if only one exists
      await this.updateSession(session.id, 11, { locationId: locations[0].id });
      await this.promptServices(tenantId, locations[0].id, jid, session);
      return;
    }

    // Multiple locations: Prompt location selection
    let msg = `Please select a location:\n\n`;
    locations.forEach((loc, index) => {
      msg += `${index + 1}. ${loc.name}\n`;
    });
    msg += `\nReply with a number, or '0' to cancel.`;

    await this.updateSession(session.id, 10, {
      locations: locations.map((l) => l.id),
    });

    await this.sendMsg(jid, msg);
  }

  private async handleLocationSelection(
    tenantId: string,
    phone: string,
    jid: string,
    session: any,
    text: string,
  ) {
    const currentSession = await this.prisma.chatSession.findUnique({
      where: { id: session.id },
    });
    const ctx = (currentSession?.context as any) || {};
    const locations = ctx.locations || [];
    const index = parseInt(text) - 1;

    if (isNaN(index) || index < 0 || index >= locations.length) {
      await this.sendMsg(
        jid,
        'Invalid selection. Please reply with a valid number, or 0 to cancel.',
      );
      return;
    }

    const locationId = locations[index];
    await this.updateSession(session.id, 11, {
      locationId,
      locations: undefined,
    });

    await this.promptServices(tenantId, locationId, jid, session);
  }

  private async promptServices(
    tenantId: string,
    locationId: string,
    jid: string,
    session: any,
  ) {
    const services = await this.prisma.service.findMany({
      where: { tenantId, locationId: locationId },
      orderBy: { name: 'asc' },
    });

    if (services.length === 0) {
      await this.sendMsg(
        jid,
        "No services available at this location.\n\nReply '0' for the main menu.",
      );
      return;
    }

    let msg = `Please select a service:\n\n`;
    services.forEach((s, index) => {
      const priceStr =
        s.basePrice && s.basePrice > 0
          ? ` • R${(s.basePrice / 100).toFixed(2)}`
          : '';
      const durationStr = s.expectedDuration
        ? ` • ${s.expectedDuration} mins`
        : '';
      msg += `${index + 1}. *${s.name}*${priceStr}${durationStr}\n`;
    });
    msg += `\nReply with a number, or '0' to cancel.`;

    await this.updateSession(session.id, 11, {
      services: services.map((s) => s.id),
    });

    await this.sendMsg(jid, msg);
  }

  private async handleServiceSelection(
    tenantId: string,
    phone: string,
    jid: string,
    session: any,
    text: string,
  ) {
    const currentSession = await this.prisma.chatSession.findUnique({
      where: { id: session.id },
    });
    const currentCtx = (currentSession?.context as any) || {};
    const services = currentCtx.services || [];
    const index = parseInt(text) - 1;

    if (isNaN(index) || index < 0 || index >= services.length) {
      await this.sendMsg(
        jid,
        'Invalid selection. Please reply with a valid number, or 0 to cancel.',
      );
      return;
    }

    const serviceId = services[index];

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { location: true, queues: true },
    });

    if (!service) {
      await this.sendMsg(jid, "Service not found. Reply '0' for the main menu.");
      await this.updateSession(session.id, 0, {});
      return;
    }

    const allowAppointments = Boolean(service.allowAppointments);
    const allowWalkIns =
      Boolean(service.queues && service.queues.length > 0) || !allowAppointments;

    if (allowWalkIns && allowAppointments) {
      // Prompt mode selection (Step 12)
      let msg = `How would you like to join *${service.name}*?\n\n`;
      msg += `1. 🚶 *Walk-in (Join Queue Now)*\n`;
      msg += `2. 📅 *Schedule Appointment for Later*\n\n`;
      msg += `Reply *1* or *2*, or '0' to cancel.`;

      await this.updateSession(session.id, 12, {
        serviceId,
        services: undefined,
      });

      await this.sendMsg(jid, msg);
    } else if (allowAppointments && !allowWalkIns) {
      // Appointment only
      await this.updateSession(session.id, undefined, {
        serviceId,
        mode: 'APPOINTMENT',
        services: undefined,
      });
      await this.promptDates(service, jid, session);
    } else {
      // Walk-in only (or fallback)
      await this.updateSession(session.id, undefined, {
        serviceId,
        mode: 'WALK_IN',
        services: undefined,
      });
      await this.checkAndPromptCatalogOrName(
        tenantId,
        phone,
        jid,
        session,
        serviceId,
        'WALK_IN',
      );
    }
  }

  private async handleModeSelection(
    tenantId: string,
    phone: string,
    jid: string,
    session: any,
    text: string,
  ) {
    const input = text.trim();
    if (input === '0') {
      await this.sendMsg(jid, "Booking cancelled. Reply '0' for the main menu.");
      await this.updateSession(session.id, 0, {});
      return;
    }

    const currentSession = await this.prisma.chatSession.findUnique({
      where: { id: session.id },
    });
    const ctx = (currentSession?.context as any) || {};
    const serviceId = ctx.serviceId;

    if (!serviceId) {
      await this.sendMsg(jid, "Session expired. Reply '0' for the main menu.");
      await this.updateSession(session.id, 0, {});
      return;
    }

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { location: true },
    });

    if (!service) {
      await this.sendMsg(jid, "Service not found. Reply '0' for the main menu.");
      await this.updateSession(session.id, 0, {});
      return;
    }

    if (input === '1') {
      // Walk-in
      await this.updateSession(session.id, undefined, { mode: 'WALK_IN' });
      await this.checkAndPromptCatalogOrName(
        tenantId,
        phone,
        jid,
        session,
        serviceId,
        'WALK_IN',
      );
    } else if (input === '2') {
      // Appointment
      await this.updateSession(session.id, undefined, { mode: 'APPOINTMENT' });
      await this.promptDates(service, jid, session);
    } else {
      await this.sendMsg(
        jid,
        'Invalid option. Please reply *1* for Walk-in or *2* for Appointment, or *0* to cancel.',
      );
    }
  }

  private async promptDates(service: any, jid: string, session: any) {
    if (!this.serviceService) {
      await this.sendMsg(jid, 'Booking service unavailable at this moment.');
      return;
    }

    const timezone = service?.location?.timezone || 'UTC';
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const now = new Date();
    const todayStr = formatter.format(now);

    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = formatter.format(tomorrowDate);

    const availableDates: string[] = [];
    const maxDaysToCheck = 14;
    let daysChecked = 0;
    const dateToCheck = new Date(now);

    while (availableDates.length < 3 && daysChecked < maxDaysToCheck) {
      const dateStr = formatter.format(dateToCheck);
      const slots = await this.serviceService.getAvailableSlots(
        service.id,
        dateStr,
      );

      let hasAvailable = false;
      if (slots && slots.length > 0) {
        if (dateStr === todayStr) {
          hasAvailable = slots.some(
            (s) => new Date(s.time) > now && s.available,
          );
        } else {
          hasAvailable = slots.some((s) => s.available);
        }
      }

      if (hasAvailable && !availableDates.includes(dateStr)) {
        availableDates.push(dateStr);
      }

      dateToCheck.setDate(dateToCheck.getDate() + 1);
      daysChecked++;
    }

    if (availableDates.length === 0) {
      await this.sendMsg(
        jid,
        'No available dates found in the next 14 days. Please try again later.\n\nReply 0 for main menu.',
      );
      await this.updateSession(session.id, 0, {});
      return;
    }

    let msg = `When would you like to book?\n\n`;
    availableDates.forEach((d, i) => {
      const isToday = d === todayStr;
      const isTomorrow = d === tomorrowStr;

      let label = d;
      if (isToday) label = `Today (${d})`;
      else if (isTomorrow) label = `Tomorrow (${d})`;
      else {
        const localDate = new Date(d + 'T00:00:00');
        const dayOfWeek = localDate.toLocaleDateString('en-US', {
          weekday: 'long',
        });
        label = `${dayOfWeek} (${d})`;
      }

      msg += `${i + 1}. ${label}\n`;
    });
    msg += `\nReply with a number, or '0' to cancel.`;

    await this.updateSession(session.id, 13, {
      serviceId: service.id,
      dates: availableDates,
    });

    await this.sendMsg(jid, msg);
  }

  private async handleDateSelection(
    tenantId: string,
    phone: string,
    jid: string,
    session: any,
    text: string,
  ) {
    const raw = text.trim();
    if (raw === '0') {
      await this.sendMsg(jid, "Booking cancelled. Reply '0' for the main menu.");
      await this.updateSession(session.id, 0, {});
      return;
    }

    const currentSession = await this.prisma.chatSession.findUnique({
      where: { id: session.id },
    });
    const ctx = (currentSession?.context as any) || {};
    const dates = ctx.dates || [];
    const index = parseInt(raw) - 1;

    if (isNaN(index) || index < 0 || index >= dates.length) {
      await this.sendMsg(
        jid,
        `Invalid selection. Please reply with a number from 1 to ${dates.length}, or '0' to cancel.`,
      );
      return;
    }

    const date = dates[index];
    const serviceId = ctx.serviceId;

    if (!this.serviceService) {
      await this.sendMsg(jid, 'Booking service unavailable at this moment.');
      return;
    }

    const slots = await this.serviceService.getAvailableSlots(serviceId, date);

    if (!slots || slots.length === 0) {
      await this.sendMsg(
        jid,
        `No slots available on ${date}. Please reply '0' to start over.`,
      );
      return;
    }

    const now = new Date();
    const futureSlots = slots
      .filter((s) => new Date(s.time) > now && s.available)
      .slice(0, 5);

    if (futureSlots.length === 0) {
      await this.sendMsg(
        jid,
        `No more slots available today on ${date}. Please reply '0' to start over.`,
      );
      return;
    }

    let msg = `Available time slots for ${date}:\n\n`;
    futureSlots.forEach((slot, i) => {
      msg += `${i + 1}. ${new Date(slot.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
    });
    msg += `\nReply with a number, or '0' to cancel.`;

    await this.updateSession(session.id, 14, {
      date,
      slots: futureSlots,
      dates: undefined,
    });

    await this.sendMsg(jid, msg);
  }

  private async handleTimeSelection(
    tenantId: string,
    phone: string,
    jid: string,
    session: any,
    text: string,
  ) {
    const raw = text.trim();
    if (raw === '0') {
      await this.sendMsg(jid, "Booking cancelled. Reply '0' for the main menu.");
      await this.updateSession(session.id, 0, {});
      return;
    }

    const currentSession = await this.prisma.chatSession.findUnique({
      where: { id: session.id },
    });
    const ctx = (currentSession?.context as any) || {};
    const slots = ctx.slots || [];
    const index = parseInt(raw) - 1;

    if (isNaN(index) || index < 0 || index >= slots.length) {
      await this.sendMsg(
        jid,
        'Invalid selection. Please reply with a valid number, or 0 to cancel.',
      );
      return;
    }

    const selectedSlot = slots[index];

    await this.updateSession(session.id, undefined, {
      selectedSlot,
      slots: undefined,
    });

    await this.checkAndPromptCatalogOrName(
      tenantId,
      phone,
      jid,
      session,
      ctx.serviceId,
      'APPOINTMENT',
      selectedSlot,
    );
  }

  private async checkAndPromptCatalogOrName(
    tenantId: string,
    phone: string,
    jid: string,
    session: any,
    serviceId: string,
    mode: 'WALK_IN' | 'APPOINTMENT',
    selectedSlot?: any,
  ) {
    const catalogItems = await this.prisma.serviceCatalogItem.findMany({
      where: {
        catalog: { serviceId },
        isAvailable: true,
      },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    if (catalogItems.length > 0) {
      let msg = `🍽️ *Menu & Add-ons (Optional)*\n\n`;
      let currentCat = '';
      catalogItems.forEach((item, idx) => {
        if (item.category && item.category !== currentCat) {
          currentCat = item.category;
          msg += `*— ${currentCat} —*\n`;
        }
        const price = (item.unitPrice / 100).toFixed(2);
        msg += `${idx + 1}. ${item.name} — *R${price}*\n`;
      });
      msg += `\nReply with item numbers separated by commas (e.g. *1, 3* or *2*), or reply *0* to skip.\nReply *00* to cancel.`;

      await this.updateSession(session.id, 15, {
        serviceId,
        mode,
        selectedSlot,
        catalogItems: catalogItems.map((it) => ({
          id: it.id,
          name: it.name,
          category: it.category,
          priceCents: it.unitPrice,
        })),
      });

      await this.sendMsg(jid, msg);
    } else {
      await this.updateSession(session.id, 16, {
        serviceId,
        mode,
        selectedSlot,
        selectedItems: [],
        menuTotal: 0,
      });
      await this.promptNameInput(tenantId, phone, jid, session);
    }
  }

  private async handleCatalogSelection(
    tenantId: string,
    phone: string,
    jid: string,
    session: any,
    text: string,
  ) {
    const raw = text.trim();
    if (raw === '00') {
      await this.sendMsg(jid, "Booking cancelled. Reply '0' for the main menu.");
      await this.updateSession(session.id, 0, {});
      return;
    }

    const currentSession = await this.prisma.chatSession.findUnique({
      where: { id: session.id },
    });
    const ctx = (currentSession?.context as any) || {};
    const catalogItems: any[] = ctx.catalogItems || [];

    let selectedItems: any[] = [];
    let menuTotal = 0;

    if (
      raw !== '0' &&
      raw.toUpperCase() !== 'SKIP' &&
      raw.toUpperCase() !== 'NONE'
    ) {
      const parts = raw
        .split(/[,\s]+/)
        .map((p) => parseInt(p.trim()))
        .filter((n) => !isNaN(n));
      const chosenIndexes = Array.from(new Set(parts));

      const validItems: any[] = [];
      for (const num of chosenIndexes) {
        const itemIdx = num - 1;
        if (itemIdx >= 0 && itemIdx < catalogItems.length) {
          validItems.push(catalogItems[itemIdx]);
        }
      }

      if (validItems.length === 0 && chosenIndexes.length > 0) {
        await this.sendMsg(
          jid,
          'Invalid selection. Please reply with valid item numbers (e.g. *1, 3*), or reply *0* to skip:',
        );
        return;
      }

      selectedItems = validItems.map((v) => ({
        id: v.id,
        name: v.name,
        category: v.category,
        priceCents: v.priceCents,
        quantity: 1,
      }));
      menuTotal = selectedItems.reduce(
        (acc, it) => acc + (it.priceCents || 0),
        0,
      );
    }

    await this.updateSession(session.id, 16, {
      selectedItems,
      menuTotal,
      catalogItems: undefined,
    });

    await this.promptNameInput(tenantId, phone, jid, session);
  }

  private async promptNameInput(
    tenantId: string,
    phone: string,
    jid: string,
    session: any,
  ) {
    const existingCustomer = await this.prisma.customer.findFirst({
      where: { tenantId, phone: phoneMatchCondition(phone) },
    });

    if (
      existingCustomer?.name &&
      existingCustomer.name !== 'Walk-in' &&
      existingCustomer.name !== 'Guest'
    ) {
      let msg = `👤 Confirm booking for *${existingCustomer.name}*?\n\n`;
      msg += `Reply *1* to confirm, or reply with your full name if different:\nReply '0' to cancel.`;
      await this.sendMsg(jid, msg);
    } else {
      let msg = `👤 Please reply with your *Full Name* to confirm your booking:\n\nReply '0' to cancel.`;
      await this.sendMsg(jid, msg);
    }
  }

  private async handleNameInput(
    tenantId: string,
    phone: string,
    jid: string,
    session: any,
    text: string,
  ) {
    const raw = text.trim();
    if (raw === '0') {
      await this.sendMsg(jid, "Booking cancelled. Reply '0' for the main menu.");
      await this.updateSession(session.id, 0, {});
      return;
    }

    let customerName = raw;
    if (raw === '1' || raw.toUpperCase() === 'YES') {
      const existing = await this.prisma.customer.findFirst({
        where: { tenantId, phone: phoneMatchCondition(phone) },
      });
      if (existing?.name) {
        customerName = existing.name;
      }
    }

    if (!customerName || customerName.length < 2) {
      await this.sendMsg(
        jid,
        'Please reply with a valid name (at least 2 letters):',
      );
      return;
    }

    const currentSession = await this.prisma.chatSession.findUnique({
      where: { id: session.id },
    });
    const ctx = (currentSession?.context as any) || {};

    const serviceId = ctx.serviceId;
    const mode = ctx.mode || 'WALK_IN';
    const selectedSlot = ctx.selectedSlot;
    const selectedItems = ctx.selectedItems || [];
    const menuTotal = ctx.menuTotal || 0;

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { location: true },
    });

    if (!service) {
      await this.sendMsg(jid, "Service not found. Reply '0' for the main menu.");
      await this.updateSession(session.id, 0, {});
      return;
    }

    const basePrice = service.basePrice || 0;
    const totalAmount = Math.round(basePrice + menuTotal);

    await this.updateSession(session.id, undefined, { customerName });

    // Payment & Confirmation Routing
    if (totalAmount === 0) {
      // Free Booking: Finalize immediately
      await this.finalizeBookingExecution(tenantId, phone, jid, session, {
        service,
        mode,
        selectedSlot,
        selectedItems,
        menuTotal: 0,
        customerName,
        totalAmount: 0,
        payAtCounter: true,
      });
      return;
    }

    // Paid Booking: Check payment options
    const bookingFlow = await this.prisma.serviceFlow.findUnique({
      where: { serviceId: service.id },
    });
    const tenantRecord = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { paymentAccount: true },
    });

    const stripeActive = Boolean(
      tenantRecord?.paymentAccount?.chargesEnabled &&
        tenantRecord?.paymentAccount?.connectedAccountId,
    );

    const checkinPayMode = bookingFlow?.checkinPayMode || 'BOTH';

    if (!stripeActive || checkinPayMode === 'COUNTER_ONLY') {
      await this.finalizeBookingExecution(tenantId, phone, jid, session, {
        service,
        mode,
        selectedSlot,
        selectedItems,
        menuTotal,
        customerName,
        totalAmount,
        payAtCounter: true,
      });
      return;
    }

    if (checkinPayMode === 'STRIPE_ONLY') {
      await this.initiateStripePaymentFlow(tenantRecord, phone, jid, session, {
        service,
        mode,
        selectedSlot,
        selectedItems,
        menuTotal,
        customerName,
        totalAmount,
      });
      return;
    }

    // Default: BOTH allowed. Prompt customer to select payment method (Step 17)
    let summaryMsg = `💳 *Payment Required: Total R${(totalAmount / 100).toFixed(2)}*\n\n`;
    if (basePrice > 0) {
      summaryMsg += `💼 Service: *${service.name}* (R${(basePrice / 100).toFixed(2)})\n`;
    }
    if (selectedItems.length > 0) {
      summaryMsg += `🛒 Menu & Add-ons:\n`;
      selectedItems.forEach((it: any) => {
        summaryMsg += `• 1x ${it.name} (R${(it.priceCents / 100).toFixed(2)})\n`;
      });
    }
    summaryMsg += `\nHow would you like to pay?\n`;
    summaryMsg += `1. 💳 *Pay Online with Card (Stripe)*\n`;
    summaryMsg += `2. 💵 *Pay at Counter upon arrival*\n\n`;
    summaryMsg += `Reply *1* or *2*, or '0' to cancel.`;

    await this.updateSession(session.id, 17, {
      totalAmount,
      basePrice,
    });

    await this.sendMsg(jid, summaryMsg);
  }

  private async handlePaymentMethodSelection(
    tenantId: string,
    phone: string,
    jid: string,
    session: any,
    text: string,
  ) {
    const raw = text.trim();
    if (raw === '0') {
      await this.sendMsg(jid, "Booking cancelled. Reply '0' for the main menu.");
      await this.updateSession(session.id, 0, {});
      return;
    }

    const currentSession = await this.prisma.chatSession.findUnique({
      where: { id: session.id },
    });
    const ctx = (currentSession?.context as any) || {};

    const service = await this.prisma.service.findUnique({
      where: { id: ctx.serviceId },
      include: { location: true },
    });

    if (!service) {
      await this.sendMsg(jid, "Service not found. Reply '0' for the main menu.");
      await this.updateSession(session.id, 0, {});
      return;
    }

    const tenantRecord = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { paymentAccount: true },
    });

    const bookingData = {
      service,
      mode: (ctx.mode as 'WALK_IN' | 'APPOINTMENT') || 'WALK_IN',
      selectedSlot: ctx.selectedSlot,
      selectedItems: ctx.selectedItems || [],
      menuTotal: ctx.menuTotal || 0,
      customerName: ctx.customerName || 'Customer',
      totalAmount: ctx.totalAmount || 0,
    };

    if (
      raw === '2' ||
      raw.toUpperCase().includes('COUNTER') ||
      raw.toUpperCase().includes('CASH')
    ) {
      await this.finalizeBookingExecution(tenantId, phone, jid, session, {
        ...bookingData,
        payAtCounter: true,
      });
    } else if (
      raw === '1' ||
      raw.toUpperCase().includes('ONLINE') ||
      raw.toUpperCase().includes('CARD') ||
      raw.toUpperCase().includes('STRIPE')
    ) {
      await this.initiateStripePaymentFlow(
        tenantRecord,
        phone,
        jid,
        session,
        bookingData,
      );
    } else {
      await this.sendMsg(
        jid,
        'Invalid choice. Reply *1* to Pay Online with Card (Stripe) or *2* to Pay at Counter, or *0* to cancel.',
      );
    }
  }

  private async initiateStripePaymentFlow(
    tenant: any,
    phone: string,
    jid: string,
    session: any,
    data: {
      service: any;
      mode: 'WALK_IN' | 'APPOINTMENT';
      selectedSlot?: any;
      selectedItems: any[];
      menuTotal: number;
      customerName: string;
      totalAmount: number;
    },
  ) {
    if (!this.visitService || !this.tenantPaymentsService) {
      await this.sendMsg(
        jid,
        "Payment service temporarily unavailable. Please approach the desk or reply '0' for main menu.",
      );
      await this.updateSession(session.id, 0, {});
      return;
    }

    try {
      const createdVisits = await this.visitService.joinMultiple({
        customerName: data.customerName,
        phone,
        skipOtp: true,
        payAtCounter: false,
        bookings: [
          {
            serviceId: data.service.id,
            scheduledFor:
              data.mode === 'APPOINTMENT'
                ? data.selectedSlot?.time
                : undefined,
            menuTotal: data.menuTotal,
            selectedItems: data.selectedItems,
            orderSelections: data.selectedItems,
          },
        ],
      });

      const provisionalVisit = createdVisits[0];
      if (!provisionalVisit) {
        throw new Error('Could not create provisional ticket');
      }

      // If appointment mode, link an appointment record if not already linked
      if (data.mode === 'APPOINTMENT' && data.selectedSlot?.time) {
        const start = new Date(data.selectedSlot.time);
        const durationMins = data.service.expectedDuration || 30;
        const end = new Date(start.getTime() + durationMins * 60000);

        const appt = await this.prisma.appointment.create({
          data: {
            tenantId: tenant.id,
            customerId: provisionalVisit.customerId,
            locationId: data.service.locationId,
            serviceId: data.service.id,
            scheduledStart: start,
            scheduledEnd: end,
            bookingSource: 'WHATSAPP',
            status: 'SCHEDULED',
            requiresPayment: true,
            paymentStatus: 'PENDING',
          },
        });

        await this.prisma.visit.update({
          where: { id: provisionalVisit.id },
          data: { appointmentId: appt.id },
        });
      }

      const paymentResult =
        await this.tenantPaymentsService.createPaymentIntent(
          tenant.id,
          data.totalAmount,
          {
            visitId: provisionalVisit.id,
            description: `WhatsApp Booking: ${data.service.name}`,
          },
        );

      const domainBase =
        process.env.DOMAIN_BASE ||
        (process.env.APP_URL
          ? new URL(process.env.APP_URL).host
          : 'qmova.yqbuddy.com');
      const tenantSubdomain = tenant.subdomain || 'superadmin';
      const paymentUrl = `https://${tenantSubdomain}.${domainBase}/pay/${paymentResult.paymentId}`;

      let msg = `💳 *Card Payment Required for Ticket #${provisionalVisit.displayId}*\n\n`;
      msg += `👤 Customer: *${data.customerName}*\n`;
      msg += `💼 Service: *${data.service.name}*\n`;
      if (data.selectedItems.length > 0) {
        msg += `🛒 Items: ${data.selectedItems.map((i: any) => i.name).join(', ')}\n`;
      }
      msg += `💰 Total Amount: *R${(data.totalAmount / 100).toFixed(2)}*\n\n`;
      msg += `👉 *Tap below to complete your payment securely with Card:*\n`;
      msg += `🔗 ${paymentUrl}\n\n`;
      msg += `⚡ *Once completed, your ticket will confirm instantly and your live tracker will be delivered here automatically.*\n\n`;
      msg += `Reply '0' if you wish to cancel.`;

      await this.updateSession(session.id, 18, {
        pendingPaymentId: paymentResult.paymentId,
        provisionalVisitId: provisionalVisit.id,
        paymentUrl,
        displayId: provisionalVisit.displayId,
      });

      await this.sendMsg(jid, msg);
    } catch (err: any) {
      await this.sendMsg(
        jid,
        `⚠️ Could not generate card payment link: ${err?.message || 'Unknown error'}. You can choose Pay at Counter or reply '0' to start over.`,
      );
    }
  }

  private async handlePendingPaymentState(
    tenantId: string,
    phone: string,
    jid: string,
    session: any,
    text: string,
  ) {
    const raw = text.trim();
    if (raw === '0' || raw.toUpperCase() === 'CANCEL') {
      await this.sendMsg(
        jid,
        "Payment session cancelled. Reply '0' for the main menu.",
      );
      await this.updateSession(session.id, 0, {});
      return;
    }

    const currentSession = await this.prisma.chatSession.findUnique({
      where: { id: session.id },
    });
    const ctx = (currentSession?.context as any) || {};
    const visitId = ctx.provisionalVisitId;

    if (visitId) {
      const visit = await this.prisma.visit.findUnique({
        where: { id: visitId },
      });
      if (visit && visit.currentState !== 'PENDING_PAYMENT') {
        await this.updateSession(session.id, 0, {});
        await this.sendMsg(
          jid,
          `✅ Your payment has been received and ticket *#${visit.displayId}* is confirmed!\n\nReply '1' to view your live queue position or '0' for main menu.`,
        );
        return;
      }
    }

    const paymentUrl = ctx.paymentUrl;
    let msg = `⏳ We are waiting for your card payment for Ticket *#${ctx.displayId || ''}*.\n\n`;
    if (paymentUrl) {
      msg += `Pay online securely here:\n🔗 ${paymentUrl}\n\n`;
    }
    msg += `Once paid, your ticket confirms automatically. Reply '0' to cancel.`;
    await this.sendMsg(jid, msg);
  }

  private async finalizeBookingExecution(
    tenantId: string,
    phone: string,
    jid: string,
    session: any,
    data: {
      service: any;
      mode: 'WALK_IN' | 'APPOINTMENT';
      selectedSlot?: any;
      selectedItems: any[];
      menuTotal: number;
      customerName: string;
      totalAmount: number;
      payAtCounter: boolean;
    },
  ) {
    if (!this.visitService) {
      await this.sendMsg(jid, 'Booking service unavailable at this moment.');
      await this.updateSession(session.id, 0, {});
      return;
    }

    try {
      const createdVisits = await this.visitService.joinMultiple({
        customerName: data.customerName,
        phone,
        skipOtp: true,
        payAtCounter: true,
        bookings: [
          {
            serviceId: data.service.id,
            scheduledFor:
              data.mode === 'APPOINTMENT'
                ? data.selectedSlot?.time
                : undefined,
            menuTotal: data.menuTotal,
            selectedItems: data.selectedItems,
            orderSelections: data.selectedItems,
          },
        ],
      });

      const visit = createdVisits[0];
      if (!visit) {
        throw new Error('Failed to create ticket');
      }

      // If appointment mode, link an appointment record
      if (data.mode === 'APPOINTMENT' && data.selectedSlot?.time) {
        const start = new Date(data.selectedSlot.time);
        const durationMins = data.service.expectedDuration || 30;
        const end = new Date(start.getTime() + durationMins * 60000);

        const appt = await this.prisma.appointment.create({
          data: {
            tenantId,
            customerId: visit.customerId,
            locationId: data.service.locationId,
            serviceId: data.service.id,
            scheduledStart: start,
            scheduledEnd: end,
            bookingSource: 'WHATSAPP',
            status: 'SCHEDULED',
            requiresPayment: data.totalAmount > 0,
            paymentStatus: data.totalAmount > 0 ? 'PENDING' : 'NOT_REQUIRED',
          },
        });

        await this.prisma.visit.update({
          where: { id: visit.id },
          data: { appointmentId: appt.id },
        });
      }

      const domainBase =
        process.env.DOMAIN_BASE ||
        (process.env.APP_URL
          ? new URL(process.env.APP_URL).host
          : 'qmova.yqbuddy.com');
      const trackerUrl = `https://${domainBase}/customer/status/${visit.id}`;

      let msg = '';
      if (data.mode === 'WALK_IN') {
        msg = `✅ *Walk-In Confirmed!*\n\n`;
        msg += `🎫 Ticket Number: *${visit.displayId}*\n`;
        msg += `👤 Name: *${data.customerName}*\n`;
        msg += `💼 Service: *${data.service.name}*\n`;
        if (data.selectedItems.length > 0) {
          msg += `🛒 Items: ${data.selectedItems.map((i: any) => i.name).join(', ')}\n`;
        }
        if (data.totalAmount > 0) {
          msg += `💰 Amount Due: *R${(data.totalAmount / 100).toFixed(2)}* (Pay at counter)\n`;
        }
        msg += `\n📲 *Live Ticket & Stage Tracker:*\n🔗 ${trackerUrl}\n\n`;
        msg += `You have joined the queue. You will be notified here when your turn arrives.\n\nReply '0' for the main menu.`;
      } else {
        const timeStr = data.selectedSlot?.time
          ? new Date(data.selectedSlot.time).toLocaleString([], {
              dateStyle: 'medium',
              timeStyle: 'short',
            })
          : 'Scheduled';
        msg = `✅ *Appointment Confirmed!*\n\n`;
        msg += `🎫 Ticket Reference: *${visit.displayId}*\n`;
        msg += `👤 Name: *${data.customerName}*\n`;
        msg += `📅 Date & Time: *${timeStr}*\n`;
        msg += `💼 Service: *${data.service.name}*\n`;
        if (data.selectedItems.length > 0) {
          msg += `🛒 Items: ${data.selectedItems.map((i: any) => i.name).join(', ')}\n`;
        }
        if (data.totalAmount > 0) {
          msg += `💰 Amount Due: *R${(data.totalAmount / 100).toFixed(2)}* (Pay at counter)\n`;
        }
        msg += `\n📲 *Live Ticket Tracker:*\n🔗 ${trackerUrl}\n\n`;
        msg += `We look forward to seeing you! Reply '0' for the main menu.`;
      }

      await this.sendMsg(jid, msg);
      await this.updateSession(session.id, 0, {});
    } catch (err: any) {
      await this.sendMsg(
        jid,
        `⚠️ Error creating booking: ${err?.message || 'Could not complete'}. Reply '0' to start over.`,
      );
      await this.updateSession(session.id, 0, {});
    }
  }

  private async handleReviewRating(
    tenantId: string,
    phone: string,
    jid: string,
    session: any,
    text: string,
  ) {
    const rating = parseInt(text.trim());

    if (isNaN(rating) || rating < 1 || rating > 5) {
      await this.sendMsg(jid, 'Please reply with a valid number from 1 to 5.');
      return;
    }

    // Find the pending review request
    const reviewRequest = await this.prisma.reviewRequest.findFirst({
      where: {
        tenantId,
        customer: { phone },
        status: 'SENT',
      },
      orderBy: { sentAt: 'desc' },
    });

    if (reviewRequest) {
      await this.prisma.reviewRequest.update({
        where: { id: reviewRequest.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          rating,
          source: 'INTERNAL',
        },
      });

      // Update visit as well for legacy compatibility
      await this.prisma.visit.update({
        where: { id: reviewRequest.visitId },
        data: { rating },
      });
    }

    if (rating <= 3) {
      await this.prisma.message.create({
        data: {
          tenantId,
          customerPhone: phone,
          body: `🚨 Low Score Alert: Customer rated their experience ${rating}/5.`,
          sender: 'SYSTEM',
          isRead: false,
        },
      });
      await this.sendMsg(
        jid,
        "Thank you for your feedback. We are sorry your experience wasn't perfect. Our team has been notified and we will strive to do better next time.",
      );
    } else {
      await this.sendMsg(jid, 'Thank you for your fantastic feedback!');
    }

    await this.updateSession(session.id, 0, {});
  }

  private async updateSession(
    sessionId: string,
    step: number | undefined,
    updates: Record<string, any>,
  ) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    const currentContext = (session?.context as object) || {};
    const newContext = { ...currentContext, ...updates };

    for (const key of Object.keys(newContext)) {
      if (newContext[key] === undefined) delete newContext[key];
    }

    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        ...(step !== undefined ? { step } : {}),
        context: newContext,
        lastActive: new Date(),
      },
    });
  }
}
