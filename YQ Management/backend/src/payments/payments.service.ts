import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  // These should ideally come from ConfigService / Environment variables
  private readonly siteCode = process.env.OZOW_SITE_CODE || '';
  private readonly privateKey = process.env.OZOW_PRIVATE_KEY || '';
  private readonly apiKey = process.env.OZOW_API_KEY || '';
  private readonly baseUrl =
    process.env.BACKEND_URL ||
    (process.env.NODE_ENV === 'production'
      ? `${process.env.BACKEND_URL || 'https://api.qmova.yqbuddy.com'}`
      : 'http://localhost:3000');
  private readonly frontendUrl =
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === 'production'
      ? `${process.env.FRONTEND_URL || 'https://qmova.yqbuddy.com'}`
      : 'http://localhost:3001');

  private getOzowCheckoutUrl() {
    const sandboxMode =
      process.env.OZOW_IS_TEST !== undefined
        ? process.env.OZOW_IS_TEST === 'true' ||
          process.env.OZOW_IS_TEST === '1'
        : process.env.NODE_ENV !== 'production';

    return sandboxMode
      ? 'https://sandbox.ozow.com/checkout'
      : 'https://pay.ozow.com/';
  }

  private addBillingPeriod(startDate: Date, billingInterval: string) {
    const periodDays = billingInterval === 'yearly' ? 365 : 30;
    return new Date(startDate.getTime() + periodDays * 24 * 60 * 60 * 1000);
  }

  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}

  async generatePaymentLink(
    tenantId: string,
    planId: string,
    billingInterval: string,
  ) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new BadRequestException('Plan not found');
    }

    let finalAmountInCents = plan.price;
    if (
      billingInterval === 'yearly' &&
      plan.annualPrice != null &&
      plan.annualPrice > 0
    ) {
      finalAmountInCents = plan.annualPrice;
    }

    // Normalize: standard financial representation is integer cents (e.g. 499900 = R4,999.00)
    // If entered in major units (e.g. 10 or 4999), normalize to cents
    if (finalAmountInCents > 0 && finalAmountInCents < 1000) {
      finalAmountInCents = Math.round(finalAmountInCents * 100);
    }

    // Ozow expects decimal formatted currency (e.g. "4999.00")
    const formattedAmount = (finalAmountInCents / 100).toFixed(2);
    const txRef = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 1. Create a pending transaction storing amount in CENTS
    const transaction = await this.prisma.transaction.create({
      data: {
        tenantId,
        planId,
        billingInterval,
        transactionRef: txRef,
        amount: finalAmountInCents,
        currency: plan.currency || 'ZAR',
      },
    });

    // 2. Build the Ozow Payload with explicit transactionRef in query parameters
    const payload = {
      siteCode: this.siteCode,
      countryCode: 'ZA',
      currencyCode: plan.currency || 'ZAR',
      amount: formattedAmount,
      transactionReference: transaction.transactionRef,
      bankReference: `QMOVA-${transaction.transactionRef.substring(4, 12)}`,
      cancelUrl: `${this.frontendUrl}/dashboard/settings/billing?status=cancelled&ref=${transaction.transactionRef}`,
      errorUrl: `${this.frontendUrl}/dashboard/settings/billing?status=error&ref=${transaction.transactionRef}`,
      successUrl: `${this.frontendUrl}/dashboard/settings/billing?status=success&ref=${transaction.transactionRef}`,
      notifyUrl: `${this.baseUrl}/payments/webhook`,
      isTest:
        process.env.OZOW_IS_TEST !== undefined
          ? process.env.OZOW_IS_TEST
          : process.env.NODE_ENV === 'production'
            ? 'false'
            : 'true',
    };

    // 3. Generate SHA512 Hash
    const stringToHash =
      `${payload.siteCode}${payload.countryCode}${payload.currencyCode}${payload.amount}${payload.transactionReference}${payload.bankReference}${payload.cancelUrl}${payload.errorUrl}${payload.successUrl}${payload.notifyUrl}${payload.isTest}${this.privateKey}`.toLowerCase();
    const hashCheck = crypto
      .createHash('sha512')
      .update(stringToHash)
      .digest('hex');

    return {
      ...payload,
      hashCheck,
      paymentUrl: this.getOzowCheckoutUrl(),
      checkoutUrl: this.getOzowCheckoutUrl(),
    };
  }

  async generateTestPaymentLink(
    amount: number = 10.0,
    isTestMode: boolean = false,
  ) {
    const formattedAmount = Number(amount).toFixed(2);
    const txRef = `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payload = {
      siteCode: this.siteCode || 'YQB-YQB-001',
      countryCode: 'ZA',
      currencyCode: 'ZAR',
      amount: formattedAmount,
      transactionReference: txRef,
      bankReference: `QMOVA-TEST-${txRef.substring(5, 11)}`,
      cancelUrl: `${this.frontendUrl}/super-admin/system-control?payment_status=cancelled`,
      errorUrl: `${this.frontendUrl}/super-admin/system-control?payment_status=error`,
      successUrl: `${this.frontendUrl}/super-admin/system-control?payment_status=success`,
      notifyUrl: `${this.baseUrl}/payments/webhook`,
      isTest: isTestMode
        ? 'true'
        : process.env.OZOW_IS_TEST !== undefined
          ? process.env.OZOW_IS_TEST
          : process.env.NODE_ENV === 'production'
            ? 'false'
            : 'true',
    };

    const stringToHash =
      `${payload.siteCode}${payload.countryCode}${payload.currencyCode}${payload.amount}${payload.transactionReference}${payload.bankReference}${payload.cancelUrl}${payload.errorUrl}${payload.successUrl}${payload.notifyUrl}${payload.isTest}${this.privateKey}`.toLowerCase();
    const hashCheck = crypto
      .createHash('sha512')
      .update(stringToHash)
      .digest('hex');

    return {
      ...payload,
      hashCheck,
      paymentUrl: this.getOzowCheckoutUrl(),
      checkoutUrl: this.getOzowCheckoutUrl(),
    };
  }

  async handleWebhook(body: any, headers: any) {
    const transactionReference =
      body.TransactionReference || body.transactionReference;
    const status = body.Status || body.status;
    const hashCheck = body.HashCheck || body.hashCheck;

    // SECURITY: Validate HashCheck from Ozow
    if (!hashCheck && process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Missing HashCheck');
    }

    if (!transactionReference) {
      throw new BadRequestException('Missing TransactionReference');
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { transactionRef: transactionReference },
    });

    if (!transaction) {
      this.logger.error(`Transaction not found: ${transactionReference}`);
      return { success: false };
    }

    if (transaction.status !== 'PENDING') {
      this.logger.log(
        `Transaction ${transactionReference} already processed with status ${transaction.status}`,
      );
      return { success: true };
    }

    const statusLower = (status || '').toString().toLowerCase();
    const newStatus =
      statusLower === 'complete' ||
      statusLower === 'success' ||
      statusLower === 'successful'
        ? 'COMPLETE'
        : statusLower === 'cancelled' || statusLower === 'abandoned'
          ? 'CANCELLED'
          : 'FAILED';

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: newStatus },
    });

    if (newStatus === 'COMPLETE' && transaction.tenantId) {
      // NOTE: Removed legacy workspace update
      if (transaction.planId) {
        const currentPeriodEnd = this.addBillingPeriod(
          new Date(),
          transaction.billingInterval || 'monthly',
        );

        const existingSub = await this.prisma.subscription.findUnique({
          where: { tenantId: transaction.tenantId },
        });

        const isUpgrade =
          existingSub && existingSub.planId !== transaction.planId;
        const newMetadata = existingSub?.metadata
          ? (existingSub.metadata as any)
          : {};

        if (isUpgrade) {
          newMetadata.upgradedFrom = existingSub.planId;
          newMetadata.upgradedAt = new Date().toISOString();
        } else if (existingSub) {
          newMetadata.renewedAt = new Date().toISOString();
        }

        await this.prisma.subscription.upsert({
          where: { tenantId: transaction.tenantId },
          update: {
            planId: transaction.planId,
            status: 'ACTIVE',
            billingInterval: transaction.billingInterval || 'monthly',
            currentPeriodStart: new Date(),
            currentPeriodEnd: currentPeriodEnd,
            nextBillingDate: currentPeriodEnd,
            // Clear trial dates when converting to paid subscription
            trialStartDate: null,
            trialEndDate: null,
            metadata: newMetadata,
          },
          create: {
            tenantId: transaction.tenantId,
            planId: transaction.planId,
            status: 'ACTIVE',
            billingInterval: transaction.billingInterval || 'monthly',
            currentPeriodStart: new Date(),
            currentPeriodEnd: currentPeriodEnd,
            nextBillingDate: currentPeriodEnd,
            trialStartDate: null,
            trialEndDate: null,
          },
        });
      }

      this.logger.log(
        `Subscription activated for workspace ${transaction.tenantId}`,
      );
    }

    return { success: true };
  }

  async createCheckout(dto: any, tenantId: string) {
    return this.generatePaymentLink(
      tenantId,
      dto.planId || 'standard-plan',
      dto.billingInterval || 'monthly',
    );
  }

  async cancelTransaction(
    tenantId: string,
    transactionRef?: string,
    transactionId?: string,
  ) {
    const where: any = { tenantId, status: 'PENDING' };
    if (transactionRef) {
      where.transactionRef = transactionRef;
    } else if (transactionId) {
      where.id = transactionId;
    }

    const tx = await this.prisma.transaction.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (tx) {
      this.logger.log(
        `Marking pending transaction ${tx.transactionRef} as CANCELLED for tenant ${tenantId}`,
      );
      return this.prisma.transaction.update({
        where: { id: tx.id },
        data: { status: 'CANCELLED' },
      });
    }

    return null;
  }

  async getPaymentStatus(transactionRef: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { transactionRef },
    });
    return transaction || { status: 'NOT_FOUND' };
  }

  async getTransactionHistory(tenantId: string, offset = 0, limit = 20) {
    // Automatically transition stale pending transactions older than 30 minutes to EXPIRED
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    await this.prisma.transaction.updateMany({
      where: {
        tenantId,
        status: 'PENDING',
        createdAt: { lt: thirtyMinutesAgo },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    const transactions = await this.prisma.transaction.findMany({
      where: { tenantId },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    const total = await this.prisma.transaction.count({
      where: { tenantId },
    });
    return { transactions, total, offset, limit };
  }
}
