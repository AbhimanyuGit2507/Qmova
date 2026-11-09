import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { QueueGateway } from '../queue/queue.gateway';
import { forwardRef, Inject } from '@nestjs/common';
import { getPhoneLookupVariants, formatWhatsAppJid } from '../utils/phone.util';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private redisService: RedisService,
    private whatsappService: WhatsappService,
    @Inject(forwardRef(() => QueueGateway))
    private queueGateway: QueueGateway,
  ) {}

  async getMessages(visitId: string, tenantId: string) {
    const token = await this.prisma.visit.findFirst({
      where: { id: visitId, tenantId },
      include: { customer: true },
    });
    if (!token) throw new NotFoundException('Visit not found');

    const customerPhone = token.customer?.phone;
    const phoneVariants = customerPhone ? getPhoneLookupVariants(customerPhone) : [];

    const messageOrConditions: any[] = [{ visitId }];
    if (phoneVariants.length > 0) {
      messageOrConditions.push({ customerPhone: { in: phoneVariants } });
    }

    const messages = await this.prisma.message.findMany({
      where: {
        tenantId,
        isDeleted: false,
        OR: messageOrConditions,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Also include automated messages sent via WhatsApp (ticket confirmation, reminders, status updates, OTP)
    const commConditions: any[] = [];
    if (phoneVariants.length > 0) {
      commConditions.push({ recipient: { in: phoneVariants } });
    }

    let commLogs: any[] = [];
    if (commConditions.length > 0) {
      commLogs = await this.prisma.communicationLog.findMany({
        where: {
          tenantId,
          channel: { in: ['whatsapp', 'WHATSAPP'] },
          OR: commConditions,
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    const existingMessages = new Set(
      messages.map(
        (m) =>
          `${m.body.trim().slice(0, 40)}_${new Date(m.createdAt).getMinutes()}`,
      ),
    );

    const automatedMessages = commLogs
      .filter(
        (log) =>
          !existingMessages.has(
            `${(log.body || '').trim().slice(0, 40)}_${new Date(log.sentAt || log.createdAt).getMinutes()}`,
          ),
      )
      .map((log) => ({
        id: `comm-${log.id}`,
        body: log.body || '',
        sender: 'SYSTEM',
        createdAt: log.sentAt || log.createdAt,
        conversationId: null,
        customerPhone: log.recipient,
        isRead: true,
        tenantId: log.tenantId || tenantId,
        visitId: token.id,
        isDeleted: false,
        whatsappId: log.providerId || null,
        isAutomated: true,
        automatedType: log.type,
        status:
          log.status === 'SENT' || log.status === 'DELIVERED'
            ? 'delivered'
            : 'sent',
      }));

    const all = [...messages, ...automatedMessages];
    all.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return all;
  }

  async getInbox(tenantId: string, locationId?: string) {
    // If locationId is 'all' or not specified, return all conversations for tenant
    if (!locationId || locationId === 'all') {
      const convos = await this.prisma.customerConversation.findMany({
        where: { tenantId },
        include: {
          messages: {
            where: { isDeleted: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        take: 100,
      });
      return this.attachCustomerDetails(tenantId, convos);
    }

    // Check how many locations this tenant has
    const totalLocations = await this.prisma.location.count({
      where: { tenantId },
    });

    // If tenant only has 1 location (or 0), all conversations belong to this location!
    // Do not filter out any incoming or general chats.
    if (totalLocations <= 1) {
      const convos = await this.prisma.customerConversation.findMany({
        where: { tenantId },
        include: {
          messages: {
            where: { isDeleted: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        take: 100,
      });
      return this.attachCustomerDetails(tenantId, convos);
    }

    // For multi-location tenants: fetch all conversations and filter out only those
    // that belong exclusively to another location.
    const allConvos = await this.prisma.customerConversation.findMany({
      where: { tenantId },
      include: {
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });

    if (allConvos.length === 0) return [];

    const normalize = (p?: string | null) =>
      p ? p.replace(/\D/g, '').slice(-9) : null;

    // 1. Customers with visits or appointments at THIS location
    const thisLocationVisits = await this.prisma.visit.findMany({
      where: {
        tenantId,
        OR: [{ locationId }, { queue: { locationId } }],
      },
      select: {
        customer: { select: { phone: true } },
      },
    });

    const thisLocationApts = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        locationId,
      },
      select: {
        customer: { select: { phone: true } },
      },
    });

    const thisLocationPhones = new Set<string>();
    thisLocationVisits.forEach((v) => {
      const n = normalize(v.customer?.phone);
      if (n) thisLocationPhones.add(n);
    });
    thisLocationApts.forEach((a) => {
      const n = normalize(a.customer?.phone);
      if (n) thisLocationPhones.add(n);
    });

    // 2. Customers with visits or appointments at OTHER locations
    const otherLocationVisits = await this.prisma.visit.findMany({
      where: {
        tenantId,
        locationId: { not: locationId },
      },
      select: {
        customer: { select: { phone: true } },
      },
    });

    const otherLocationApts = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        locationId: { not: locationId },
      },
      select: {
        customer: { select: { phone: true } },
      },
    });

    const otherLocationPhones = new Set<string>();
    otherLocationVisits.forEach((v) => {
      const n = normalize(v.customer?.phone);
      if (n) otherLocationPhones.add(n);
    });
    otherLocationApts.forEach((a) => {
      const n = normalize(a.customer?.phone);
      if (n) otherLocationPhones.add(n);
    });

    // A conversation matches this location if:
    // a) The customer has visits/appointments at this location, OR
    // b) The customer has NO visits/appointments at any other location (general inquiry/prospect)
    const filteredConvos = allConvos.filter((c) => {
      const clean = normalize(c.customerPhone);
      if (!clean) return true;
      if (thisLocationPhones.has(clean)) return true;
      // If customer is tied exclusively to another branch, exclude
      if (otherLocationPhones.has(clean)) return false;
      // General inquiry / new lead belongs to all locations
      return true;
    });

    return this.attachCustomerDetails(tenantId, filteredConvos);
  }

  private async attachCustomerDetails(tenantId: string, convos: any[]) {
    if (convos.length === 0) return convos;

    const allVariants = new Set<string>();
    const convoVariantMap = new Map<string, string[]>();

    for (const c of convos) {
      const variants = getPhoneLookupVariants(c.customerPhone);
      convoVariantMap.set(c.customerPhone, variants);
      variants.forEach((v) => allVariants.add(v));
    }

    const [customers, sessions] = await Promise.all([
      this.prisma.customer.findMany({
        where: { tenantId, phone: { in: Array.from(allVariants) } },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.chatSession.findMany({
        where: { tenantId, phone: { in: convos.map((c) => c.customerPhone) } },
      }),
    ]);

    const customerMap = new Map<string, any>();
    for (const c of customers) {
      if (c.phone) {
        if (!customerMap.has(c.phone)) {
          customerMap.set(c.phone, c);
        }
        const variants = getPhoneLookupVariants(c.phone);
        for (const v of variants) {
          if (!customerMap.has(v)) {
            customerMap.set(v, c);
          }
        }
      }
    }

    const sessionMap = new Map();
    for (const s of sessions) {
      sessionMap.set(s.phone, s);
    }

    return convos.map((c) => {
      const variants = convoVariantMap.get(c.customerPhone) || [c.customerPhone];
      let cust: any = null;
      for (const v of variants) {
        if (customerMap.has(v)) {
          cust = customerMap.get(v);
          break;
        }
      }

      const session = sessionMap.get(c.customerPhone);
      const sessionCtx =
        session?.context && typeof session.context === 'object'
          ? (session.context as any)
          : null;
      const isHumanPaused = sessionCtx ? !!sessionCtx.isHumanPaused : false;

      return {
        ...c,
        customerId: cust?.id || null,
        customerName: cust?.name || null,
        customerEmail: cust?.email || null,
        customerAvatar: cust?.avatarUrl || null,
        lastMessage: c.messages?.[0] || null,
        isHumanPaused,
        assignedAgentName: sessionCtx?.assignedAgentName || null,
        assignedAgentId: sessionCtx?.assignedAgentId || null,
        assignedAgentRole: sessionCtx?.assignedAgentRole || null,
        assignedAgentType: sessionCtx?.assignedAgentType || null,
        handoverAt: sessionCtx?.handoverAt || null,
      };
    });
  }

  /**
   * Synchronizes recent chat messages (both inbound and outbound sent from phone/web)
   * from Evolution API into the database for full conversational fidelity.
   */
  async syncEvolutionChatHistory(
    tenantId: string,
    phone: string,
    forceSync = false,
  ): Promise<number> {
    const rawDigits = phone.replace(/\D/g, '');
    if (!rawDigits) return 0;

    const lockKey = `inbox_sync:${tenantId}:${rawDigits}`;
    if (!forceSync) {
      try {
        const alreadySynced = await this.redisService.client.get(lockKey);
        if (alreadySynced) return 0;
      } catch (err) {
        // Continue if Redis check fails
      }
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, whatsappInstanceId: true, whatsappConnected: true },
    });

    if (!tenant?.whatsappInstanceId || !tenant.whatsappConnected) {
      return 0;
    }

    // Set 30-second debounce in Redis to avoid re-syncing on every 6s poll
    try {
      await this.redisService.client.set(lockKey, '1', 'EX', 30);
    } catch (e) {
      // Non-critical
    }

    const remoteJid = formatWhatsAppJid(phone);
    if (!remoteJid) return 0;

    const records = await this.whatsappService.findChatMessages(
      tenant.whatsappInstanceId,
      remoteJid,
      100,
    );

    if (!records || records.length === 0) {
      return 0;
    }

    const recordIds = records
      .map((r: any) => r.key?.id)
      .filter((id: any): id is string => typeof id === 'string' && !!id);

    if (recordIds.length === 0) return 0;

    const existingMessages = await this.prisma.message.findMany({
      where: {
        tenantId,
        whatsappId: { in: recordIds },
      },
      select: { whatsappId: true },
    });

    const existingSet = new Set(existingMessages.map((m) => m.whatsappId));
    let syncedCount = 0;

    // Ensure conversation exists
    const conversation = await this.prisma.customerConversation.upsert({
      where: {
        tenantId_customerPhone: {
          tenantId,
          customerPhone: phone,
        },
      },
      update: { status: 'OPEN' },
      create: {
        tenantId,
        customerPhone: phone,
        status: 'OPEN',
        unreadCount: 0,
      },
    });

    for (const rec of records) {
      const msgId = rec.key?.id;
      if (!msgId || existingSet.has(msgId)) continue;

      const text = this.whatsappService.extractMessageText(rec.message)?.trim();
      if (!text) continue;

      const fromMe = !!rec.key?.fromMe;
      const msgTimestamp = rec.messageTimestamp
        ? new Date(Number(rec.messageTimestamp) * 1000)
        : new Date();

      try {
        await this.prisma.message.create({
          data: {
            tenantId,
            customerPhone: phone,
            conversationId: conversation.id,
            body: text,
            sender: fromMe ? 'MANAGER' : 'CUSTOMER',
            isRead: true,
            whatsappId: msgId,
            createdAt: msgTimestamp,
          },
        });
        existingSet.add(msgId);
        syncedCount++;
      } catch (insertErr) {
        // Skip duplicate or constraint collisions safely
      }
    }

    if (syncedCount > 0) {
      // Update lastMessageAt on the conversation
      await this.prisma.customerConversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });
    }

    return syncedCount;
  }

  async getInboxMessages(tenantId: string, phone: string, forceSync = false) {
    const phoneVariants = getPhoneLookupVariants(phone);

    // Auto-sync missing history from WhatsApp Evolution API (cached/debounced 30s)
    try {
      await this.syncEvolutionChatHistory(tenantId, phone, forceSync);
    } catch (syncErr) {
      // Non-blocking fallback
    }

    // Reset unread count
    await this.prisma.customerConversation.updateMany({
      where: { tenantId, customerPhone: { in: phoneVariants } },
      data: { unreadCount: 0 },
    });

    const messages = await this.prisma.message.findMany({
      where: {
        tenantId,
        isDeleted: false,
        customerPhone: { in: phoneVariants },
      },
      orderBy: { createdAt: 'asc' },
    });

    const commLogs = await this.prisma.communicationLog.findMany({
      where: {
        tenantId,
        channel: { in: ['whatsapp', 'WHATSAPP'] },
        recipient: { in: phoneVariants },
      },
      orderBy: { createdAt: 'asc' },
    });

    const existingMessages = new Set(
      messages.map(
        (m) =>
          `${m.body.trim().slice(0, 40)}_${new Date(m.createdAt).getMinutes()}`,
      ),
    );

    const automatedMessages = commLogs
      .filter(
        (log) =>
          !existingMessages.has(
            `${(log.body || '').trim().slice(0, 40)}_${new Date(log.sentAt || log.createdAt).getMinutes()}`,
          ),
      )
      .map((log) => ({
        id: `comm-${log.id}`,
        body: log.body || '',
        sender: 'SYSTEM',
        createdAt: log.sentAt || log.createdAt,
        conversationId: null,
        customerPhone: log.recipient,
        isRead: true,
        tenantId: log.tenantId || tenantId,
        visitId: null,
        isDeleted: false,
        whatsappId: log.providerId || null,
        isAutomated: true,
        automatedType: log.type,
        status:
          log.status === 'SENT' || log.status === 'DELIVERED'
            ? 'delivered'
            : 'sent',
      }));

    const all = [...messages, ...automatedMessages];
    all.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return all;
  }

  async sendMessageFromOperator(
    visitId: string,
    text: string,
    tenantId: string,
  ) {
    const token = await this.prisma.visit.findFirst({
      where: { id: visitId, tenantId },
      include: { queue: true, customer: true },
    });
    if (!token) throw new NotFoundException('Visit not found');

    const conversation = await this.prisma.customerConversation.upsert({
      where: {
        tenantId_customerPhone: {
          tenantId,
          customerPhone: token.customer?.phone || '',
        },
      },
      update: { lastMessageAt: new Date(), status: 'OPEN' },
      create: {
        tenantId,
        customerPhone: token.customer?.phone || '',
        status: 'OPEN',
        unreadCount: 0,
      },
    });

    const message = await this.prisma.message.create({
      data: {
        tenantId,
        customerPhone: token.customer?.phone || '',
        conversationId: conversation.id,
        visitId,
        body: text,
        sender: 'MANAGER',
      },
    });

    // Notify customer via WhatsApp
    if (token.customer?.phone) {
      await this.notificationsService.sendWhatsAppMessage(
        token.customer.phone,
        text,
        token.tenantId,
        message.id,
      );
    }

    // Broadcast message to Dashboard & Live Status
    if (token.queueId) {
      this.queueGateway.broadcastQueueUpdate(token.queueId, 'NEW_MESSAGE', {
        message,
      });
    }

    return message;
  }

  async sendInboxMessage(
    tenantId: string,
    phone: string,
    text?: string,
    media?: string,
    mediaType?: string,
    fileName?: string,
  ) {
    const cleanText = text?.trim() || '';
    if (!cleanText && !media) {
      throw new NotFoundException('Message must contain text or an attachment');
    }

    // Upsert conversation to keep it active
    const conversation = await this.prisma.customerConversation.upsert({
      where: { tenantId_customerPhone: { tenantId, customerPhone: phone } },
      update: { lastMessageAt: new Date(), status: 'OPEN' },
      create: {
        tenantId,
        customerPhone: phone,
        status: 'OPEN',
        unreadCount: 0,
      },
    });

    const bodyText = media
      ? cleanText
        ? `[Media Attachment] ${cleanText}`
        : '[Media Attachment]'
      : cleanText;

    const message = await this.prisma.message.create({
      data: {
        tenantId,
        customerPhone: phone,
        conversationId: conversation.id,
        body: bodyText,
        sender: 'MANAGER',
      },
    });

    if (media && mediaType) {
      await this.whatsappService.sendMediaToTenant(
        tenantId,
        phone,
        media,
        mediaType,
        cleanText,
        fileName,
      );
    } else {
      await this.notificationsService.sendWhatsAppMessage(
        phone,
        cleanText,
        tenantId,
        message.id,
      );
    }

    // Auto-pause bot and lock in human mode for 2 hours when staff dispatches a manual reply
    try {
      await this.toggleBot(tenantId, phone, true);
    } catch (e) {
      // Non-blocking if chat session cannot be created
    }

    this.queueGateway.broadcastTenantUpdate(tenantId, 'NEW_INBOX_MESSAGE', {
      phone,
    });

    return message;
  }

  async deleteMessage(tenantId: string, messageId: string) {
    return this.whatsappService.deleteMessage(tenantId, messageId);
  }

  async getInboxDossier(tenantId: string, phone: string) {
    const phoneVariants = getPhoneLookupVariants(phone);

    // 1. Find Customer (match exact or phone variants)
    const customer = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        phone: { in: phoneVariants },
      },
      include: {
        medicalProfile: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const customerId = customer?.id;

    // 2. Query Visits: match strictly by customerId or matching customer.phone
    const visitOrConditions: any[] = [];
    if (customerId) visitOrConditions.push({ customerId });
    visitOrConditions.push({ customer: { phone: { in: phoneVariants } } });

    const visits = await this.prisma.visit.findMany({
      where: {
        tenantId,
        OR: visitOrConditions,
      },
      include: {
        service: true,
        location: true,
        queue: true,
        staff: true,
        bookingPayments: true,
        visitInvoice: true,
        reviewRequests: true,
        visitSteps: { orderBy: { stepOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 3. Query Appointments: match strictly by customerId or matching customer.phone
    const aptOrConditions: any[] = [];
    if (customerId) aptOrConditions.push({ customerId });
    aptOrConditions.push({ customer: { phone: { in: phoneVariants } } });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        OR: aptOrConditions,
      },
      include: {
        service: true,
        location: true,
        staff: true,
        bookingPayments: true,
      },
      orderBy: { scheduledStart: 'desc' },
      take: 50,
    });

    // 4. Query ReviewRequests
    const reviewOrConditions: any[] = [];
    if (customerId) reviewOrConditions.push({ customerId });
    if (visits.length > 0) {
      reviewOrConditions.push({ visitId: { in: visits.map((v) => v.id) } });
    }

    const reviewRequests =
      reviewOrConditions.length > 0
        ? await this.prisma.reviewRequest.findMany({
            where: {
              tenantId,
              OR: reviewOrConditions,
            },
            include: {
              visit: {
                include: { service: true, location: true },
              },
            },
            orderBy: { sentAt: 'desc' },
            take: 20,
          })
        : [];

    // 5. Query CustomerConversation & Message count
    const conversation = await this.prisma.customerConversation.findFirst({
      where: { tenantId, customerPhone: { in: phoneVariants } },
    });

    const messageCount = await this.prisma.message.count({
      where: {
        tenantId,
        customerPhone: { in: phoneVariants },
      },
    });

    // 6. Active Ticket Today
    const activeTicket = visits.find((v) => {
      const isTerminal = [
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
        'ABANDONED',
        'EXPIRED',
      ].includes(v.currentState);
      if (isTerminal) return false;

      // Actively waiting, called, in-service, or paying right now
      if (
        ['WAITING', 'CALLED', 'IN_SERVICE', 'PENDING_PAYMENT'].includes(
          v.currentState,
        )
      ) {
        return true;
      }

      // If CREATED or SCHEDULED, check if scheduled or created within the last 24h
      const targetDate = v.scheduledTime || v.actualArrival || v.createdAt;
      const hoursDiff =
        Math.abs(Date.now() - new Date(targetDate).getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    });

    // 7. Upcoming Appointments
    const now = new Date();
    const upcomingAppointments = appointments
      .filter(
        (a) => new Date(a.scheduledStart) >= now && a.status !== 'CANCELLED',
      )
      .map((a) => ({
        id: a.id,
        scheduledStart: a.scheduledStart,
        scheduledEnd: a.scheduledEnd,
        status: a.status,
        serviceName: a.service?.name || 'General Service',
        locationName: a.location?.name || 'Main Location',
        staffName: a.staff?.name || null,
        paymentStatus: a.paymentStatus,
      }));

    // 8. Consolidated Past Bookings (Visits + Completed/Past Appointments)
    const pastBookings: any[] = [];

    visits.forEach((v) => {
      const payments = v.bookingPayments || [];
      const successfulPayment = payments.find((p) => p.status === 'SUCCEEDED');
      const totalPaid = payments
        .filter((p) => p.status === 'SUCCEEDED')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const reviewReq = v.reviewRequests?.find((r) => r.rating || r.feedback);
      const rating = v.rating || reviewReq?.rating || null;
      const feedback = v.feedbackText || reviewReq?.feedback || null;

      pastBookings.push({
        id: v.id,
        bookingType: 'VISIT',
        ticketNumber: v.displayId || v.id.slice(0, 6),
        date: v.actualArrival || v.checkInTime || v.createdAt,
        currentState: v.currentState,
        serviceName: v.service?.name || 'General Service',
        locationName: v.location?.name || v.queue?.name || 'Main Location',
        staffName: v.staff?.name || null,
        amount: totalPaid,
        currency:
          successfulPayment?.currency ||
          (v.service as any)?.priceCurrency ||
          (v.service as any)?.currency ||
          'ZAR',
        rating,
        feedback,
        notes: v.notes,
        cancelReason: v.cancelReason,
        rawVisit: v,
      });
    });

    appointments.forEach((a) => {
      // If appointment already materialized into a visit, avoid duplicate row
      if (visits.some((v) => v.appointmentId === a.id)) return;
      if (new Date(a.scheduledStart) >= now && a.status !== 'CANCELLED') return;

      const payments = a.bookingPayments || [];
      const totalPaid = payments
        .filter((p) => p.status === 'SUCCEEDED')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      pastBookings.push({
        id: a.id,
        bookingType: 'APPOINTMENT',
        ticketNumber: null,
        date: a.scheduledStart,
        currentState: a.status,
        serviceName: a.service?.name || 'General Service',
        locationName: a.location?.name || 'Main Location',
        staffName: a.staff?.name || null,
        amount: totalPaid,
        currency: payments[0]?.currency || 'ZAR',
        rating: null,
        feedback: null,
        notes: a.customerNotes,
        rawVisit: null,
      });
    });

    pastBookings.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // 9. Reviews & Feedback collection
    const reviews: any[] = [];
    pastBookings.forEach((b) => {
      if (b.rating || b.feedback) {
        reviews.push({
          id: b.id,
          rating: b.rating,
          feedback: b.feedback,
          date: b.date,
          serviceName: b.serviceName,
          locationName: b.locationName,
          staffName: b.staffName,
        });
      }
    });

    reviewRequests.forEach((r) => {
      if (
        (r.rating || r.feedback) &&
        !reviews.some((rv) => rv.id === r.visitId)
      ) {
        reviews.push({
          id: r.id,
          rating: r.rating,
          feedback: r.feedback,
          date: r.completedAt || r.sentAt,
          serviceName: r.visit?.service?.name || 'Service',
          locationName: r.visit?.location?.name || 'Main Location',
          staffName: null,
        });
      }
    });

    // 10. Summary Metrics & Stats
    const totalVisitsCount = visits.length;
    const completedVisits = visits.filter(
      (v) => v.currentState === 'COMPLETED',
    ).length;
    const cancelledVisits = visits.filter(
      (v) => v.currentState === 'CANCELLED',
    ).length;
    const noShowVisits = visits.filter(
      (v) => v.currentState === 'NO_SHOW',
    ).length;

    // Distinguish walk-ins vs online/scheduled bookings using VisitSource enum
    const walkInsCount = visits.filter(
      (v) =>
        !v.scheduledTime &&
        !v.appointmentId &&
        (v.source === 'WALK_IN' || v.source === 'RECEPTION'),
    ).length;
    const onlineVisitsCount = totalVisitsCount - walkInsCount;
    const totalBookingsCount = onlineVisitsCount + appointments.length;

    const totalSpent = pastBookings.reduce(
      (sum, b) => sum + (b.amount || 0),
      0,
    );
    const currency =
      pastBookings.find((b) => b.currency && b.currency !== 'INR')?.currency ||
      pastBookings.find((b) => b.currency)?.currency ||
      'ZAR';

    const ratedItems = pastBookings.filter(
      (b) => typeof b.rating === 'number' && b.rating > 0,
    );
    const avgRating =
      ratedItems.length > 0
        ? Number(
            (
              ratedItems.reduce((acc, curr) => acc + curr.rating, 0) /
              ratedItems.length
            ).toFixed(1),
          )
        : null;

    // Preferred location
    const locationCounts: Record<string, number> = {};
    pastBookings.forEach((b) => {
      if (b.locationName) {
        locationCounts[b.locationName] =
          (locationCounts[b.locationName] || 0) + 1;
      }
    });
    const preferredLocation =
      Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    const totalAttempts = completedVisits + cancelledVisits + noShowVisits;
    const reliabilityRate =
      totalAttempts > 0
        ? Math.round((completedVisits / totalAttempts) * 100)
        : null;

    return {
      customer: customer
        ? {
            id: customer.id,
            name: customer.name,
            phone: customer.phone || phone,
            email: customer.email,
            isVip: customer.isVip,
            isBlocked: customer.isBlocked,
            notes: customer.notes,
            createdAt: customer.createdAt,
          }
        : null,
      stats: {
        totalVisits: totalVisitsCount,
        totalAppointments: appointments.length,
        totalBookings: pastBookings.length,
        walkInsCount,
        onlineBookingsCount: totalBookingsCount,
        completedCount: completedVisits,
        totalSpent,
        currency,
        avgRating,
        totalReviews: reviews.length,
        preferredLocation,
        reliabilityRate,
        noShowCount: noShowVisits,
        cancelledCount: cancelledVisits,
      },
      activeTicket: activeTicket
        ? {
            id: activeTicket.id,
            displayId: activeTicket.displayId || activeTicket.id.slice(0, 6),
            currentState: activeTicket.currentState,
            serviceName: activeTicket.service?.name || 'General Service',
            queueName: activeTicket.queue?.name || 'Queue',
            locationName: activeTicket.location?.name || 'Main Location',
            createdAt: activeTicket.createdAt,
            rawVisit: activeTicket,
          }
        : null,
      upcomingAppointments,
      pastBookings,
      reviews,
      conversationMeta: {
        channel: 'WhatsApp Cloud',
        firstContactAt: conversation?.createdAt || null,
        lastMessageAt: conversation?.lastMessageAt || null,
        totalMessages: messageCount,
      },
    };
  }

  async updateInboxCustomer(
    tenantId: string,
    phone: string,
    body: {
      name?: string;
      email?: string;
      notes?: string;
      isVip?: boolean;
      isBlocked?: boolean;
    },
  ) {
    const cleanDigits = phone ? phone.replace(/\D/g, '') : '';
    const last9 = cleanDigits.length >= 7 ? cleanDigits.slice(-9) : cleanDigits;

    let customer = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        OR: [
          { phone },
          ...(cleanDigits
            ? [{ phone: cleanDigits }, { phone: `+${cleanDigits}` }]
            : []),
          ...(last9 ? [{ phone: { contains: last9 } }] : []),
        ],
      },
    });

    if (customer) {
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.email !== undefined ? { email: body.email } : {}),
          ...(body.notes !== undefined ? { notes: body.notes } : {}),
          ...(body.isVip !== undefined ? { isVip: body.isVip } : {}),
          ...(body.isBlocked !== undefined
            ? { isBlocked: body.isBlocked }
            : {}),
        },
      });
    } else {
      customer = await this.prisma.customer.create({
        data: {
          tenantId,
          name: body.name || 'WhatsApp Contact',
          phone,
          email: body.email || null,
          notes: body.notes || null,
          isVip: body.isVip || false,
          isBlocked: body.isBlocked || false,
        },
      });
    }

    return customer;
  }

  async markAsRead(tenantId: string, phone: string) {
    await this.prisma.customerConversation.updateMany({
      where: { tenantId, customerPhone: phone },
      data: { unreadCount: 0 },
    });
    this.queueGateway.broadcastTenantUpdate(tenantId, 'NEW_INBOX_MESSAGE', {
      phone,
      unreadCount: 0,
    });
    return { success: true };
  }

  async toggleBot(
    tenantId: string,
    phone: string,
    paused?: boolean,
    agentInfo?: {
      agentName?: string;
      agentId?: string;
      agentRole?: string;
      agentType?: string;
    },
  ) {
    const session = await this.prisma.chatSession.findUnique({
      where: { tenantId_phone: { tenantId, phone } },
    });
    const currentContext = (session?.context as object) || {};
    const currentlyPaused = !!(currentContext as any).isHumanPaused;
    const targetPaused =
      typeof paused === 'boolean' ? paused : !currentlyPaused;

    let assignedAgentName = (currentContext as any).assignedAgentName;
    let assignedAgentId = (currentContext as any).assignedAgentId;
    let assignedAgentRole = (currentContext as any).assignedAgentRole;
    let assignedAgentType = (currentContext as any).assignedAgentType;

    if (targetPaused) {
      if (agentInfo?.agentName) {
        assignedAgentName = agentInfo.agentName;
        assignedAgentId = agentInfo.agentId || null;
        assignedAgentRole = agentInfo.agentRole || null;
        assignedAgentType = agentInfo.agentType || 'USER';
      } else if (!assignedAgentName) {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { chatbotConfig: true },
        });
        const cfg = (tenant?.chatbotConfig as any) || {};
        assignedAgentName = cfg.agentName || 'Support Team';
        assignedAgentId = cfg.fallbackAgentId || null;
        assignedAgentRole = cfg.fallbackAgentRole || null;
        assignedAgentType = cfg.fallbackAgentType || 'DEFAULT';
      }
    } else {
      assignedAgentName = null;
      assignedAgentId = null;
      assignedAgentRole = null;
      assignedAgentType = null;
    }

    const updatedContext = {
      ...currentContext,
      isHumanPaused: targetPaused,
      assignedAgentName,
      assignedAgentId,
      assignedAgentRole,
      assignedAgentType,
      handoverAt: targetPaused ? new Date().toISOString() : null,
    };

    await this.prisma.chatSession.upsert({
      where: { tenantId_phone: { tenantId, phone } },
      create: {
        tenantId,
        phone,
        step: 0,
        context: updatedContext,
      },
      update: {
        context: updatedContext,
        lastActive: new Date(),
      },
    });

    // Enforce 2-hour human handover lock in Redis
    try {
      if (targetPaused) {
        await this.redisService.client.set(
          `bot_muted:${tenantId}:${phone}`,
          '1',
          'EX',
          7200,
        );
      } else {
        await this.redisService.client.del(`bot_muted:${tenantId}:${phone}`);
      }
    } catch (e) {
      // Ignore Redis errors
    }

    this.queueGateway.broadcastTenantUpdate(tenantId, 'NEW_INBOX_MESSAGE', {
      phone,
      isHumanPaused: targetPaused,
      botEnabled: !targetPaused,
      assignedAgentName,
      assignedAgentRole,
    });

    return {
      success: true,
      isHumanPaused: targetPaused,
      botEnabled: !targetPaused,
      assignedAgentName,
      assignedAgentRole,
    };
  }

  async sendPaymentLink(
    tenantId: string,
    phone: string,
    visitId: string,
    visitStepId?: string,
  ) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        service: true,
        tenant: true,
        visitSteps: { orderBy: { stepOrder: 'asc' } },
      },
    });

    if (!visit || visit.tenantId !== tenantId) {
      throw new BadRequestException('Visit not found');
    }

    const step = visitStepId
      ? visit.visitSteps.find((s) => s.id === visitStepId)
      : visit.visitSteps.find(
          (s) => s.type === 'PAYMENT' && s.status === 'ACTIVE',
        );

    const appBase =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      'https://qmova.yqbuddy.com';

    const payUrl = step
      ? `${appBase}/pay/${step.id}`
      : `${appBase}/customer/status/${visit.id}`;

    const amount = step?.amountCharged
      ? `R${(step.amountCharged / 100).toFixed(2)}`
      : visit.service?.basePrice
        ? `R${(visit.service.basePrice / 100).toFixed(2)}`
        : null;

    const messageText =
      `💳 *Payment Request from ${visit.tenant.name}*\n\n` +
      `Ticket: *${visit.displayId || 'Queue Visit'}*\n` +
      `Service: *${visit.service?.name || 'Service'}*\n` +
      (amount ? `Amount Due: *${amount}*\n\n` : '\n') +
      `Please click the link below to complete your payment securely:\n${payUrl}`;

    return this.sendInboxMessage(tenantId, phone, messageText);
  }
}
