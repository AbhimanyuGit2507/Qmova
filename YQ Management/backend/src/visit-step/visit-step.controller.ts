import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VisitStepService } from './visit-step.service';
import { AdvanceStepDto } from './dto/advance-step.dto';
import { RedeemEntitlementDto } from './dto/redeem-entitlement.dto';
import { ScanStepDto } from './dto/scan-step.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePagePermission } from '../auth/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('visit-steps')
export class VisitStepController {
  constructor(private readonly visitStepService: VisitStepService) {}

  private getActorId(req: any): string {
    return (
      req.user?.staffId ||
      req.user?.userId ||
      req.user?.id ||
      req.user?.sub ||
      'SYSTEM'
    );
  }

  @Get('by-visit/:visitId')
  getVisitSteps(@Req() req: any, @Param('visitId') visitId: string) {
    return this.visitStepService.getVisitSteps(req.user.tenantId, visitId);
  }

  @Post('scan')
  handleScan(@Req() req: any, @Body() dto: ScanStepDto) {
    return this.visitStepService.handleScan(
      req.user.tenantId,
      dto.accessToken,
      this.getActorId(req),
      dto.targetStepId,
    );
  }

  @Post(':stepId/activate')
  activateStep(@Req() req: any, @Param('stepId') stepId: string) {
    return this.visitStepService.activateStep(
      req.user.tenantId,
      stepId,
      this.getActorId(req),
    );
  }

  @Post(':stepId/advance')
  @RequirePagePermission('flow:advance')
  advanceStep(
    @Req() req: any,
    @Param('stepId') stepId: string,
    @Body() dto: AdvanceStepDto,
  ) {
    return this.visitStepService.advanceStep(
      req.user.tenantId,
      stepId,
      this.getActorId(req),
      dto,
    );
  }

  @Post(':stepId/redeem')
  @RequirePagePermission('flow:redeem')
  redeemCollection(
    @Req() req: any,
    @Param('stepId') stepId: string,
    @Body() dto: RedeemEntitlementDto,
  ) {
    return this.visitStepService.redeemCollection(
      req.user.tenantId,
      stepId,
      this.getActorId(req),
      dto,
    );
  }

  @Post(':stepId/submit-form')
  submitForm(
    @Req() req: any,
    @Param('stepId') stepId: string,
    @Body() dto: { formData: any },
  ) {
    return this.visitStepService.submitForm(
      req.user.tenantId,
      stepId,
      this.getActorId(req),
      dto.formData,
    );
  }

  @Post(':stepId/submit-order')
  submitOrder(
    @Req() req: any,
    @Param('stepId') stepId: string,
    @Body() dto: { selectedItems: any[] },
  ) {
    return this.visitStepService.submitOrder(
      req.user.tenantId,
      stepId,
      this.getActorId(req),
      dto.selectedItems,
    );
  }

  @Post(':stepId/skip')
  @RequirePagePermission('flow:skip')
  skipStep(@Req() req: any, @Param('stepId') stepId: string) {
    return this.visitStepService.skipStep(
      req.user.tenantId,
      stepId,
      this.getActorId(req),
    );
  }

  @Post(':stepId/revert')
  @RequirePagePermission('flow:revert')
  revertStep(@Req() req: any, @Param('stepId') stepId: string) {
    return this.visitStepService.revertStep(
      req.user.tenantId,
      stepId,
      this.getActorId(req),
    );
  }

  /**
   * POST /visit-steps/visits/:visitId/record-payment
   * Staff records a counter payment for a visit with PENDING_COUNTER status.
   * This unblocks subsequent QR scans / step advancement.
   */
  @Post('visits/:visitId/record-payment')
  @RequirePagePermission('payments:record')
  recordCounterPayment(
    @Req() req: any,
    @Param('visitId') visitId: string,
    @Body()
    dto: {
      amount?: number;
      method?: string;
      proofUrl?: string;
      notes?: string;
    },
  ) {
    return this.visitStepService.recordCounterPayment(
      req.user.tenantId,
      visitId,
      this.getActorId(req),
      dto,
    );
  }
}
