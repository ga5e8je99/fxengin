import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { UpdateAdSenseConfigDto } from './dto/update-adsense-config.dto';
import { AdPlacement, Advertisement, GoogleAdSenseConfig } from '@prisma/client';

@Injectable()
export class AdsService implements OnModuleInit {
  private readonly logger = new Logger(AdsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Auto-seed default FXENGIN advertisements if database is clean
    const count = await this.prisma.advertisement.count();
    if (count === 0) {
      await this.seedDefaultAds();
    }
  }

  /**
   * 1. Get all advertisements for Admin Dashboard with optional filters
   */
  async getAllAds(placement?: AdPlacement, isActive?: boolean, search?: string) {
    const where: any = {};

    if (placement) {
      where.placement = placement;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { titleAr: { contains: q, mode: 'insensitive' } },
        { titleEn: { contains: q, mode: 'insensitive' } },
        { descAr: { contains: q, mode: 'insensitive' } },
        { badge: { contains: q, mode: 'insensitive' } },
        { tag: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.advertisement.findMany({
      where,
      orderBy: [{ placement: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * 2. Get active, scheduled advertisements for a given placement (for website public consumption)
   */
  async getActiveAdsByPlacement(placement?: string) {
    const now = new Date();
    const where: any = {
      isActive: true,
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    };

    if (placement && placement !== 'ALL') {
      if (placement === 'SIDEBAR') {
        where.placement = { in: [AdPlacement.SKYSCRAPER_RIGHT, AdPlacement.SKYSCRAPER_LEFT] };
      } else if (Object.values(AdPlacement).includes(placement as AdPlacement)) {
        where.placement = placement as AdPlacement;
      }
    }

    return this.prisma.advertisement.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * 3. Get single advertisement by ID
   */
  async getAdById(id: string) {
    const ad = await this.prisma.advertisement.findUnique({
      where: { id },
    });
    if (!ad) {
      throw new NotFoundException(`الإعلان برقم ${id} غير موجود`);
    }
    return ad;
  }

  /**
   * 4. Create new advertisement
   */
  async createAd(dto: CreateAdDto): Promise<Advertisement> {
    const ad = await this.prisma.advertisement.create({
      data: {
        titleAr: dto.titleAr.trim(),
        titleEn: dto.titleEn?.trim() || null,
        descAr: dto.descAr?.trim() || null,
        descEn: dto.descEn?.trim() || null,
        badge: dto.badge?.trim() || null,
        badgeColor: dto.badgeColor?.trim() || '#FB8704',
        tag: dto.tag?.trim() || null,
        imageUrl: dto.imageUrl?.trim() || null,
        targetUrl: dto.targetUrl.trim(),
        btnTextAr: dto.btnTextAr?.trim() || 'انضم الآن',
        btnTextEn: dto.btnTextEn?.trim() || 'Join Now',
        placement: dto.placement,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : 0,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });

    this.logger.log(`Created new advertisement: "${ad.titleAr}" [${ad.placement}]`);
    return ad;
  }

  /**
   * 5. Update advertisement
   */
  async updateAd(id: string, dto: UpdateAdDto): Promise<Advertisement> {
    await this.getAdById(id);

    const updateData: any = {};
    if (dto.titleAr !== undefined) updateData.titleAr = dto.titleAr.trim();
    if (dto.titleEn !== undefined) updateData.titleEn = dto.titleEn?.trim() || null;
    if (dto.descAr !== undefined) updateData.descAr = dto.descAr?.trim() || null;
    if (dto.descEn !== undefined) updateData.descEn = dto.descEn?.trim() || null;
    if (dto.badge !== undefined) updateData.badge = dto.badge?.trim() || null;
    if (dto.badgeColor !== undefined) updateData.badgeColor = dto.badgeColor?.trim() || '#FB8704';
    if (dto.tag !== undefined) updateData.tag = dto.tag?.trim() || null;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl?.trim() || null;
    if (dto.targetUrl !== undefined) updateData.targetUrl = dto.targetUrl.trim();
    if (dto.btnTextAr !== undefined) updateData.btnTextAr = dto.btnTextAr?.trim() || 'انضم الآن';
    if (dto.btnTextEn !== undefined) updateData.btnTextEn = dto.btnTextEn?.trim() || 'Join Now';
    if (dto.placement !== undefined) updateData.placement = dto.placement;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;

    return this.prisma.advertisement.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * 6. Toggle Active/Inactive Status
   */
  async toggleAdStatus(id: string): Promise<Advertisement> {
    const ad = await this.getAdById(id);
    const updated = await this.prisma.advertisement.update({
      where: { id },
      data: { isActive: !ad.isActive },
    });
    this.logger.log(`Toggled ad [${id}] status to ${updated.isActive}`);
    return updated;
  }

  /**
   * 7. Delete advertisement
   */
  async deleteAd(id: string): Promise<{ success: boolean; message: string }> {
    await this.getAdById(id);
    await this.prisma.advertisement.delete({
      where: { id },
    });
    this.logger.log(`Deleted advertisement [${id}]`);
    return { success: true, message: 'تم حذف الإعلان بنجاح' };
  }

  /**
   * 8. Record Ad Click (Analytics)
   */
  async recordClick(id: string): Promise<{ success: boolean; clicksCount: number }> {
    try {
      const updated = await this.prisma.advertisement.update({
        where: { id },
        data: { clicksCount: { increment: 1 } },
        select: { clicksCount: true },
      });
      return { success: true, clicksCount: updated.clicksCount };
    } catch {
      return { success: false, clicksCount: 0 };
    }
  }

  /**
   * 9. Record Ad Impression / View (Analytics)
   */
  async recordView(id: string): Promise<{ success: boolean; viewsCount: number }> {
    try {
      const updated = await this.prisma.advertisement.update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
        select: { viewsCount: true },
      });
      return { success: true, viewsCount: updated.viewsCount };
    } catch {
      return { success: false, viewsCount: 0 };
    }
  }

  /**
   * 10. Get overall Ads Performance Statistics for Dashboard
   */
  async getAdsStats() {
    const [totalAds, activeAds, aggregateStats, placementCounts] = await Promise.all([
      this.prisma.advertisement.count(),
      this.prisma.advertisement.count({ where: { isActive: true } }),
      this.prisma.advertisement.aggregate({
        _sum: {
          clicksCount: true,
          viewsCount: true,
        },
      }),
      this.prisma.advertisement.groupBy({
        by: ['placement'],
        _count: { id: true },
      }),
    ]);

    const totalClicks = aggregateStats._sum.clicksCount || 0;
    const totalViews = aggregateStats._sum.viewsCount || 0;
    const ctr = totalViews > 0 ? parseFloat(((totalClicks / totalViews) * 100).toFixed(2)) : 0;

    return {
      totalAds,
      activeAds,
      inactiveAds: totalAds - activeAds,
      totalClicks,
      totalViews,
      ctr,
      byPlacement: placementCounts.reduce((acc, curr) => {
        acc[curr.placement] = curr._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * 11. Seed Default Initial Ads (Matches current hardcoded items in AdBanner.js)
   */
  async seedDefaultAds(): Promise<{ count: number }> {
    const defaultAds: CreateAdDto[] = [
      // ── RIGHT SKYSCRAPER ──
      {
        placement: AdPlacement.SKYSCRAPER_RIGHT,
        badge: 'VIP SIGNALS',
        badgeColor: '#FB8704',
        titleAr: 'إشارات حية 24/5',
        titleEn: 'Live VIP Signals',
        descAr: 'توصيات يومية مدروسة للذهب والعملات',
        descEn: 'Daily setups for Gold & Forex',
        tag: '92% WIN RATE',
        btnTextAr: 'انضم الآن',
        btnTextEn: 'Join Now',
        targetUrl: '/register',
        sortOrder: 1,
        isActive: true,
      },
      {
        placement: AdPlacement.SKYSCRAPER_RIGHT,
        badge: 'PRO ACADEMY',
        badgeColor: '#0488F8',
        titleAr: 'باقة الاحتراف الشاملة',
        titleEn: 'Pro Academy Pass',
        descAr: '+120 دورة وشهادات معتمدة',
        descEn: '120+ Tracks & Certificates',
        tag: 'LIMITED PASS',
        btnTextAr: 'استكشف',
        btnTextEn: 'Explore',
        targetUrl: '/courses',
        sortOrder: 2,
        isActive: true,
      },
      {
        placement: AdPlacement.SKYSCRAPER_RIGHT,
        badge: 'ALGO TRADING',
        badgeColor: '#9333EA',
        titleAr: 'روبوتات الذكاء الاصطناعي',
        titleEn: 'AI Algo Trading Bot',
        descAr: 'تنفيذ صفقات آلي منضبط وسريع',
        descEn: 'Automated 24/5 execution',
        tag: 'AI POWERED',
        btnTextAr: 'جرب الآن',
        btnTextEn: 'Try AI',
        targetUrl: '/register',
        sortOrder: 3,
        isActive: true,
      },
      {
        placement: AdPlacement.SKYSCRAPER_RIGHT,
        badge: 'ZERO SPREAD',
        badgeColor: '#16C784',
        titleAr: 'سبريد 0.0 نقطة',
        titleEn: 'Zero Raw Spreads',
        descAr: 'تنفيذ فائق السرعة وحسابات إسلامية',
        descEn: 'Ultra-fast execution & Islamic',
        tag: '0.0 PIPS',
        btnTextAr: 'افتح حساب',
        btnTextEn: 'Open Account',
        targetUrl: '/open-account',
        sortOrder: 4,
        isActive: true,
      },

      // ── LEFT SKYSCRAPER ──
      {
        placement: AdPlacement.SKYSCRAPER_LEFT,
        badge: 'GOLD SCALPING',
        badgeColor: '#FB8704',
        titleAr: 'استراتيجيات الذهب',
        titleEn: 'Gold Master Scalp',
        descAr: 'قناص نقاط الذهب والنفط اللحظي',
        descEn: 'Intraday setups for XAU/USD',
        tag: 'HOT ASSET',
        btnTextAr: 'سجل مجاناً',
        btnTextEn: 'Join Free',
        targetUrl: '/register',
        sortOrder: 1,
        isActive: true,
      },
      {
        placement: AdPlacement.SKYSCRAPER_LEFT,
        badge: 'SMART MONEY',
        badgeColor: '#06B6D4',
        titleAr: 'منهجية SMC الاحترافية',
        titleEn: 'Smart Money SMC',
        descAr: 'تتبع صناع السوق ومناطق السيولة',
        descEn: 'Institutional Order Flow',
        tag: 'ELITE LEVEL',
        btnTextAr: 'اكتشف الدورة',
        btnTextEn: 'Learn SMC',
        targetUrl: '/courses',
        sortOrder: 2,
        isActive: true,
      },
      {
        placement: AdPlacement.SKYSCRAPER_LEFT,
        badge: 'LIVE STREAMS',
        badgeColor: '#EF4444',
        titleAr: 'جلسات تداول حية',
        titleEn: 'Daily Live Streams',
        descAr: 'تحليل مباشر قبل افتتاح نيويورك',
        descEn: 'New York Open live analysis',
        tag: '24/5 LIVE',
        btnTextAr: 'شاهد البث',
        btnTextEn: 'Watch Live',
        targetUrl: '/register',
        sortOrder: 3,
        isActive: true,
      },
      {
        placement: AdPlacement.SKYSCRAPER_LEFT,
        badge: 'PRO COMMUNITY',
        badgeColor: '#0488F8',
        titleAr: 'مجتمع النخبة المباشر',
        titleEn: 'Elite Pro Network',
        descAr: '+50,000 متداول يشاركون الفرص',
        descEn: '50,000+ Active Traders',
        tag: 'VIP ACCESS',
        btnTextAr: 'انضم للمجتمع',
        btnTextEn: 'Join Pro',
        targetUrl: '/register',
        sortOrder: 4,
        isActive: true,
      },

      // ── HORIZONTAL BANNER ──
      {
        placement: AdPlacement.HORIZONTAL_BANNER,
        badge: 'EXCLUSIVE PARTNER',
        badgeColor: '#FB8704',
        titleAr: 'تداول مع وسيط عالمي بفروق أسعار تبدأ من 0.0 نقطة',
        titleEn: 'Trade with Tier-1 Regulated Broker with 0.0 Pips Spreads',
        descAr: 'احصل على مكافأة إيداع حصرية 100% وحساب إسلامي بدون فوائد تبييت',
        descEn: 'Get 100% deposit bonus and swap-free Islamic trading account',
        tag: 'SPECIAL OFFER',
        btnTextAr: 'فتح حساب تداول حقيقي',
        btnTextEn: 'Open Live Account',
        targetUrl: '/brokers',
        sortOrder: 1,
        isActive: true,
      },

      // ── MOBILE TOP BAR ──
      {
        placement: AdPlacement.MOBILE_TOP_BAR,
        badge: 'VIP DEAL',
        badgeColor: '#0488F8',
        titleAr: 'باقة الـ VIP الاحترافية متاحة الآن بخصم محدود',
        titleEn: 'Pro VIP Pass is Now Live with Limited Discount',
        descAr: 'اشترك الآن واحصل على وصول فوري لكافة التحليلات والإشارات الحية',
        descEn: 'Join now for instant access to all live signals and setups',
        tag: 'LIMITED TIME',
        btnTextAr: 'اشترك الآن',
        btnTextEn: 'Join Now',
        targetUrl: '/subscriptions',
        sortOrder: 1,
        isActive: true,
      },
    ];

    let createdCount = 0;
    for (const ad of defaultAds) {
      await this.prisma.advertisement.create({
        data: {
          titleAr: ad.titleAr,
          titleEn: ad.titleEn,
          descAr: ad.descAr,
          descEn: ad.descEn,
          badge: ad.badge,
          badgeColor: ad.badgeColor,
          tag: ad.tag,
          imageUrl: ad.imageUrl || null,
          targetUrl: ad.targetUrl,
          btnTextAr: ad.btnTextAr,
          btnTextEn: ad.btnTextEn,
          placement: ad.placement,
          isActive: ad.isActive,
          sortOrder: ad.sortOrder,
        },
      });
      createdCount++;
    }

    this.logger.log(`Seeded ${createdCount} default FXENGIN advertisements successfully.`);
    return { count: createdCount };
  }

  /**
   * 12. Get or initialize Google AdSense Configuration
   */
  async getAdSenseConfig(): Promise<GoogleAdSenseConfig> {
    let config = await this.prisma.googleAdSenseConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      config = await this.prisma.googleAdSenseConfig.create({
        data: {
          id: 'default',
          isEnabled: false,
          publisherId: '',
          autoAds: true,
          testMode: false,
        },
      });
    }

    return config;
  }

  /**
   * 13. Update Google AdSense Configuration
   */
  async updateAdSenseConfig(dto: UpdateAdSenseConfigDto): Promise<GoogleAdSenseConfig> {
    let publisherId = dto.publisherId !== undefined ? dto.publisherId.trim() : undefined;

    // Normalize Publisher ID (if user provided digits only or pub-XXXX, ensure ca-pub- prefix for script client)
    if (publisherId) {
      if (publisherId.startsWith('pub-')) {
        publisherId = `ca-${publisherId}`;
      } else if (!publisherId.startsWith('ca-pub-') && /^\d+$/.test(publisherId)) {
        publisherId = `ca-pub-${publisherId}`;
      }
    }

    const updated = await this.prisma.googleAdSenseConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        isEnabled: dto.isEnabled ?? false,
        publisherId: publisherId ?? '',
        autoAds: dto.autoAds ?? true,
        slotHorizontal: dto.slotHorizontal?.trim() || null,
        slotRightBar: dto.slotRightBar?.trim() || null,
        slotLeftBar: dto.slotLeftBar?.trim() || null,
        slotMobileBar: dto.slotMobileBar?.trim() || null,
        adsTxtCustom: dto.adsTxtCustom?.trim() || null,
        testMode: dto.testMode ?? false,
      },
      update: {
        ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
        ...(publisherId !== undefined && { publisherId }),
        ...(dto.autoAds !== undefined && { autoAds: dto.autoAds }),
        ...(dto.slotHorizontal !== undefined && { slotHorizontal: dto.slotHorizontal?.trim() || null }),
        ...(dto.slotRightBar !== undefined && { slotRightBar: dto.slotRightBar?.trim() || null }),
        ...(dto.slotLeftBar !== undefined && { slotLeftBar: dto.slotLeftBar?.trim() || null }),
        ...(dto.slotMobileBar !== undefined && { slotMobileBar: dto.slotMobileBar?.trim() || null }),
        ...(dto.adsTxtCustom !== undefined && { adsTxtCustom: dto.adsTxtCustom?.trim() || null }),
        ...(dto.testMode !== undefined && { testMode: dto.testMode }),
      },
    });

    this.logger.log(`Google AdSense configuration updated. Active: ${updated.isEnabled}, Publisher: ${updated.publisherId}`);
    return updated;
  }

  /**
   * 14. Generate ads.txt content according to Google AdSense standards
   */
  async getAdsTxtContent(): Promise<string> {
    const config = await this.getAdSenseConfig();

    // Extract raw publisher id for ads.txt: format must be "pub-XXXXXXXXXXXXXXXX"
    let pubIdForAdsTxt = '';
    if (config.publisherId) {
      pubIdForAdsTxt = config.publisherId.replace(/^ca-/, '');
      if (!pubIdForAdsTxt.startsWith('pub-')) {
        pubIdForAdsTxt = `pub-${pubIdForAdsTxt}`;
      }
    }

    const lines: string[] = [
      '# ==========================================================',
      '# FXENGIN Official Ads.txt Configuration',
      '# https://fxengin.com',
      '# ==========================================================',
    ];

    if (pubIdForAdsTxt) {
      lines.push(`google.com, ${pubIdForAdsTxt}, DIRECT, f08c47fec0942fa0`);
    } else {
      lines.push('# Google AdSense: Pending Publisher ID Configuration');
      lines.push('# google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0');
    }

    if (config.adsTxtCustom) {
      lines.push('');
      lines.push('# Custom Network Records');
      lines.push(config.adsTxtCustom);
    }

    return lines.join('\n');
  }
}
