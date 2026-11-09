import { Controller, Post, Body, Headers, Req, Logger } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';
import { WebhookProcessService } from '../webhooks/webhook-process.service';

@Controller('billing')
export class BillingWebhookController {
  private readonly logger = new Logger(BillingWebhookController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly webhookProcessService: WebhookProcessService,
  ) {}

  @Post('webhook')
  async handleBillingWebhook(
    @Body() body: any,
    @Headers() headers: any,
    @Req() req: any,
  ) {
    this.logger.log('Received billing platform webhook on /billing/webhook');
    try {
      if (this.webhookProcessService) {
        return await this.webhookProcessService.processPaymentWebhook(body, headers);
      }
    } catch (err: any) {
      this.logger.warn(
        `WebhookProcessService error: ${err.message}. Falling back to paymentsService.`,
      );
    }
    return this.paymentsService.handleWebhook(body, headers);
  }

  @Post('payments/webhooks/ozow')
  async handleOzowProviderWebhook(
    @Body() body: any,
    @Headers() headers: any,
    @Req() req: any,
  ) {
    this.logger.log('Received Ozow billing webhook on /billing/payments/webhooks/ozow');
    try {
      if (this.webhookProcessService) {
        return await this.webhookProcessService.processPaymentWebhook(body, headers);
      }
    } catch (err: any) {
      this.logger.warn(
        `WebhookProcessService error: ${err.message}. Falling back to paymentsService.`,
      );
    }
    return this.paymentsService.handleWebhook(body, headers);
  }
}

