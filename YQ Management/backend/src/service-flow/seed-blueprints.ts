import { PrismaClient, StepType, StepTrigger } from '@prisma/client';
import { INDUSTRY_TEMPLATES } from './industry-templates';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5455/yq_queue?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Seeding ${INDUSTRY_TEMPLATES.length} BlueprintFlows...`);

  for (const tpl of INDUSTRY_TEMPLATES) {
    const flow = await prisma.$transaction(async (tx) => {
      const f = await tx.blueprintFlow.upsert({
        where: { key: tpl.key },
        update: {
          name: tpl.name,
          description: tpl.description,
          businessTypes: tpl.businessTypes,
        },
        create: {
          key: tpl.key,
          name: tpl.name,
          description: tpl.description,
          businessTypes: tpl.businessTypes,
          tenantId: null, // Global — available to all tenants
        },
      });

      // Delete existing steps to recreate them cleanly
      await tx.blueprintStep.deleteMany({
        where: { blueprintId: f.id },
      });

      const hasPaymentAtCheckout = tpl.steps.some(
        (s) => s.type === 'PAYMENT' && s.stepOrder > tpl.steps.length / 2,
      );
      const hasPaymentAtCheckin = tpl.steps.some(
        (s) => s.type === 'PAYMENT' && s.stepOrder <= tpl.steps.length / 2,
      );
      const paymentTiming = hasPaymentAtCheckout
        ? 'CHECKOUT'
        : hasPaymentAtCheckin
          ? 'CHECKIN'
          : 'NONE';

      await tx.blueprintFlow.update({
        where: { id: f.id },
        data: {
          paymentTiming,
          checkinPayMode: paymentTiming === 'CHECKIN' ? 'COUNTER_ONLY' : null,
        },
      });

      // Filter out PAYMENT
      let newSteps = tpl.steps.filter((s) => s.type !== 'PAYMENT');

      // Determine if this industry vertical physically uses an arrival QR scan gate turnstile
      // For food/catering, salons, retail, schools, clinics, and general events, customers proceed directly
      // to order/service or visually present student/staff IDs.
      // An arrival QR check-in gate can always be added on-demand via "+ Add Stage" -> "Booking Verification Gate".
      const industriesWithPhysicalTurnstile = new Set([
        'security',
        'embassy',
        'airport',
      ]);

      const industryKey = (tpl.industry || '').toLowerCase();
      const templateKey = (tpl.key || '').toLowerCase();
      const hasExistingGate = newSteps.some(
        (s) => s.type === 'CHECK_IN' || (s.type === 'CHECKPOINT' && (s.stepOrder === 0 || s.stepOrder === 1))
      );
      const shouldAddCheckInGate =
        !hasExistingGate &&
        (industriesWithPhysicalTurnstile.has(industryKey) ||
         industriesWithPhysicalTurnstile.has(templateKey));

      if (shouldAddCheckInGate) {
        newSteps.unshift({
          stepOrder: 0,
          name: 'Booking Verification (QR Scan)',
          description: 'Customer checks in via QR pass or ticket verification.',
          type: 'CHECK_IN',
          trigger: 'AUTOMATIC',
          isSystem: false,
          category: 'bookend',
          requiresQrScan: true,
          requiresStaffAction: false,
        } as any);
      }

      newSteps.push({
        stepOrder: 99,
        name: 'Completed Stage',
        description: 'Staff completes the visit.',
        type: 'CHECK_OUT',
        trigger: 'MANUAL_STAFF',
        isSystem: true,
        category: 'bookend',
        requiresQrScan: false,
        requiresStaffAction: true,
      } as any);

      newSteps = newSteps.map((s, idx) => ({ ...s, stepOrder: idx }));

      await tx.blueprintStep.createMany({
        data: newSteps.map((step: any) => ({
          blueprintId: f.id,
          stepOrder: step.stepOrder,
          name: step.name,
          description: step.description,
          type: (step.type as StepType) || 'SERVICE',
          trigger: (step.trigger as StepTrigger) || 'MANUAL_STAFF',
          isSystem: step.isSystem || false,
          category: step.category || null,
          customerView: step.customerView || null,
          isOptional: step.isOptional || false,
          requiresQrScan:
            step.requiresQrScan !== undefined
              ? step.requiresQrScan
              : step.type === 'CHECK_IN' || step.type === 'COLLECTION',
          requiresStaffAction:
            step.requiresStaffAction !== undefined
              ? step.requiresStaffAction
              : step.type !== 'WAITING_PERIOD' && step.type !== 'CHECK_IN',
          deferredByDays: step.deferredByDays,
          deferredByHours: step.deferredByHours,
          entitlementUnit: step.entitlementUnit,
          entitlementFixed: step.entitlementFixed,
          entitlementFormula: step.entitlementFormula,
          allowPartialRedemption: step.allowPartialRedemption || false,
          preventDoubleRedemption: step.preventDoubleRedemption ?? true,
          customerInstruction: step.customerInstruction,
          staffInstruction: step.staffInstruction,
          locationDescription: step.locationDescription,
          notifyCustomerOnActivation: step.notifyCustomerOnActivation ?? true,
          outcomeOptions: step.outcomeOptions || [],
          stepPrice: step.stepPrice,
          isPriceVariable: step.isPriceVariable || false,
          expectedDuration: step.expectedDuration,
          bufferDuration: step.bufferDuration,
          concurrentSlots: step.concurrentSlots,
          orderItems: step.orderItems || null,
          orderMultiSelect: step.orderMultiSelect ?? true,
          orderShowPrices: step.orderShowPrices ?? true,
          orderCatalogId: step.orderCatalogId || null,
        })),
      });

      return f;
    });

    console.log(
      `✓ Upserted: [${tpl.industry}] ${flow.name} (${tpl.steps.length} steps)`,
    );
  }

  console.log(
    `\n✅ Seeding complete. ${INDUSTRY_TEMPLATES.length} blueprints ready.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
