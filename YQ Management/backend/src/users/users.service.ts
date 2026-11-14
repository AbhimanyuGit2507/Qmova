import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private emailService: EmailService,
    @Inject(forwardRef(() => SubscriptionService))
    private subscriptionService: SubscriptionService,
  ) {}

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOneById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updatePassword(id: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async create(data: Prisma.UserUncheckedCreateInput) {
    let hashedPassword = null;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async getUsersByTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, ownerId: true },
    });

    const tenantName = tenant?.name || 'Your Team';
    const ownerId = tenant?.ownerId ?? null;

    const activeUsers = await this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        phone: true,
        description: true,
        allowedLocationIds: true,
        allowedPages: true,
        allowedServiceIds: true,
      },
    });

    // If ownerId not set on Tenant, fall back to first OWNER
    const resolvedOwnerId =
      ownerId ??
      (activeUsers.find((u) => u.role === 'OWNER') || activeUsers[0])?.id ??
      null;

    const onGroundStaff = await this.prisma.staff.findMany({
      where: { tenantId },
      include: {
        services: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
      },
    });

    const staffList: any[] = activeUsers.map((u) => {
      const staff = onGroundStaff.find(
        (s) =>
          s.userId === u.id ||
          (s.email && u.email && s.email.toLowerCase() === u.email.toLowerCase()),
      );
      return {
        id: u.id,
        email: u.email,
        name: u.name || staff?.name,
        phone: u.phone || staff?.phone,
        description: u.description || staff?.bio,
        title: staff?.title,
        color: staff?.color,
        role: u.role,
        status: 'ACTIVE',
        isInvite: false,
        isOwner: u.id === resolvedOwnerId,
        staffId: staff?.id || null,
        deskToken: staff?.deskToken || null,
        services: staff?.services || [],
        location: staff?.location || null,
        capacity: staff?.capacity ?? 1,
        allowedLocationIds: u.allowedLocationIds || [],
        allowedPages: u.allowedPages || [],
        allowedServiceIds: u.allowedServiceIds || [],
      };
    });

    const invites = await this.prisma.invitation.findMany({
      where: { tenantId, email: { not: null } },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const tenantAdmin =
      activeUsers.find((u) => u.role === 'OWNER' || u.role === 'SUPER_ADMIN') ||
      activeUsers[0];

    for (const inv of invites) {
      if (
        !inv.email ||
        staffList.some(
          (s) => s.email?.toLowerCase() === inv.email?.toLowerCase(),
        )
      ) {
        continue;
      }

      const isExpired =
        (inv.expiresAt && inv.expiresAt < now) ||
        (inv.usedCount >= inv.maxUses && inv.used);
      if (isExpired && !inv.used) {
        await this.prisma.invitation.update({
          where: { id: inv.id },
          data: { used: true },
        });
        if (tenantAdmin?.email) {
          this.emailService.sendInvitationExpiredNotification(
            tenantAdmin.email,
            inv.email,
            tenantName,
          );
        }
        staffList.push({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          status: 'EXPIRED',
          code: inv.code,
          expiresAt: inv.expiresAt,
          isInvite: true,
          allowedLocationIds: inv.allowedLocationIds || [],
          allowedPages: inv.allowedPages || [],
          allowedServiceIds: inv.allowedServiceIds || [],
        });
      } else if (isExpired || inv.used) {
        staffList.push({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          status: 'EXPIRED',
          code: inv.code,
          expiresAt: inv.expiresAt,
          isInvite: true,
          allowedLocationIds: inv.allowedLocationIds || [],
          allowedPages: inv.allowedPages || [],
          allowedServiceIds: inv.allowedServiceIds || [],
        });
      } else {
        staffList.push({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          status: 'INVITED',
          code: inv.code,
          expiresAt: inv.expiresAt,
          isInvite: true,
          allowedLocationIds: inv.allowedLocationIds || [],
          allowedPages: inv.allowedPages || [],
          allowedServiceIds: inv.allowedServiceIds || [],
        });
      }
    }

    // Also include any kiosk-only staff (created without a User login) in the unified team list
    for (const s of onGroundStaff) {
      const alreadyIncluded = staffList.some(
        (u) =>
          u.staffId === s.id ||
          (s.userId && u.id === s.userId) ||
          (s.email && u.email?.toLowerCase() === s.email.toLowerCase()),
      );
      if (!alreadyIncluded) {
        staffList.push({
          id: s.id,
          staffId: s.id,
          email: s.email || null,
          name: s.name,
          phone: s.phone,
          description: s.bio,
          title: s.title,
          color: s.color,
          role: 'STAFF',
          status: s.status,
          isInvite: false,
          isOwner: false,
          isKioskOnly: true,
          deskToken: s.deskToken,
          services: s.services || [],
          location: s.location || null,
          capacity: s.capacity ?? 1,
          allowedLocationIds: s.locationId ? [s.locationId] : [],
          allowedPages: ['my-desk'],
          allowedServiceIds: s.services?.map((svc) => svc.id) || [],
        });
      }
    }

    return staffList;
  }

  async createUser(
    tenantId: string,
    data: {
      email?: string;
      name?: string;
      phone?: string;
      title?: string;
      role: any;
      password?: string;
      allowedLocationIds?: string[];
      allowedServiceIds?: string[];
      allowedPages?: string[];
      makeBookable?: boolean;
      isKioskOnly?: boolean;
      templateId?: string;
    },
  ) {
    // If isKioskOnly, create a Staff record with dedicated deskToken directly
    if (data.isKioskOnly) {
      const currentStaffCount = await this.prisma.staff.count({
        where: { tenantId },
      });
      await this.subscriptionService.checkLimit(
        tenantId,
        'staff',
        currentStaffCount,
      );

      const token = randomBytes(24).toString('hex');
      const staff = await this.prisma.staff.create({
        data: {
          tenantId,
          name: data.name || (data.email ? data.email.split('@')[0] : 'Staff Station'),
          email: data.email || null,
          phone: data.phone || null,
          title: data.title || 'Staff Specialist',
          status: 'ACTIVE',
          deskToken: token,
          locationId: data.allowedLocationIds?.[0] || undefined,
          ...(data.allowedServiceIds && data.allowedServiceIds.length > 0
            ? {
                services: {
                  connect: data.allowedServiceIds.map((id) => ({ id })),
                },
              }
            : {}),
        },
        include: {
          services: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
        },
      });

      if (data.templateId) {
        const tenantWithLayout = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { staffViewLayout: true },
        });
        const currentSvl: any = tenantWithLayout?.staffViewLayout || {
          version: 2,
          templates: [],
          assignments: {},
        };
        const updatedAssignments = {
          ...(currentSvl.assignments || {}),
          [staff.id]: data.templateId,
        };
        await this.prisma.tenant.update({
          where: { id: tenantId },
          data: {
            staffViewLayout: {
              ...currentSvl,
              version: 2,
              assignments: updatedAssignments,
            },
          },
        });
      }

      return {
        status: 'USER_ADDED',
        staff,
        deskToken: staff.deskToken,
        message: 'On-ground staff member created with dedicated desk kiosk.',
      };
    }

    if (!data.email) {
      throw new BadRequestException('Email is required to invite a team member.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    const tenantName = tenant?.name || 'Your Team';

    // Enforce workspace staff / team member quota limit
    const [currentUsersCount, pendingInvitesCount] = await Promise.all([
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.invitation.count({
        where: { tenantId, used: false, email: { not: data.email } },
      }),
    ]);
    const totalStaffCount = currentUsersCount + pendingInvitesCount;
    await this.subscriptionService.checkLimit(
      tenantId,
      'staff',
      totalStaffCount,
    );

    const handleMakeStaff = async (userId?: string) => {
      if (data.role !== 'STAFF' && !data.makeBookable) return;
      if (!data.email) return;
      const existingStaff = await this.prisma.staff.findFirst({
        where: { tenantId, OR: [{ email: data.email }, ...(userId ? [{ userId }] : [])] },
      });
      const staffName = data.name || data.email.split('@')[0];
      let staffRecord = existingStaff;
      if (!existingStaff) {
        const token = randomBytes(24).toString('hex');
        staffRecord = await this.prisma.staff.create({
          data: {
            tenantId,
            name: staffName,
            email: data.email,
            title: data.title || 'Staff Specialist',
            phone: data.phone,
            userId,
            status: 'ACTIVE',
            deskToken: token,
            locationId: data.allowedLocationIds?.[0] || undefined,
            ...(data.allowedServiceIds && data.allowedServiceIds.length > 0
              ? {
                  services: {
                    connect: data.allowedServiceIds.map((id) => ({ id })),
                  },
                }
              : {}),
          },
        });
      } else {
        staffRecord = await this.prisma.staff.update({
          where: { id: existingStaff.id },
          data: {
            userId: userId || existingStaff.userId,
            name: data.name || existingStaff.name,
            phone: data.phone || existingStaff.phone,
            title: data.title || existingStaff.title,
            locationId: data.allowedLocationIds?.[0] || existingStaff.locationId,
            ...(data.allowedServiceIds && data.allowedServiceIds.length > 0
              ? {
                  services: {
                    set: data.allowedServiceIds.map((id) => ({ id })),
                  },
                }
              : {}),
          },
        });
      }

      if (data.templateId && staffRecord) {
        const tenantWithLayout = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { staffViewLayout: true },
        });
        const currentSvl: any = tenantWithLayout?.staffViewLayout || {
          version: 2,
          templates: [],
          assignments: {},
        };
        const updatedAssignments = {
          ...(currentSvl.assignments || {}),
          [staffRecord.id]: data.templateId,
        };
        if (userId) updatedAssignments[userId] = data.templateId;
        await this.prisma.tenant.update({
          where: { id: tenantId },
          data: {
            staffViewLayout: {
              ...currentSvl,
              version: 2,
              assignments: updatedAssignments,
            },
          },
        });
      }
    };

    if (!existingUser) {
      const code = randomBytes(6).toString('hex').toUpperCase().substring(0, 8);
      const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      const existingInvite = await this.prisma.invitation.findFirst({
        where: { tenantId, email: data.email, used: false },
      });

      const invite = existingInvite
        ? await this.prisma.invitation.update({
            where: { id: existingInvite.id },
            data: {
              code,
              role: data.role as Role,
              expiresAt,
              used: false,
              usedCount: 0,
              allowedLocationIds: data.allowedLocationIds || [],
              allowedServiceIds: data.allowedServiceIds || [],
              allowedPages: data.allowedPages || [],
            },
          })
        : await this.prisma.invitation.create({
            data: {
              tenantId,
              code,
              email: data.email,
              role: data.role as Role,
              maxUses: 1,
              expiresAt,
              allowedLocationIds: data.allowedLocationIds || [],
              allowedServiceIds: data.allowedServiceIds || [],
              allowedPages: data.allowedPages || [],
            },
          });

      await handleMakeStaff();

      return {
        status: 'USER_NOT_FOUND_INVITED',
        inviteId: invite.id,
        inviteCode: invite.code,
        email: data.email,
        role: data.role,
        tenantName,
        inviteUrl: `${process.env.FRONTEND_URL || 'https://qmova.yqbuddy.com'}/register?inviteCode=${invite.code}`,
        message:
          'No Qmova account found for this email. An invitation join code has been generated.',
      };
    }

    if (existingUser.tenantId === tenantId) {
      throw new BadRequestException(
        'This user is already an active member of your team.',
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: existingUser.id },
      data: {
        tenantId,
        role: data.role as Role,
        allowedLocationIds: data.allowedLocationIds || [],
        allowedServiceIds: data.allowedServiceIds || [],
        allowedPages: data.allowedPages || [],
      },
      select: { id: true, email: true, role: true },
    });

    await this.prisma.invitation.updateMany({
      where: { tenantId, email: data.email, used: false },
      data: { used: true, usedAt: new Date() },
    });

    await handleMakeStaff(updatedUser.id);

    return {
      status: 'USER_ADDED',
      user: { ...updatedUser, status: 'ACTIVE', isInvite: false },
      message: 'Existing Qmova user added to your staff team.',
    };
  }

  async sendInviteEmail(
    tenantId: string,
    data: { email: string; code: string; role: string },
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });
    const tenantName = tenant?.name || 'Your Team';
    const inviteUrl = `${process.env.FRONTEND_URL || 'https://qmova.yqbuddy.com'}/register?inviteCode=${data.code}`;
    const res = await this.emailService.sendStaffInvitation(
      data.email,
      tenantName,
      data.role,
      inviteUrl,
      data.code,
    );
    if (!res.success) {
      throw new BadRequestException(
        res.error || 'Failed to dispatch Brevo invitation email.',
      );
    }
    return {
      success: true,
      message: 'Invitation email successfully sent via Brevo.',
    };
  }

  async resendInvite(tenantId: string, inviteId: string) {
    const invite = await this.prisma.invitation.findUnique({
      where: { id: inviteId },
      include: { tenant: { select: { name: true } } },
    });

    if (!invite) throw new NotFoundException('Invitation record not found.');
    if (invite.tenantId !== tenantId)
      throw new NotFoundException('Unauthorized invitation renewal.');

    const code = randomBytes(6).toString('hex').toUpperCase().substring(0, 8);
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const updated = await this.prisma.invitation.update({
      where: { id: inviteId },
      data: { code, expiresAt, used: false, usedCount: 0 },
    });

    return {
      status: 'USER_NOT_FOUND_INVITED',
      inviteId: updated.id,
      inviteCode: updated.code,
      email: updated.email || '',
      role: updated.role,
      tenantName: invite.tenant?.name || 'Your Team',
      inviteUrl: `${process.env.FRONTEND_URL || 'https://qmova.yqbuddy.com'}/register?inviteCode=${updated.code}`,
    };
  }

  async deleteUser(tenantId: string, id: string, currentUserId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, tenantId: true },
    });

    if (!targetUser) {
      const targetInvite = await this.prisma.invitation.findFirst({
        where: { id, tenantId },
      });
      if (targetInvite) {
        await this.prisma.invitation.delete({ where: { id: targetInvite.id } });
        return { success: true, message: 'Invitation removed.' };
      }

      const targetStaff = await this.prisma.staff.findFirst({
        where: { id, tenantId },
      });
      if (targetStaff) {
        await this.prisma.staff.delete({ where: { id: targetStaff.id } });
        const tenantLayout = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { staffViewLayout: true },
        });
        if (tenantLayout?.staffViewLayout) {
          const svl: any = tenantLayout.staffViewLayout;
          if (svl.assignments && svl.assignments[id]) {
            const nextAssignments = { ...svl.assignments };
            delete nextAssignments[id];
            await this.prisma.tenant.update({
              where: { id: tenantId },
              data: { staffViewLayout: { ...svl, assignments: nextAssignments } },
            });
          }
        }
        return { success: true, message: 'Staff member removed.' };
      }

      throw new NotFoundException('User, staff, or invitation not found.');
    }

    if (targetUser.tenantId !== tenantId) {
      throw new BadRequestException('User does not belong to this tenant.');
    }

    if (targetUser.id === currentUserId) {
      throw new BadRequestException(
        'You cannot remove yourself from the staff list.',
      );
    }

    if (targetUser.role === 'OWNER') {
      const adminCount = await this.prisma.user.count({
        where: { tenantId, role: 'OWNER' },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot remove the last admin. Transfer admin role to another user first.',
        );
      }
    }

    // Clean up linked staff profile in this tenant if any
    await this.prisma.staff.deleteMany({
      where: {
        tenantId,
        OR: [{ userId: id }],
      },
    });

    await this.prisma.user.delete({
      where: { id },
    });

    await this.redisService.client.set(
      `blocklist_user:${id}`,
      '1',
      'EX',
      7 * 24 * 60 * 60,
    );

    return { success: true };
  }

  async updatePermissions(
    tenantId: string,
    id: string,
    data: {
      role: Role;
      allowedLocationIds?: string[];
      allowedServiceIds?: string[];
      allowedPages?: string[];
      name?: string;
      phone?: string;
      description?: string;
    },
    currentUserId: string,
    currentUserEmail: string,
  ) {
    const newRole = data.role;
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, email: true, tenantId: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found.');
    }

    if (targetUser.tenantId !== tenantId) {
      throw new BadRequestException('User does not belong to this tenant.');
    }

    // Protect OWNER demotion
    if (targetUser.role === 'OWNER' && newRole !== 'OWNER') {
      const adminCount = await this.prisma.user.count({
        where: { tenantId, role: 'OWNER' },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot demote the last admin. Transfer admin role to another user first.',
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        role: newRole,
        allowedLocationIds: data.allowedLocationIds || [],
        allowedServiceIds: data.allowedServiceIds || [],
        allowedPages: data.allowedPages || [],
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        phone: true,
        description: true,
        allowedLocationIds: true,
        allowedPages: true,
        allowedServiceIds: true,
      },
    });

    // Sync Staff provider record if role is STAFF
    if (newRole === 'STAFF') {
      const existingStaff = await this.prisma.staff.findFirst({
        where: {
          tenantId,
          OR: [{ userId: id }, ...(targetUser.email ? [{ email: targetUser.email }] : [])],
        },
      });
      const staffName = updatedUser.name || targetUser.email.split('@')[0];
      if (existingStaff) {
        await this.prisma.staff.update({
          where: { id: existingStaff.id },
          data: {
            userId: id,
            name: staffName,
            status: 'ACTIVE',
            ...(updatedUser.phone ? { phone: updatedUser.phone } : {}),
            ...(updatedUser.allowedLocationIds?.length ? { locationId: updatedUser.allowedLocationIds[0] } : {}),
            ...(updatedUser.allowedServiceIds?.length
              ? {
                  services: {
                    set: updatedUser.allowedServiceIds.map((sId) => ({ id: sId })),
                  },
                }
              : {}),
          },
        });
      } else {
        const token = randomBytes(24).toString('hex');
        await this.prisma.staff.create({
          data: {
            tenantId,
            userId: id,
            name: staffName,
            email: targetUser.email,
            phone: updatedUser.phone,
            title: 'Staff Specialist',
            deskToken: token,
            status: 'ACTIVE',
            locationId: updatedUser.allowedLocationIds?.[0],
            ...(updatedUser.allowedServiceIds && updatedUser.allowedServiceIds.length > 0
              ? {
                  services: {
                    connect: updatedUser.allowedServiceIds.map((sId) => ({ id: sId })),
                  },
                }
              : {}),
          },
        });
      }
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });
    const tenantName = tenant?.name || 'Your Team';

    if (newRole === 'OWNER') {
      await this.emailService.sendAdminTransferEmail(
        currentUserEmail,
        updatedUser.email,
        tenantName,
      );
    } else {
      await this.emailService.sendRoleUpdatedEmail(
        updatedUser.email,
        tenantName,
        newRole,
      );
    }

    return { success: true, user: updatedUser };
  }

  async updateRole(
    tenantId: string,
    id: string,
    newRole: Role,
    currentUserId: string,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, email: true, tenantId: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found.');
    }

    if (targetUser.tenantId !== tenantId) {
      throw new BadRequestException('User does not belong to this tenant.');
    }

    // Protect OWNER demotion
    if (targetUser.role === 'OWNER' && newRole !== 'OWNER') {
      const ownerCount = await this.prisma.user.count({
        where: { tenantId, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot demote the last owner. Transfer ownership to another user first.',
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        phone: true,
        description: true,
        allowedLocationIds: true,
        allowedPages: true,
        allowedServiceIds: true,
      },
    });

    // Sync Staff provider record if role is STAFF
    if (newRole === 'STAFF') {
      const existingStaff = await this.prisma.staff.findFirst({
        where: {
          tenantId,
          OR: [{ userId: id }, ...(targetUser.email ? [{ email: targetUser.email }] : [])],
        },
      });
      const staffName = updatedUser.name || targetUser.email.split('@')[0];
      if (existingStaff) {
        await this.prisma.staff.update({
          where: { id: existingStaff.id },
          data: {
            userId: id,
            name: staffName,
            status: 'ACTIVE',
            ...(updatedUser.phone ? { phone: updatedUser.phone } : {}),
            ...(updatedUser.allowedLocationIds?.length ? { locationId: updatedUser.allowedLocationIds[0] } : {}),
            ...(updatedUser.allowedServiceIds?.length
              ? {
                  services: {
                    set: updatedUser.allowedServiceIds.map((sId) => ({ id: sId })),
                  },
                }
              : {}),
          },
        });
      } else {
        const token = randomBytes(24).toString('hex');
        await this.prisma.staff.create({
          data: {
            tenantId,
            userId: id,
            name: staffName,
            email: targetUser.email,
            phone: updatedUser.phone,
            title: 'Staff Specialist',
            deskToken: token,
            status: 'ACTIVE',
            locationId: updatedUser.allowedLocationIds?.[0],
            ...(updatedUser.allowedServiceIds && updatedUser.allowedServiceIds.length > 0
              ? {
                  services: {
                    connect: updatedUser.allowedServiceIds.map((sId) => ({ id: sId })),
                  },
                }
              : {}),
          },
        });
      }
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });
    const tenantName = tenant?.name || 'Your Team';

    await this.emailService.sendRoleUpdatedEmail(
      updatedUser.email,
      tenantName,
      newRole,
    );

    return { success: true, user: updatedUser };
  }

  async transferOwnership(
    tenantId: string,
    currentOwnerId: string,
    targetUserId: string,
  ) {
    // Ownership is tracked on Tenant.ownerId (Workspace model removed)
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, ownerId: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    // Fall back: if ownerId not set, resolve owner as first OWNER
    const resolvedOwnerId =
      tenant.ownerId ??
      (
        await this.prisma.user.findFirst({
          where: { tenantId, role: 'OWNER' },
          orderBy: { id: 'asc' },
          select: { id: true },
        })
      )?.id;

    if (resolvedOwnerId !== currentOwnerId) {
      throw new BadRequestException(
        'Only the current owner can transfer ownership.',
      );
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId, tenantId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found in this tenant.');
    }

    if (targetUser.id === currentOwnerId) {
      throw new BadRequestException('You are already the owner.');
    }

    // Transfer: update Tenant.ownerId and ensure target becomes OWNER
    const [updatedTenant, updatedUser] = await this.prisma.$transaction([
      this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { ownerId: targetUser.id },
      }),
      this.prisma.user.update({
        where: { id: targetUser.id },
        data: { role: 'OWNER' },
      }),
    ]);

    const currentOwnerUser = await this.prisma.user.findUnique({
      where: { id: currentOwnerId },
      select: { email: true },
    });

    await this.emailService.sendAdminTransferEmail(
      currentOwnerUser?.email ?? '',
      targetUser.email,
      tenant.name,
    );

    return { tenant: updatedTenant, newOwner: updatedUser };
  }

  async exportUserData(tenantId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, tenantId },
      include: {
        policyAcceptances: { include: { policy: true } },
        cookiePreferences: true,
        sessions: {
          select: {
            ipAddress: true,
            userAgent: true,
            lastActiveAt: true,
            deviceInfo: true,
          },
        },
      },
    });
    return user;
  }

  async deleteMe(tenantId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, tenantId },
    });

    if (!user) throw new NotFoundException('User not found');

    // Check if this user is the tenant owner
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { ownerId: true },
    });

    const isOwner = tenant?.ownerId === userId;

    if (isOwner) {
      // Delete entire tenant (cascades to all data)
      await this.prisma.tenant.delete({
        where: { id: tenantId },
      });
      return {
        success: true,
        message: 'Account and associated Tenant deleted completely.',
      };
    } else {
      await this.prisma.user.delete({
        where: { id: userId },
      });
      return { success: true, message: 'Account deleted.' };
    }
  }

  async updateMe(
    userId: string,
    data: {
      name?: string;
      phone?: string;
      description?: string;
      password?: string;
    },
  ) {
    const bcrypt = require('bcrypt');
    let hashedPassword;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(hashedPassword !== undefined && { password: hashedPassword }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        description: true,
      },
    });
  }
}
