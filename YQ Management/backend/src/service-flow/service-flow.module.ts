import { Module } from '@nestjs/common';
import { ServiceFlowController } from './service-flow.controller';
import { ServiceFlowService } from './service-flow.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [PrismaModule, SubscriptionModule],
  controllers: [ServiceFlowController],
  providers: [ServiceFlowService],
  exports: [ServiceFlowService],
})
export class ServiceFlowModule {}
