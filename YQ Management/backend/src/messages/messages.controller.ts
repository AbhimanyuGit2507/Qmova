import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import type { AuthenticatedRequest } from '../auth/types/auth.types';
import { SendMessageDto } from './dto/message.dto';

@Controller('messages')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('token/:tokenId')
  async getMessages(
    @Req() req: AuthenticatedRequest,
    @Param('tokenId') tokenId: string,
  ) {
    return this.messagesService.getMessages(tokenId, req.user.tenantId);
  }

  @Post('token/:tokenId')
  async sendMessage(
    @Req() req: AuthenticatedRequest,
    @Param('tokenId') tokenId: string,
    @Body() body: SendMessageDto,
  ) {
    return this.messagesService.sendMessageFromOperator(
      tokenId,
      body.text || '',
      req.user.tenantId,
    );
  }

  @Get('inbox')
  async getInbox(
    @Req() req: AuthenticatedRequest,
    @Query('locationId') locationId?: string,
  ) {
    return this.messagesService.getInbox(req.user.tenantId, locationId);
  }

  @Get('inbox/:phone/dossier')
  async getInboxDossier(
    @Req() req: AuthenticatedRequest,
    @Param('phone') phone: string,
  ) {
    return this.messagesService.getInboxDossier(req.user.tenantId, phone);
  }

  @Patch('inbox/:phone/customer')
  async updateInboxCustomer(
    @Req() req: AuthenticatedRequest,
    @Param('phone') phone: string,
    @Body()
    body: {
      name?: string;
      email?: string;
      notes?: string;
      isVip?: boolean;
      isBlocked?: boolean;
    },
  ) {
    return this.messagesService.updateInboxCustomer(
      req.user.tenantId,
      phone,
      body,
    );
  }

  @Get('inbox/:phone')
  async getInboxMessages(
    @Req() req: AuthenticatedRequest,
    @Param('phone') phone: string,
  ) {
    return this.messagesService.getInboxMessages(req.user.tenantId, phone);
  }

  @Post('inbox/:phone/sync')
  async syncInboxChat(
    @Req() req: AuthenticatedRequest,
    @Param('phone') phone: string,
  ) {
    const count = await this.messagesService.syncEvolutionChatHistory(
      req.user.tenantId,
      phone,
      true, // forceSync
    );
    return { success: true, count };
  }

  @Post('inbox/:phone')
  async sendInboxMessage(
    @Req() req: AuthenticatedRequest,
    @Param('phone') phone: string,
    @Body() body: SendMessageDto,
  ) {
    return this.messagesService.sendInboxMessage(
      req.user.tenantId,
      phone,
      body.text,
      body.media,
      body.mediaType,
      body.fileName,
    );
  }

  @Delete('inbox/:id')
  async deleteMessage(
    @Req() req: AuthenticatedRequest,
    @Param('id') messageId: string,
  ) {
    return this.messagesService.deleteMessage(req.user.tenantId, messageId);
  }

  @Post('inbox/:phone/read')
  async markAsRead(
    @Req() req: AuthenticatedRequest,
    @Param('phone') phone: string,
  ) {
    return this.messagesService.markAsRead(req.user.tenantId, phone);
  }

  @Post('inbox/:phone/mark-read')
  async markAsReadAlias(
    @Req() req: AuthenticatedRequest,
    @Param('phone') phone: string,
  ) {
    return this.messagesService.markAsRead(req.user.tenantId, phone);
  }

  @Post('inbox/:phone/bot-toggle')
  async toggleBot(
    @Req() req: AuthenticatedRequest,
    @Param('phone') phone: string,
    @Body()
    body: {
      paused?: boolean;
      agentInfo?: {
        agentName?: string;
        agentId?: string;
        agentRole?: string;
        agentType?: string;
      };
    },
  ) {
    return this.messagesService.toggleBot(
      req.user.tenantId,
      phone,
      body?.paused,
      body?.agentInfo,
    );
  }

  @Post('inbox/:phone/toggle-bot')
  async toggleBotAlias(
    @Req() req: AuthenticatedRequest,
    @Param('phone') phone: string,
    @Body()
    body: {
      paused?: boolean;
      agentInfo?: {
        agentName?: string;
        agentId?: string;
        agentRole?: string;
        agentType?: string;
      };
    },
  ) {
    return this.messagesService.toggleBot(
      req.user.tenantId,
      phone,
      body?.paused,
      body?.agentInfo,
    );
  }

  @Post('inbox/:phone/payment-link')
  async sendPaymentLink(
    @Req() req: AuthenticatedRequest,
    @Param('phone') phone: string,
    @Body() body: { visitId: string; visitStepId?: string },
  ) {
    return this.messagesService.sendPaymentLink(
      req.user.tenantId,
      phone,
      body.visitId,
      body.visitStepId,
    );
  }

  @Post('inbox/:phone/send-payment-link')
  async sendPaymentLinkAlias(
    @Req() req: AuthenticatedRequest,
    @Param('phone') phone: string,
    @Body() body: { visitId: string; visitStepId?: string },
  ) {
    return this.messagesService.sendPaymentLink(
      req.user.tenantId,
      phone,
      body.visitId,
      body.visitStepId,
    );
  }
}
