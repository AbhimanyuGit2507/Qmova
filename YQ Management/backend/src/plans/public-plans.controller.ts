import { Controller, Get, Logger } from '@nestjs/common';
import { PlansService } from './plans.service';

@Controller('public/plans')
export class PublicPlansController {
  private readonly logger = new Logger(PublicPlansController.name);

  constructor(private readonly plansService: PlansService) {}

  @Get()
  async getActivePlans() {
    return this.plansService.listPlans('ACTIVE', 0, 50);
  }
}

