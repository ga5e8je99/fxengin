import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrokerDto, UpdateBrokerDto } from './dto/broker.dto';

@Injectable()
export class BrokersService {
  constructor(private readonly prisma: PrismaService) {}

  private formatBroker(b: any) {
    if (!b) return null;
    const specs = Array.isArray(b.specsData)
      ? b.specsData
      : (Array.isArray(b.specs) ? b.specs : []);

    return {
      ...b,
      id: b.brokerSlug || b.id,
      _id: b.id,
      slug: b.brokerSlug,
      logo: b.logoUrl || b.logo || '/assets/Images/brokers/xm.png',
      logoUrl: b.logoUrl || b.logo || '/assets/Images/brokers/xm.png',
      specs,
      specsData: specs,
      fxenginPerksAr: b.perksAr || b.fxenginPerksAr || '',
      fxenginPerksEn: b.perksEn || b.fxenginPerksEn || '',
      perksAr: b.perksAr || b.fxenginPerksAr || '',
      perksEn: b.perksEn || b.fxenginPerksEn || '',
      categoryBadgeAr: b.categoryLabelAr || b.badgeAr || '',
      categoryBadgeEn: b.categoryLabelEn || b.badgeEn || '',
      tradersCount: b.clientsCount || '',
      tradersCountEn: b.clientsCountEn || '',
      descAr: b.descriptionAr || '',
      descEn: b.descriptionEn || '',
      featuresAr: Array.isArray(b.featuresAr) ? b.featuresAr : [],
      featuresEn: Array.isArray(b.featuresEn) ? b.featuresEn : [],
      accentColor: b.accentColor || '#0488F8',
      glowBorder: b.glowBorder || 'rgba(4, 136, 248, 0.25)',
      liveUrl: b.liveUrl || '#',
      demoUrl: b.demoUrl || '#',
    };
  }

  async create(dto: CreateBrokerDto) {
    let brokerSlug = dto.brokerSlug || dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existing = await this.prisma.broker.findUnique({ where: { brokerSlug } });
    if (existing) {
      brokerSlug = `${brokerSlug}-${Date.now().toString().slice(-4)}`;
    }

    const created = await this.prisma.broker.create({
      data: {
        brokerSlug,
        name: dto.name.trim(),
        category: dto.category || 'forex',
        categoryLabelAr: dto.categoryLabelAr,
        categoryLabelEn: dto.categoryLabelEn,
        badgeAr: dto.badgeAr,
        badgeEn: dto.badgeEn,
        badgeColor: dto.badgeColor || '#0488F8',
        logoUrl: dto.logoUrl || dto.logo || '/assets/Images/brokers/xm.png',
        logoBg: dto.logoBg || '#000000',
        rating: dto.rating ?? 4.9,
        clientsCount: dto.clientsCount,
        clientsCountEn: dto.clientsCountEn,
        accentColor: dto.accentColor || '#0488F8',
        glowBorder: dto.glowBorder,
        descriptionAr: dto.descriptionAr,
        descriptionEn: dto.descriptionEn,
        specsData: dto.specsData || dto.specs || null,
        featuresAr: Array.isArray(dto.featuresAr) ? dto.featuresAr : [],
        featuresEn: Array.isArray(dto.featuresEn) ? dto.featuresEn : [],
        couponCode: dto.couponCode,
        perksAr: dto.perksAr || dto.fxenginPerksAr || null,
        perksEn: dto.perksEn || dto.fxenginPerksEn || null,
        liveUrl: dto.liveUrl || '#',
        demoUrl: dto.demoUrl || '#',
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    return this.formatBroker(created);
  }

  async findAll(query?: { category?: string; activeOnly?: boolean }) {
    const where: any = {};
    if (query?.category && query.category !== 'ALL' && query.category !== 'all') {
      where.category = query.category;
    }
    if (query?.activeOnly) {
      where.isActive = true;
    }

    const data = await this.prisma.broker.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return {
      success: true,
      count: data.length,
      data: data.map((b) => this.formatBroker(b)),
    };
  }

  async findBySlug(slug: string) {
    const broker = await this.prisma.broker.findFirst({
      where: { OR: [{ brokerSlug: slug }, { id: slug }] },
    });
    if (!broker) throw new NotFoundException(`Broker ${slug} not found`);
    return this.formatBroker(broker);
  }

  async update(idOrSlug: string, dto: UpdateBrokerDto) {
    const existing = await this.prisma.broker.findFirst({
      where: { OR: [{ id: idOrSlug }, { brokerSlug: idOrSlug }] },
    });
    if (!existing) throw new NotFoundException(`Broker ${idOrSlug} not found`);

    const updated = await this.prisma.broker.update({
      where: { id: existing.id },
      data: {
        ...(dto.brokerSlug && { brokerSlug: dto.brokerSlug }),
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.category && { category: dto.category }),
        ...(dto.categoryLabelAr !== undefined && { categoryLabelAr: dto.categoryLabelAr }),
        ...(dto.categoryLabelEn !== undefined && { categoryLabelEn: dto.categoryLabelEn }),
        ...(dto.badgeAr !== undefined && { badgeAr: dto.badgeAr }),
        ...(dto.badgeEn !== undefined && { badgeEn: dto.badgeEn }),
        ...(dto.badgeColor !== undefined && { badgeColor: dto.badgeColor }),
        ...((dto.logoUrl !== undefined || dto.logo !== undefined) && { logoUrl: dto.logoUrl || dto.logo }),
        ...(dto.logoBg !== undefined && { logoBg: dto.logoBg }),
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.clientsCount !== undefined && { clientsCount: dto.clientsCount }),
        ...(dto.clientsCountEn !== undefined && { clientsCountEn: dto.clientsCountEn }),
        ...(dto.accentColor !== undefined && { accentColor: dto.accentColor }),
        ...(dto.glowBorder !== undefined && { glowBorder: dto.glowBorder }),
        ...(dto.descriptionAr !== undefined && { descriptionAr: dto.descriptionAr }),
        ...(dto.descriptionEn !== undefined && { descriptionEn: dto.descriptionEn }),
        ...((dto.specsData !== undefined || dto.specs !== undefined) && { specsData: dto.specsData || dto.specs }),
        ...(dto.featuresAr && { featuresAr: dto.featuresAr }),
        ...(dto.featuresEn && { featuresEn: dto.featuresEn }),
        ...(dto.couponCode !== undefined && { couponCode: dto.couponCode }),
        ...((dto.perksAr !== undefined || dto.fxenginPerksAr !== undefined) && { perksAr: dto.perksAr ?? dto.fxenginPerksAr }),
        ...((dto.perksEn !== undefined || dto.fxenginPerksEn !== undefined) && { perksEn: dto.perksEn ?? dto.fxenginPerksEn }),
        ...(dto.liveUrl !== undefined && { liveUrl: dto.liveUrl }),
        ...(dto.demoUrl !== undefined && { demoUrl: dto.demoUrl }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.formatBroker(updated);
  }

  async remove(idOrSlug: string) {
    const existing = await this.prisma.broker.findFirst({
      where: { OR: [{ id: idOrSlug }, { brokerSlug: idOrSlug }] },
    });
    if (!existing) throw new NotFoundException(`Broker ${idOrSlug} not found`);
    await this.prisma.broker.delete({ where: { id: existing.id } });
    return { success: true, message: 'تم حذف الوسيط بنجاح' };
  }
}
