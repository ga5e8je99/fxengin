import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || `article-${Date.now()}`;
  }

  async create(dto: CreateArticleDto) {
    let slug = dto.slug || this.generateSlug(dto.titleEn || dto.titleAr);
    const existing = await this.prisma.article.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    if (dto.isFeatured) {
      await this.prisma.article.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      });
    }

    return this.prisma.article.create({
      data: {
        slug,
        titleAr: dto.titleAr.trim(),
        titleEn: dto.titleEn?.trim() || null,
        excerptAr: dto.excerptAr?.trim() || null,
        excerptEn: dto.excerptEn?.trim() || null,
        contentAr: dto.contentAr || null,
        contentEn: dto.contentEn || null,
        coverImage: dto.coverImage || null,
        authorName: dto.authorName?.trim() || 'م. سليمان داود',
        categoryKey: dto.categoryKey?.trim() || 'strategies',
        categoryAr: dto.categoryAr?.trim() || 'استراتيجيات التداول',
        categoryEn: dto.categoryEn?.trim() || 'Trading Strategies',
        tags: Array.isArray(dto.tags) ? dto.tags : ['Forex', 'Trading'],
        readTimeMinutes: dto.readTimeMinutes ?? 5,
        isFeatured: Boolean(dto.isFeatured),
        status: dto.status || 'PUBLISHED',
        tradingViewUrl: dto.tradingViewUrl || null,
        symbol: dto.symbol || null,
        sectionsData: dto.sectionsData || null,
        faqsData: dto.faqsData || null,
      },
    });
  }

  async findAll(query?: { category?: string; status?: string; search?: string; limit?: number; page?: number }) {
    const where: any = {};

    if (query?.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query?.category && query.category !== 'ALL' && query.category !== 'all') {
      where.categoryKey = query.category;
    }
    if (query?.search) {
      const q = query.search.trim();
      where.OR = [
        { titleAr: { contains: q, mode: 'insensitive' } },
        { titleEn: { contains: q, mode: 'insensitive' } },
        { excerptAr: { contains: q, mode: 'insensitive' } },
        { excerptEn: { contains: q, mode: 'insensitive' } },
      ];
    }

    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const page = Math.max(1, Number(query?.page) || 1);
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  async findBySlug(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
    });
    if (!article) {
      throw new NotFoundException(`Article ${slug} not found`);
    }

    // Increment views asynchronously
    this.prisma.article.update({
      where: { id: article.id },
      data: { viewsCount: { increment: 1 } },
    }).catch(() => {});

    return {
      success: true,
      data: article,
    };
  }

  async update(idOrSlug: string, dto: UpdateArticleDto) {
    const existing = await this.prisma.article.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    if (!existing) {
      throw new NotFoundException(`Article ${idOrSlug} not found`);
    }
    const id = existing.id;

    if (dto.isFeatured) {
      await this.prisma.article.updateMany({
        where: { isFeatured: true, id: { not: id } },
        data: { isFeatured: false },
      });
    }

    return this.prisma.article.update({
      where: { id },
      data: {
        ...(dto.titleAr && { titleAr: dto.titleAr.trim() }),
        ...(dto.titleEn !== undefined && { titleEn: dto.titleEn?.trim() || null }),
        ...(dto.excerptAr !== undefined && { excerptAr: dto.excerptAr?.trim() || null }),
        ...(dto.excerptEn !== undefined && { excerptEn: dto.excerptEn?.trim() || null }),
        ...(dto.contentAr !== undefined && { contentAr: dto.contentAr }),
        ...(dto.contentEn !== undefined && { contentEn: dto.contentEn }),
        ...(dto.coverImage !== undefined && { coverImage: dto.coverImage }),
        ...(dto.authorName && { authorName: dto.authorName.trim() }),
        ...(dto.categoryKey && { categoryKey: dto.categoryKey.trim() }),
        ...(dto.categoryAr !== undefined && { categoryAr: dto.categoryAr }),
        ...(dto.categoryEn !== undefined && { categoryEn: dto.categoryEn }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.readTimeMinutes !== undefined && { readTimeMinutes: dto.readTimeMinutes }),
        ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
        ...(dto.status && { status: dto.status }),
        ...(dto.tradingViewUrl !== undefined && { tradingViewUrl: dto.tradingViewUrl }),
        ...(dto.symbol !== undefined && { symbol: dto.symbol }),
        ...(dto.sectionsData !== undefined && { sectionsData: dto.sectionsData }),
        ...(dto.faqsData !== undefined && { faqsData: dto.faqsData }),
      },
    });
  }

  async remove(idOrSlug: string) {
    const existing = await this.prisma.article.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    if (!existing) {
      throw new NotFoundException(`Article ${idOrSlug} not found`);
    }
    await this.prisma.article.delete({ where: { id: existing.id } });
    return { success: true, message: 'تم حذف المقال بنجاح' };
  }
}
