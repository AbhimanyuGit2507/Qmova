import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ServiceCatalogService } from './service-catalog.service';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePagePermission } from '../auth/permissions.decorator';
import { Role } from '@prisma/client';

@Controller('service-catalog')
export class ServiceCatalogController {
  constructor(private readonly catalogService: ServiceCatalogService) {}

  @Get('public/by-service/:serviceId')
  getPublicCatalogByService(
    @Param('serviceId') serviceId: string,
    @Req() req: any,
  ) {
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    return this.catalogService.findCatalogByServiceId(tenantId, serviceId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF)
  @Get('by-service/:serviceId')
  getCatalogByService(
    @Req() req: any,
    @Param('serviceId') serviceId: string,
  ) {
    return this.catalogService.findCatalogByServiceId(
      req.user.tenantId,
      serviceId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF)
  @Get()
  getAllCatalogs(@Req() req: any) {
    return this.catalogService.findCatalogs(req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF)
  @Get(':id')
  getCatalogById(@Req() req: any, @Param('id') id: string) {
    return this.catalogService.findCatalogById(req.user.tenantId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF)
  @RequirePagePermission('settings-operations')
  @Post()
  createCatalog(@Req() req: any, @Body() dto: CreateCatalogDto) {
    return this.catalogService.createCatalog(req.user.tenantId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF)
  @RequirePagePermission('settings-operations')
  @Patch(':id')
  updateCatalog(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCatalogDto,
  ) {
    return this.catalogService.updateCatalog(req.user.tenantId, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF)
  @RequirePagePermission('settings-operations')
  @Delete(':id')
  deleteCatalog(@Req() req: any, @Param('id') id: string) {
    return this.catalogService.deleteCatalog(req.user.tenantId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF)
  @RequirePagePermission('settings-operations')
  @Post(':id/items')
  createItem(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateCatalogItemDto,
  ) {
    return this.catalogService.createCatalogItem(req.user.tenantId, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF)
  @RequirePagePermission('settings-operations')
  @Patch(':id/items/:itemId')
  updateItem(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCatalogItemDto,
  ) {
    return this.catalogService.updateCatalogItem(
      req.user.tenantId,
      id,
      itemId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF)
  @RequirePagePermission('settings-operations')
  @Delete(':id/items/:itemId')
  deleteItem(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.catalogService.deleteCatalogItem(
      req.user.tenantId,
      id,
      itemId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF)
  @RequirePagePermission('settings-operations')
  @Post(':id/items/reorder')
  reorderItems(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { itemIds: string[] },
  ) {
    return this.catalogService.reorderCatalogItems(
      req.user.tenantId,
      id,
      body.itemIds,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF)
  @RequirePagePermission('settings-operations')
  @Post(':id/import')
  importItems(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { items: any[] },
  ) {
    return this.catalogService.importItems(req.user.tenantId, id, body.items);
  }
}

