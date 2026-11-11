import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/plan.dto';
import { UpdatePlanDto } from './dto/plan.dto';
import { Plan } from '@prisma/client';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listPlans(
    statusFilter?: string,
    offset = 0,
    limit = 50,
  ): Promise<Plan[]> {
    const where: Record<string, unknown> = {};
    if (statusFilter) {
      where.active = statusFilter === 'ACTIVE';
    }
    let plans = await this.prisma.plan.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    if (!plans || plans.length === 0) {
      this.logger.log(
        'No plans found in database. Seeding default SaaS pricing plans...',
      );
      try {
        await this.createPlan({
          name: 'Free Trial (14 Days)',
          description:
            '14-day free trial mirroring Growth features with 1 location and 50 tickets/day cap (700 total).',
          type: 'TRIAL',
          price: 0,
          annualPrice: 0,
          currency: 'ZAR',
          billingInterval: 'monthly' as any,
          trialDays: 14,
          status: 'ACTIVE',
          sortOrder: 0,
          features: {
            walkInQr: true,
            onlinePortal: true,
            checkout: true,
            tvDisplay: true,
            emailTracking: true,
            poweredByBadge: false,
            customBranding: true,
            textToSpeech: true,
            whatsappChatbot: true,
            whatsappChat: true,
            reviewAuditing: true,
            crossBranchAnalytics: false,
            whiteLabeling: false,
            crmWebhooks: false,
            apiAccess: false,
            customDomain: false,
            multiZoneVoice: false,
            prioritySla: false,
          },
          limits: {
            maxLocations: 1,
            maxServices: 15,
            maxStaff: 10,
            maxQueues: 15,
            maxTokens: 50,
            dailyTicketCap: 50,
            trialTotalCap: 700,
            maxJourneyStages: null,
          },
        });
        await this.createPlan({
          name: 'Basic (Small Business)',
          description:
            'Solo barbers, single-doctor clinics, small takeaways (Under 100 tickets/day).',
          type: 'BASIC',
          price: 69900,
          annualPrice: 699000,
          currency: 'ZAR',
          billingInterval: 'monthly' as any,
          trialDays: 0,
          status: 'ACTIVE',
          sortOrder: 1,
          features: {
            walkInQr: true,
            onlinePortal: true,
            checkout: true,
            tvDisplay: true,
            emailTracking: true,
            poweredByBadge: true,
            customBranding: false,
            textToSpeech: false,
            whatsappChatbot: false,
            whatsappChat: false,
            reviewAuditing: false,
            crossBranchAnalytics: false,
            whiteLabeling: false,
            crmWebhooks: false,
            apiAccess: false,
            customDomain: false,
            multiZoneVoice: false,
            prioritySla: false,
          },
          limits: {
            maxLocations: 1,
            maxServices: 3,
            maxStaff: 3,
            maxQueues: 3,
            maxTokens: 1000,
            dailyTicketCap: 1000,
            maxJourneyStages: 3,
          },
        });
        await this.createPlan({
          name: 'Growth (Busy Venue)',
          description:
            'High-throughput QSRs, large multi-doctor clinics, auto centers (100–500 tickets/day).',
          type: 'GROWTH',
          price: 139900,
          annualPrice: 1399000,
          currency: 'ZAR',
          billingInterval: 'monthly' as any,
          trialDays: 0,
          status: 'ACTIVE',
          sortOrder: 2,
          features: {
            walkInQr: true,
            onlinePortal: true,
            checkout: true,
            tvDisplay: true,
            emailTracking: true,
            poweredByBadge: false,
            customBranding: true,
            textToSpeech: true,
            whatsappChatbot: true,
            whatsappChat: true,
            reviewAuditing: true,
            crossBranchAnalytics: false,
            whiteLabeling: false,
            crmWebhooks: false,
            apiAccess: false,
            customDomain: false,
            multiZoneVoice: false,
            prioritySla: false,
          },
          limits: {
            maxLocations: 1,
            maxServices: 15,
            maxStaff: 10,
            maxQueues: 15,
            maxTokens: 2500,
            dailyTicketCap: 2500,
            maxJourneyStages: null,
          },
        });
        await this.createPlan({
          name: 'Plus (Multi-Branch)',
          description:
            'Regional chains, franchise groups with 2-3 outlets, medical groups.',
          type: 'PLUS',
          price: 249900,
          annualPrice: 2499000,
          currency: 'ZAR',
          billingInterval: 'monthly' as any,
          trialDays: 0,
          status: 'ACTIVE',
          sortOrder: 3,
          features: {
            walkInQr: true,
            onlinePortal: true,
            checkout: true,
            tvDisplay: true,
            emailTracking: true,
            poweredByBadge: false,
            customBranding: true,
            textToSpeech: true,
            whatsappChatbot: true,
            whatsappChat: true,
            reviewAuditing: true,
            crossBranchAnalytics: true,
            whiteLabeling: true,
            crmWebhooks: true,
            apiAccess: false,
            customDomain: false,
            multiZoneVoice: false,
            prioritySla: false,
          },
          limits: {
            maxLocations: 3,
            maxServices: 30,
            maxStaff: 25,
            maxQueues: 30,
            maxTokens: 10000,
            dailyTicketCap: 10000,
            maxJourneyStages: null,
          },
        });
        await this.createPlan({
          name: 'Enterprise (Network)',
          description:
            'Hospital networks, government centers, national franchises.',
          type: 'ENTERPRISE',
          price: 499900,
          annualPrice: 4999000,
          currency: 'ZAR',
          billingInterval: 'monthly' as any,
          trialDays: 0,
          status: 'ACTIVE',
          sortOrder: 4,
          features: {
            walkInQr: true,
            onlinePortal: true,
            checkout: true,
            tvDisplay: true,
            emailTracking: true,
            poweredByBadge: false,
            customBranding: true,
            textToSpeech: true,
            whatsappChatbot: true,
            whatsappChat: true,
            reviewAuditing: true,
            crossBranchAnalytics: true,
            whiteLabeling: true,
            crmWebhooks: true,
            apiAccess: true,
            customDomain: true,
            multiZoneVoice: true,
            prioritySla: true,
          },
          limits: {
            maxLocations: 10,
            maxServices: 100,
            maxStaff: 9999,
            maxQueues: 100,
            maxTokens: 100000,
            dailyTicketCap: 100000,
            maxJourneyStages: null,
          },
        });
        plans = await this.prisma.plan.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        });
      } catch (error) {
        this.logger.error(
          'Failed to auto-seed default SaaS plans',
          error as Error,
        );
      }
    }

    return plans;
  }

  async getPlan(id: string): Promise<Plan> {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} not found`);
    }
    return plan;
  }

  async createPlan(dto: CreatePlanDto): Promise<Plan> {
    const plan = await this.prisma.plan.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type || 'standard',
        active: (dto.status || 'ACTIVE') === 'ACTIVE',
        billingInterval: dto.billingInterval || 'monthly',
        price: dto.price ?? 0,
        annualPrice: dto.annualPrice ?? 0,
        currency: dto.currency || 'ZAR',
        trialDays: dto.trialDays ?? 0,
        features: (dto.features ?? null) as any,
        limits: (dto.limits ?? null) as any,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    this.logger.log(`Plan created: ${plan.name} (${plan.id})`);
    return plan;
  }

  async updatePlan(id: string, dto: UpdatePlanDto): Promise<Plan> {
    const existing = await this.getPlan(id);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.billingInterval !== undefined)
      data.billingInterval = dto.billingInterval;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.annualPrice !== undefined) data.annualPrice = dto.annualPrice;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.trialDays !== undefined) data.trialDays = dto.trialDays;
    if (dto.features !== undefined) data.features = dto.features;
    if (dto.limits !== undefined) data.limits = dto.limits;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.active !== undefined) data.active = dto.active;

    const updated = await this.prisma.plan.update({
      where: { id },
      data,
    });
    this.logger.log(`Plan updated: ${updated.name} (${updated.id})`);
    return updated;
  }

  async changePlanStatus(id: string, status: string | boolean): Promise<Plan> {
    const existing = await this.getPlan(id);
    const normalized =
      typeof status === 'string'
        ? status.toUpperCase()
        : status
          ? 'ACTIVE'
          : 'INACTIVE';
    const updated = await this.prisma.plan.update({
      where: { id },
      data: { active: normalized === 'ACTIVE' },
    });
    this.logger.log(`Plan ${id} status changed to ${normalized}`);
    return updated;
  }

  async duplicatePlan(id: string, newName: string): Promise<Plan> {
    const existing = await this.getPlan(id);
    const duplicated = await this.prisma.plan.create({
      data: {
        name: newName,
        description: existing.description ?? undefined,
        type: existing.type,
        billingInterval: existing.billingInterval,
        price: existing.price,
        annualPrice: existing.annualPrice,
        currency: existing.currency,
        trialDays: existing.trialDays,
        features: existing.features ?? undefined,
        limits: existing.limits ?? undefined,
        active: true,
        sortOrder: existing.sortOrder,
      },
    });
    this.logger.log(`Plan duplicated: ${existing.name} -> ${duplicated.name}`);
    return duplicated;
  }

  async deletePlan(id: string): Promise<Plan> {
    const existing = await this.getPlan(id);

    // Check if any subscriptions are using this plan
    const subCount = await this.prisma.subscription.count({
      where: { planId: id },
    });

    if (subCount > 0) {
      throw new Error(
        `Cannot delete plan because it is currently assigned to ${subCount} subscriptions. Please reassign them first or archive the plan instead.`,
      );
    }

    const deleted = await this.prisma.plan.delete({
      where: { id },
    });
    this.logger.log(
      `Plan permanently deleted: ${deleted.name} (${deleted.id})`,
    );
    return deleted;
  }
}
