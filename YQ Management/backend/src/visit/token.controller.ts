import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Controller('token')
export class TokenController {
  private readonly logger = new Logger(TokenController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly whatsappService: WhatsappService,
  ) {}

  @Post('request-otp')
  async requestOtp(
    @Body() body: { phone: string; serviceId: string; payAtCounter?: boolean },
  ) {
    if (!body.phone || !body.serviceId) {
      throw new HttpException(
        'Missing phone or serviceId',
        HttpStatus.BAD_REQUEST,
      );
    }

    const service = await this.prisma.service.findUnique({
      where: { id: body.serviceId },
      include: {
        serviceFlow: true,
        tenant: {
          include: {
            paymentAccount: true,
            subscriptions: {
              where: { status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] } },
              include: { plan: true },
            },
          },
        },
      },
    });

    if (!service || !service.tenant) {
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
    }

    const tenant = service.tenant;

    // Check if online Stripe payment is enabled and required for this service
    const stripeActive = Boolean(
      tenant.paymentAccount?.chargesEnabled &&
      tenant.paymentAccount?.connectedAccountId,
    );
    const flow = service.serviceFlow;
    const isOnlinePaid = flow?.isActive
      ? (flow.paymentTiming === 'BOOKING' ||
          flow.paymentTiming === 'CHECKIN') &&
        (service.basePrice ?? 0) > 0 &&
        flow.checkinPayMode !== 'COUNTER_ONLY' &&
        stripeActive
      : (service.paymentMode === 'PREPAY' ||
          service.paymentMode === 'OPTIONAL_PREPAY' ||
          service.paymentMode === 'PAY_AT_SERVICE') &&
        (service.basePrice ?? 0) > 0 &&
        stripeActive;

    // If online Stripe payment applies and user is not explicitly paying at counter, bypass OTP
    if (isOnlinePaid && !body.payAtCounter) {
      return {
        bypassOtp: true,
        reason: 'Online payment required via Stripe (OTP bypassed)',
      };
    }

    // If WhatsApp is not connected for this tenant, return a graceful bypass payload
    if (!tenant.whatsappConnected || !tenant.whatsappInstanceId) {
      return { bypassOtp: true, reason: 'WhatsApp not connected' };
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const redisKey = `otp:booking:${body.phone}`;

    // Store in Redis with 5 minutes TTL
    await this.redisService.client.set(redisKey, otpCode, 'EX', 300);

    // Check custom branding
    const sub = tenant.subscriptions;
    let planFeatures: any = sub?.plan?.features || {};
    if (typeof planFeatures === 'string') {
      try {
        planFeatures = JSON.parse(planFeatures);
      } catch (e) {
        planFeatures = {};
      }
    }
    const hasCustomBranding =
      sub?.status === 'TRIAL' || planFeatures.customBranding === true;
    const watermark = hasCustomBranding ? '' : '\n\nPowered by Qmova';

    // Send OTP via WhatsApp
    const message = `Your Qmova verification code is ${otpCode}. It expires in 5 minutes.${watermark}`;

    // Send in background to avoid blocking
    this.whatsappService
      .sendToTenant(tenant.id, body.phone, message)
      .then((res) => {
        if (!res.success) {
          this.logger.error(
            `Failed to send OTP to ${body.phone}: ${res.error}`,
          );
        }
      })
      .catch((err) => {
        this.logger.error(`Error sending OTP to ${body.phone}`, err);
      });

    return { success: true, message: 'OTP sent successfully' };
  }
}
