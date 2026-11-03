import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';

@Injectable()
export class ServiceCatalogService {
  private readonly logger = new Logger(ServiceCatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createCatalog(tenantId: string, dto: CreateCatalogDto) {
    if (dto.serviceId) {
      const service = await this.prisma.service.findFirst({
        where: { id: dto.serviceId, tenantId },
      });
      if (!service) throw new NotFoundException('Service not found');
    }

    return this.prisma.serviceCatalog.create({
      data: {
        tenantId,
        name: dto.name,
        serviceId: dto.serviceId || null,
        currency: dto.currency || 'ZAR',
        isActive: dto.isActive ?? true,
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async findCatalogs(tenantId: string) {
    return this.prisma.serviceCatalog.findMany({
      where: { tenantId },
      include: {
        service: { select: { id: true, name: true, enableCatalog: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCatalogById(tenantId: string, id: string) {
    const catalog = await this.prisma.serviceCatalog.findFirst({
      where: { id, tenantId },
      include: {
        service: { select: { id: true, name: true, enableCatalog: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!catalog) throw new NotFoundException('Catalog not found');
    return catalog;
  }

  async findCatalogByServiceId(tenantId: string, serviceId: string) {
    let catalog = await this.prisma.serviceCatalog.findFirst({
      where: { serviceId, tenantId },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!catalog) {
      // Find service to get its name
      const service = await this.prisma.service.findFirst({
        where: { id: serviceId, tenantId },
      });
      if (!service) throw new NotFoundException('Service not found');

      // Auto-create initial catalog for service if not yet created
      catalog = await this.prisma.serviceCatalog.create({
        data: {
          tenantId,
          serviceId,
          name: `${service.name} Catalog`,
          currency: service.priceCurrency || 'ZAR',
          isActive: true,
        },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      });
    }

    return catalog;
  }

  async updateCatalog(tenantId: string, id: string, dto: UpdateCatalogDto) {
    await this.findCatalogById(tenantId, id);
    return this.prisma.serviceCatalog.update({
      where: { id },
      data: {
        name: dto.name,
        currency: dto.currency,
        isActive: dto.isActive,
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async deleteCatalog(tenantId: string, id: string) {
    await this.findCatalogById(tenantId, id);
    return this.prisma.serviceCatalog.delete({
      where: { id },
    });
  }

  async createCatalogItem(
    tenantId: string,
    catalogId: string,
    dto: CreateCatalogItemDto,
  ) {
    await this.findCatalogById(tenantId, catalogId);

    const highestSort = await this.prisma.serviceCatalogItem.findFirst({
      where: { catalogId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const nextSort = dto.sortOrder ?? (highestSort ? highestSort.sortOrder + 1 : 0);

    return this.prisma.serviceCatalogItem.create({
      data: {
        catalogId,
        name: dto.name,
        description: dto.description || null,
        category: dto.category || null,
        unitPrice: dto.unitPrice,
        currency: dto.currency || 'ZAR',
        imageUrl: dto.imageUrl || null,
        maxQty: dto.maxQty ?? 1,
        isAvailable: dto.isAvailable ?? true,
        sortOrder: nextSort,
        taxRate: dto.taxRate ?? null,
      },
    });
  }

  async updateCatalogItem(
    tenantId: string,
    catalogId: string,
    itemId: string,
    dto: UpdateCatalogItemDto,
  ) {
    await this.findCatalogById(tenantId, catalogId);
    const item = await this.prisma.serviceCatalogItem.findFirst({
      where: { id: itemId, catalogId },
    });
    if (!item) throw new NotFoundException('Catalog item not found');

    return this.prisma.serviceCatalogItem.update({
      where: { id: itemId },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        unitPrice: dto.unitPrice,
        currency: dto.currency,
        imageUrl: dto.imageUrl,
        maxQty: dto.maxQty,
        isAvailable: dto.isAvailable,
        sortOrder: dto.sortOrder,
        taxRate: dto.taxRate,
      },
    });
  }

  async deleteCatalogItem(tenantId: string, catalogId: string, itemId: string) {
    await this.findCatalogById(tenantId, catalogId);
    const item = await this.prisma.serviceCatalogItem.findFirst({
      where: { id: itemId, catalogId },
    });
    if (!item) throw new NotFoundException('Catalog item not found');

    return this.prisma.serviceCatalogItem.delete({
      where: { id: itemId },
    });
  }

  async reorderCatalogItems(
    tenantId: string,
    catalogId: string,
    orderedItemIds: string[],
  ) {
    await this.findCatalogById(tenantId, catalogId);

    return this.prisma.$transaction(
      orderedItemIds.map((id, index) =>
        this.prisma.serviceCatalogItem.updateMany({
          where: { id, catalogId },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  async importItems(tenantId: string, catalogId: string, items: any[]) {
    await this.findCatalogById(tenantId, catalogId);

    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Items array cannot be empty');
    }

    const createdItems = await this.prisma.$transaction(
      items.map((item, idx) =>
        this.prisma.serviceCatalogItem.create({
          data: {
            catalogId,
            name: item.name || 'Unnamed Item',
            description: item.description || null,
            category: item.category || 'General',
            unitPrice: Math.max(0, parseInt(item.unitPrice || item.price, 10) || 0),
            currency: item.currency || 'ZAR',
            imageUrl: item.imageUrl || null,
            maxQty: Math.max(1, parseInt(item.maxQty, 10) || 1),
            isAvailable: item.isAvailable !== false,
            sortOrder: idx,
            taxRate: item.taxRate ? parseFloat(item.taxRate) : null,
          },
        }),
      ),
    );

    return { importedCount: createdItems.length, items: createdItems };
  }
}

