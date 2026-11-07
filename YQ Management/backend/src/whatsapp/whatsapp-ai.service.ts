import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { calculateAdvancedEWT } from '../utils/ewt.util';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { ServiceService } from '../service/service.service';
import { AppointmentService } from '../appointment/appointment.service';
import { VisitService } from '../visit/visit.service';
import { normalizePhoneZA, phoneMatchCondition } from '../utils/phone.util';

@Injectable()
export class WhatsappAiService {
  private readonly logger = new Logger(WhatsappAiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    @Inject(forwardRef(() => ServiceService))
    private readonly serviceService: ServiceService,
    @Inject(forwardRef(() => AppointmentService))
    private readonly appointmentService: AppointmentService,
    @Inject(forwardRef(() => VisitService))
    private readonly visitService: VisitService,
  ) {}

  async processMessage(
    tenant: any,
    phone: string,
    jid: string,
    rawText: string,
    sendMessageFn: (jid: string, text: string) => Promise<void>,
  ): Promise<{ handled: boolean; isHumanPaused: boolean; isHandoverEvent?: boolean }> {
    const tenantId = tenant.id;

    // Check if human paused
    const normalizedPhone = normalizePhoneZA(phone);
    const session = await this.prisma.chatSession.upsert({
      where: { tenantId_phone: { tenantId, phone: normalizedPhone } },
      create: { tenantId, phone: normalizedPhone, step: 0, context: {} },
      update: { lastActive: new Date() },
    });

    // Auto-expire session timeouts older than 24 hours back to bot mode
    const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000;
    if (
      session.lastActive &&
      Date.now() - new Date(session.lastActive).getTime() > SESSION_TIMEOUT_MS
    ) {
      if (session.context && (session.context as any).isHumanPaused) {
        await this.prisma.chatSession.update({
          where: { id: session.id },
          data: {
            context: {
              ...((session.context as object) || {}),
              isHumanPaused: false,
            },
            lastActive: new Date(),
          },
        });
        (session.context as any).isHumanPaused = false;
      }
    }

    if (session.context && (session.context as any).isHumanPaused) {
      const upperText = rawText.trim().toUpperCase();
      const isGreeting = ['HI', 'HELLO', 'HEY', 'START', 'MENU', '0'].includes(
        upperText,
      );
      if (isGreeting) {
        await this.prisma.chatSession.update({
          where: { id: session.id },
          data: {
            context: {
              ...((session.context as object) || {}),
              isHumanPaused: false,
            },
          },
        });
        await sendMessageFn(
          jid,
          'You are back in automated mode. How can I help you?',
        );
        return { handled: true, isHumanPaused: false };
      }
      return { handled: true, isHumanPaused: true };
    }

    // Configure Gemini Tools for Interactions API
    const tools = [
      {
        type: 'function',
        name: 'getQueuePosition',
        description:
          'Check the customers current position in the queue. No arguments needed, uses the customers phone number.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        type: 'function',
        name: 'getWaitTime',
        description:
          'Get an estimated wait time for the customer based on their current queue position.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        type: 'function',
        name: 'cancelVisit',
        description: 'Cancel the customers current ticket/visit in the queue.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        type: 'function',
        name: 'bookAppointment',
        description:
          'Book an appointment for a service. Use this when the user says they want to book.',
        parameters: {
          type: 'OBJECT',
          properties: {
            date: { type: 'STRING', description: 'YYYY-MM-DD format date' },
            time: {
              type: 'STRING',
              description: 'HH:MM format time (24 hour)',
            },
            serviceName: {
              type: 'STRING',
              description: 'Name of the service (optional)',
            },
          },
        },
      },
      {
        type: 'function',
        name: 'checkInTodayAppointment',
        description:
          'Check in the customer for their scheduled appointment today and issue their queue ticket.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        type: 'function',
        name: 'getJourneyStatus',
        description:
          'Get comprehensive status of the customers visit, including multi-stage journey progress, current stage, payment requirements, and queue position.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        type: 'function',
        name: 'getPaymentLink',
        description:
          'Get a secure online payment link for the customer to pay for their ticket or service. Use this whenever the customer asks how to pay, asks for a payment link, or wants to settle their bill.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        type: 'function',
        name: 'transferToHuman',
        description:
          'Transfer the conversation to a human operator. Use this if the user asks for a human, or if you cannot help them.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
    ];

    const systemInstruction = `You are a helpful AI assistant for a business named ${tenant.name}. 
Your job is to assist customers with queue status, bookings, payments, and general inquiries via WhatsApp.
Keep responses short, friendly, and conversational. Do not use markdown (except *bold* or _italic_ supported by WhatsApp).
Always try to use the provided tools if the user is asking about their queue status, wait time, or wants to cancel.
If they ask for a payment link or how to pay online, call getPaymentLink.
If they want to book an appointment, ask for the date, time, and service if not provided, then call bookAppointment.
If you don't know the answer or the user is frustrated, call transferToHuman.`;

    const interactionId = (session.context as any)?.interactionId;

    // Call AI
    const aiResponse = await this.aiService.getAiResponse(
      tenantId,
      phone,
      rawText,
      tools,
      systemInstruction,
      interactionId,
    );

    // Save interaction ID for stateful conversation
    await this.prisma.chatSession.update({
      where: { id: session.id },
      data: {
        context: {
          ...((session.context as object) || {}),
          interactionId: aiResponse.interactionId,
        },
      },
    });

    const currentInteractionId = aiResponse.interactionId;
    let finalResponseText = aiResponse.responseText;
    let currentToolCalls = aiResponse.toolCalls;

    // Execute tool calls sequentially
    while (currentToolCalls && currentToolCalls.length > 0) {
      const toolResults = [];

      for (const call of currentToolCalls) {
        const id = call.id;
        const name = call.name;
        const args = call.arguments || {};

        let result: any = { error: 'Unknown tool' };
        try {
          if (name === 'getQueuePosition') {
            result = await this.executeGetQueuePosition(tenantId, phone);
          } else if (name === 'getWaitTime') {
            result = await this.executeGetWaitTime(tenantId, phone);
          } else if (name === 'cancelVisit') {
            result = await this.executeCancelVisit(tenantId, phone);
          } else if (name === 'checkInTodayAppointment') {
            result = await this.executeCheckInTodayAppointment(tenantId, phone);
          } else if (name === 'getJourneyStatus') {
            result = await this.executeGetJourneyStatus(tenantId, phone);
          } else if (name === 'bookAppointment') {
            result = await this.executeBookAppointment(tenantId, phone, args);
          } else if (name === 'getPaymentLink') {
            result = await this.executeGetPaymentLink(tenantId, phone);
          } else if (name === 'transferToHuman') {
            const config = (tenant.chatbotConfig as any) || {};
            const agentName = (config.agentName || '').trim();
            const agentRole = (config.fallbackAgentRole || '').trim();
            const isNamedAgent = agentName && agentName !== 'Support Team';

            const greeting = isNamedAgent
              ? `I have paused automated replies. ${agentName}${agentRole ? ` (${agentRole})` : ''} from our customer care team has been notified and assigned to your chat. They will reply to you here shortly.\n\n(Reply '0' or 'BOT' at any time to return to the automated assistant.)`
              : `I have paused automated replies. Our customer support team has been notified and will take over this chat shortly.\n\n(Reply '0' or 'BOT' at any time to return to the automated assistant.)`;

            await this.prisma.chatSession.update({
              where: { id: session.id },
              data: {
                context: {
                  ...((session.context as object) || {}),
                  isHumanPaused: true,
                  assignedAgentName: isNamedAgent ? agentName : 'Support Team',
                  assignedAgentId: config.fallbackAgentId || null,
                  assignedAgentType: config.fallbackAgentType || 'DEFAULT',
                  assignedAgentRole: agentRole || null,
                  handoverAt: new Date().toISOString(),
                },
              },
            });
            result = {
              success: true,
              message: `Transferred to human operator (${isNamedAgent ? agentName : 'Support Team'})`,
            };
            await sendMessageFn(jid, greeting);
            return { handled: true, isHumanPaused: true, isHandoverEvent: true };
          }
        } catch (err) {
          this.logger.error(
            `Tool execution failed for ${name}: ${err.message}`,
          );
          result = { error: err.message };
        }

        toolResults.push({ toolCallId: id, toolName: name, result });
      }

      // Return all tool results to AI in a single turn
      const followUp = await this.aiService.returnToolResults(
        currentInteractionId,
        toolResults,
      );
      finalResponseText = followUp.responseText;
      currentToolCalls = followUp.toolCalls;
    }

    if (finalResponseText) {
      await sendMessageFn(jid, finalResponseText);
    }

    return { handled: true, isHumanPaused: false };
  }

  // --- Tool Implementations ---

  private async executeGetQueuePosition(tenantId: string, phone: string) {
    const visit = await this.prisma.visit.findFirst({
      where: {
        tenantId,
        customer: { phone: phoneMatchCondition(phone) },
        currentState: { in: ['WAITING', 'CHECKED_IN', 'IN_SERVICE'] },
      },
      include: { queue: true, service: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!visit) return { found: false, message: 'No active tickets found.' };
    if (visit.currentState === 'IN_SERVICE')
      return {
        found: true,
        status: 'IN_SERVICE',
        message: 'You are currently being served.',
      };

    const position = await this.prisma.visit.count({
      where: {
        queueId: visit.queueId,
        currentState: { in: ['WAITING', 'CHECKED_IN'] },
        createdAt: { lt: visit.createdAt },
      },
    });

    return {
      found: true,
      queueName: visit.queue?.name,
      serviceName: visit.service?.name,
      positionAhead: position,
      ticketNumber: visit.displayId,
      _rawQueueId: visit.queueId,
      _rawServiceId: visit.serviceId,
      _rawExpectedDuration: visit.service?.expectedDuration,
    };
  }

  private async executeGetWaitTime(tenantId: string, phone: string) {
    const posResult = await this.executeGetQueuePosition(tenantId, phone);
    if (!posResult.found) return posResult;
    if (posResult.status === 'IN_SERVICE') return posResult;

    const estimatedMinutes = await calculateAdvancedEWT(
      this.prisma,
      posResult._rawQueueId,
      posResult._rawServiceId,
      posResult.positionAhead as number,
      posResult._rawExpectedDuration,
    );

    // Remove internal fields before returning to AI
    delete posResult._rawQueueId;
    delete posResult._rawServiceId;
    delete posResult._rawExpectedDuration;

    return {
      ...posResult,
      estimatedWaitTimeMinutes: estimatedMinutes,
    };
  }

  private async executeCancelVisit(tenantId: string, phone: string) {
    const visit = await this.prisma.visit.findFirst({
      where: {
        tenantId,
        customer: { phone: phoneMatchCondition(phone) },
        currentState: { in: ['WAITING', 'CHECKED_IN'] },
      },
      include: { tenant: true },
    });

    if (!visit)
      return { success: false, message: 'No active tickets to cancel.' };

    const hasPayment = await this.prisma.bookingPayment.findFirst({
      where: { visitId: visit.id, status: 'SUCCEEDED' },
    });

    if (hasPayment) {
      const supportEmail = visit.tenant?.supportEmail || 'the business directly';
      return {
        success: false,
        message: `Ticket ${visit.displayId || 'Unknown'} has an active payment and cannot be cancelled automatically. Please contact ${supportEmail} for refund assistance.`,
      };
    }

    const existingMeta =
      typeof visit.metadata === 'object' && visit.metadata !== null
        ? (visit.metadata as Record<string, any>)
        : {};

    await this.prisma.visit.update({
      where: { id: visit.id },
      data: {
        currentState: 'CANCELLED',
        completedAt: new Date(),
        cancelledBy: 'CUSTOMER',
        cancelReason: 'Cancelled by customer via WhatsApp AI',
        metadata: {
          ...existingMeta,
          cancellation: {
            reason: 'Cancelled by customer via WhatsApp AI',
            cancelledAt: new Date(),
          },
        },
      },
    });

    return { success: true, message: `Ticket ${visit.displayId} cancelled.` };
  }

  private async executeBookAppointment(
    tenantId: string,
    phone: string,
    args: any,
  ) {
    const { date, time, serviceName } = args;
    if (!date || !time)
      return { success: false, message: 'Missing date or time.' };

    let customer = await this.prisma.customer.findFirst({
      where: { tenantId, phone: phoneMatchCondition(phone) },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: { tenantId, phone: normalizePhoneZA(phone), name: 'WhatsApp User' },
      });
    }

    // Default to first location and service if none specified or found
    const locations = await this.prisma.location.findMany({
      where: { tenantId },
    });
    if (locations.length === 0)
      return { success: false, message: 'No locations configured.' };
    const locationId = locations[0].id;

    let serviceId = null;
    const services = await this.prisma.service.findMany({
      where: { tenantId, locationId },
    });
    if (services.length > 0) {
      if (serviceName) {
        const match = services.find((s) =>
          s.name.toLowerCase().includes(serviceName.toLowerCase()),
        );
        serviceId = match ? match.id : services[0].id;
      } else {
        serviceId = services[0].id;
      }
    }

    try {
      const scheduledStart = new Date(`${date}T${time}:00Z`);
      if (isNaN(scheduledStart.getTime()))
        return { success: false, message: 'Invalid date/time format.' };

      const scheduledEnd = new Date(scheduledStart.getTime() + 30 * 60000); // Default 30 min

      await this.appointmentService.create({
        tenantId,
        customerId: customer.id,
        locationId,
        serviceId: serviceId || '',
        scheduledStart,
        scheduledEnd,
        bookingSource: 'WHATSAPP',
      });
      return { success: true, message: 'Appointment booked successfully.' };
    } catch (e) {
      return { success: false, message: `Failed to book: ${e.message}` };
    }
  }

  private async executeCheckInTodayAppointment(
    tenantId: string,
    phone: string,
  ) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const appt = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        customer: { phone: phoneMatchCondition(phone) },
        scheduledStart: { gte: todayStart, lte: todayEnd },
        status: { in: ['CONFIRMED', 'SCHEDULED'] },
      },
      include: {
        customer: true,
        service: true,
        location: true,
      },
      orderBy: { scheduledStart: 'asc' },
    });

    if (!appt) {
      return {
        success: false,
        message:
          'No confirmed appointments scheduled for today were found for this number.',
      };
    }

    // Check if already checked in
    if (appt.customerId) {
      const existing = await this.prisma.visit.findFirst({
        where: {
          tenantId,
          customerId: appt.customerId,
          currentState: { in: ['WAITING', 'CHECKED_IN', 'IN_SERVICE'] },
        },
      });

      if (existing) {
        return {
          success: true,
          alreadyCheckedIn: true,
          displayId: existing.displayId,
          message: `You are already checked in with ticket ${existing.displayId}.`,
        };
      }
    }

    const queue = await this.prisma.queue.findFirst({
      where: { tenantId, locationId: appt.locationId, status: 'ACTIVE' },
    });

    if (!queue) {
      return {
        success: false,
        message:
          'No open queue found for this location. Please approach the front desk.',
      };
    }

    try {
      let visit: any = null;
      if (this.visitService) {
        visit = await this.visitService.joinQueue(queue.id, {
          name: appt.customer?.name || 'Guest',
          phone: appt.customer?.phone || phone,
          serviceId: appt.serviceId,
        });
        if (visit?.id) {
          await this.prisma.visit.update({
            where: { id: visit.id },
            data: { appointmentId: appt.id },
          });
        }
      }

      if (!visit) {
        return { success: false, message: 'Could not create queue ticket.' };
      }

      await this.prisma.appointment.update({
        where: { id: appt.id },
        data: { status: 'CHECKED_IN' },
      });

      const baseAppUrl =
        process.env.APP_URL ||
        (process.env.DOMAIN_BASE
          ? `https://${process.env.DOMAIN_BASE}`
          : 'https://qmova.yqbuddy.com');

      return {
        success: true,
        displayId: visit.displayId,
        service: appt.service?.name,
        location: appt.location?.name,
        trackerUrl: `${baseAppUrl}/customer/status/${visit.id}`,
        message: `Checked in successfully with ticket ${visit.displayId}. Track live at ${baseAppUrl}/customer/status/${visit.id}`,
      };
    } catch (e: any) {
      return { success: false, message: `Check-in failed: ${e.message}` };
    }
  }

  private async executeGetJourneyStatus(tenantId: string, phone: string) {
    const visit = await this.prisma.visit.findFirst({
      where: {
        tenantId,
        customer: { phone: phoneMatchCondition(phone) },
        currentState: { in: ['WAITING', 'CHECKED_IN', 'IN_SERVICE'] },
      },
      include: {
        queue: true,
        service: true,
        location: true,
        visitSteps: { orderBy: { stepOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!visit) {
      return {
        found: false,
        message: 'No active tickets or journey visits found.',
      };
    }

    const position = await this.prisma.visit.count({
      where: {
        queueId: visit.queueId,
        currentState: { in: ['WAITING', 'CHECKED_IN'] },
        createdAt: { lt: visit.createdAt },
      },
    });

    const steps = visit.visitSteps;
    const activeStep: any =
      steps && steps.length > 0
        ? steps.find((s: any) => s.status === 'ACTIVE') ||
          steps.find((s: any) => s.status === 'QUEUED') ||
          steps.find((s: any) => s.status === 'PENDING') ||
          steps[0]
        : null;
    const activeIdx =
      steps && activeStep
        ? steps.findIndex((s: any) => s.id === activeStep.id)
        : 0;
    const totalSteps = steps ? steps.length : 0;

    const baseAppUrl =
      process.env.APP_URL ||
      (process.env.DOMAIN_BASE
        ? `https://${process.env.DOMAIN_BASE}`
        : 'https://qmova.yqbuddy.com');

    return {
      found: true,
      ticketNumber: visit.displayId,
      status: visit.currentState,
      aheadInQueue: position,
      queueName: visit.queue?.name,
      serviceName: visit.service?.name,
      locationName: visit.location?.name,
      totalStages: totalSteps,
      currentStageIndex: totalSteps > 0 ? activeIdx + 1 : 1,
      currentStageName: activeStep?.name || activeStep?.type || 'In Service',
      nextStageName:
        totalSteps > activeIdx + 1 ? steps[activeIdx + 1]?.name : null,
      paymentPending:
        activeStep?.type === 'PAYMENT' && activeStep.paymentStatus !== 'PAID',
      amountDue:
        activeStep?.type === 'PAYMENT' && activeStep.amountCharged
          ? (activeStep.amountCharged / 100).toFixed(2)
          : null,
      trackerUrl: `${baseAppUrl}/customer/status/${visit.id}`,
    };
  }

  private async executeGetPaymentLink(tenantId: string, phone: string) {
    const visit = await this.prisma.visit.findFirst({
      where: {
        tenantId,
        customer: { phone: phoneMatchCondition(phone) },
        currentState: { in: ['WAITING', 'CHECKED_IN', 'IN_SERVICE'] },
      },
      include: {
        service: true,
        tenant: true,
        visitSteps: { orderBy: { stepOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!visit) {
      return {
        success: false,
        message: 'No active queue ticket found for this customer.',
      };
    }

    const paymentStep = visit.visitSteps?.find(
      (s: any) =>
        (s.type === 'PAYMENT' || s.templateStep?.type === 'PAYMENT') &&
        s.paymentStatus !== 'PAID' &&
        s.status !== 'COMPLETED',
    );

    const baseAppUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.DOMAIN_BASE
        ? `https://${process.env.DOMAIN_BASE}`
        : 'https://qmova.yqbuddy.com');

    if (paymentStep) {
      const payUrl = `${baseAppUrl}/pay/${paymentStep.id}`;
      const amount = paymentStep.amountCharged
        ? `R${(paymentStep.amountCharged / 100).toFixed(2)}`
        : null;
      return {
        success: true,
        ticket: visit.displayId,
        service: visit.service?.name,
        amountDue: amount,
        paymentUrl: payUrl,
        message: `Direct secure payment link: ${payUrl}${amount ? ` for ${amount}` : ''}. Please share this link with the customer to complete payment online.`,
      };
    }

    const trackerUrl = `${baseAppUrl}/customer/status/${visit.id}`;
    return {
      success: true,
      ticket: visit.displayId,
      message: `No payment step is currently required. The customer can track their ticket and view status at: ${trackerUrl}`,
    };
  }
}
