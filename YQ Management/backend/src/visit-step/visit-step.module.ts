import { Module, forwardRef } from '@nestjs/common';
import { VisitStepController } from './visit-step.controller';
import { VisitStepService } from './visit-step.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InvoiceModule } from '../invoice/invoice.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => InvoiceModule),
  ],
  controllers: [VisitStepController],
  providers: [VisitStepService],
  exports: [VisitStepService],
})
export class VisitStepModule {}
