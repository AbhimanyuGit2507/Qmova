import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { TenantPaymentsService } from './tenant-payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tenant-payments')
export class TenantPaymentsController {
  constructor(private readonly tenantPaymentsService: TenantPaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('records')
  listPayments(
    @Req() req: any,
    @Query('locationId') locationId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('timeframe') timeframe?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.tenantPaymentsService.listPayments(req.user.tenantId, {
      locationId,
      serviceId,
      status,
      method,
      timeframe,
      startDate,
      endDate,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('connect')
  createConnectAccount(@Req() req: any) {
    return this.tenantPaymentsService.createConnectAccount(req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  getAccountStatus(@Req() req: any) {
    return this.tenantPaymentsService.getAccountStatus(req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  resetConnectAccount(@Req() req: any) {
    return this.tenantPaymentsService.resetConnectAccount(req.user.tenantId);
  }

  // ── Paystack Direct Bank Payout Endpoints ─────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('banks')
  listSouthAfricanBanks() {
    return this.tenantPaymentsService.listSouthAfricanBanks();
  }

  @UseGuards(JwtAuthGuard)
  @Post('paystack/verify-bank')
  verifyBankAccount(
    @Body() dto: { accountNumber: string; bankCode: string },
  ) {
    return this.tenantPaymentsService.verifyBankAccount(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('paystack/connect')
  connectPaystackBank(
    @Req() req: any,
    @Body()
    dto: {
      bankCode: string;
      bankName: string;
      accountNumber: string;
      accountName: string;
    },
  ) {
    return this.tenantPaymentsService.connectPaystackBank(
      req.user.tenantId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('paystack/reset')
  resetPaystackAccount(@Req() req: any) {
    return this.tenantPaymentsService.resetPaystackAccount(req.user.tenantId);
  }

  @Post('public/paystack/verify')
  verifyPublicPaystackPayment(@Body() body: { reference: string }) {
    return this.tenantPaymentsService.verifyPublicPaystackPayment(
      body.reference,
    );
  }

  @Post('webhook/paystack')
  handlePaystackWebhook(@Body() body: any) {
    return this.tenantPaymentsService.handlePaystackWebhook(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('intent')
  createPaymentIntent(
    @Req() req: any,
    @Body()
    dto: {
      amount: number;
      visitId?: string;
      visitStepId?: string;
      appointmentId?: string;
      description?: string;
      customerEmail?: string;
      customerName?: string;
      customerPhone?: string;
    },
  ) {
    return this.tenantPaymentsService.createPaymentIntent(
      req.user.tenantId,
      dto.amount,
      {
        visitId: dto.visitId,
        visitStepId: dto.visitStepId,
        appointmentId: dto.appointmentId,
        description: dto.description,
        customerEmail: dto.customerEmail,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
      },
    );
  }

  @Post('public/intent')
  createPublicPaymentIntent(
    @Body()
    dto: {
      tenantId: string;
      amount: number;
      visitId?: string;
      visitStepId?: string;
      appointmentId?: string;
      description?: string;
      customerEmail?: string;
      customerName?: string;
      customerPhone?: string;
    },
  ) {
    // For public bookings, they pass the tenantId in the body
    return this.tenantPaymentsService.createPaymentIntent(
      dto.tenantId,
      dto.amount,
      {
        visitId: dto.visitId,
        visitStepId: dto.visitStepId,
        appointmentId: dto.appointmentId,
        description: dto.description,
        customerEmail: dto.customerEmail,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
      },
    );
  }

  @Get('public/payment/:id')
  getPayment(@Param('id') id: string) {
    return this.tenantPaymentsService.getPayment(id);
  }

  @Post('public/payment/:id/complete')
  completePayment(
    @Param('id') id: string,
    @Body()
    body: {
      method?: string;
      proofUrl?: string;
      description?: string;
      staffId?: string;
      sendWhatsAppReceipt?: boolean;
    },
    @Req() req?: any,
  ) {
    const staffId = body?.staffId || req?.user?.userId || req?.user?.id;
    return this.tenantPaymentsService.completePayment(id, body?.method, {
      proofUrl: body?.proofUrl,
      description: body?.description,
      staffId,
      sendWhatsAppReceipt: body?.sendWhatsAppReceipt,
    });
  }

  @Post('webhook')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: any,
  ) {
    const rawBody =
      req.rawBody ||
      (Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(req.body ? JSON.stringify(req.body) : ''));
    return this.tenantPaymentsService.handleStripeWebhook(signature, rawBody);
  }

  @Post('stripe-webhook')
  async handleStripeWebhookAlias(
    @Headers('stripe-signature') signature: string,
    @Req() req: any,
  ) {
    const rawBody =
      req.rawBody ||
      (Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(req.body ? JSON.stringify(req.body) : ''));
    return this.tenantPaymentsService.handleStripeWebhook(signature, rawBody);
  }

  @UseGuards(JwtAuthGuard)
  @Post('manual')
  recordManualPayment(
    @Req() req: any,
    @Body()
    body: {
      visitId: string;
      amount: number;
      method: string;
      description?: string;
      source?: 'CHECKIN' | 'CHECKOUT';
      proofUrl?: string;
      sendWhatsAppReceipt?: boolean;
    },
  ) {
    return this.tenantPaymentsService.recordManualPayment(
      req.user.tenantId,
      body.visitId,
      body.amount,
      body.method,
      body.description,
      {
        source: body.source,
        staffId: req.user.userId,
        proofUrl: body.proofUrl,
        sendWhatsAppReceipt: body.sendWhatsAppReceipt,
      },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/refund')
  refundPayment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.tenantPaymentsService.refundPayment(
      req.user.tenantId,
      id,
      body?.reason,
    );
  }
}
