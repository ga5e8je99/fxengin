import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCmsPageDto } from './dto/cms-page.dto';

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string) {
    const page = await this.prisma.cmsPage.findUnique({
      where: { slug },
    });
    if (!page) {
      throw new NotFoundException(`Page with slug ${slug} not found`);
    }

    return {
      success: true,
      page: {
        slug: page.slug,
        category: page.category,
        titleAr: page.titleAr,
        titleEn: page.titleEn,
        subtitleAr: page.subtitleAr,
        subtitleEn: page.subtitleEn,
        badgeAr: page.badgeAr,
        badgeEn: page.badgeEn,
        isPublished: page.isPublished,
        ...(typeof page.contentData === 'object' && page.contentData !== null ? page.contentData : {}),
      },
    };
  }

  async findAll(query?: { category?: string }) {
    const where: any = { isPublished: true };
    if (query?.category && query.category !== 'ALL') {
      where.category = query.category;
    }

    const pages = await this.prisma.cmsPage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return {
      success: true,
      total: pages.length,
      pages: pages.map((p) => ({
        slug: p.slug,
        category: p.category,
        titleAr: p.titleAr,
        titleEn: p.titleEn,
        subtitleAr: p.subtitleAr,
        subtitleEn: p.subtitleEn,
        badgeAr: p.badgeAr,
        badgeEn: p.badgeEn,
        isPublished: p.isPublished,
        ...(typeof p.contentData === 'object' && p.contentData !== null ? p.contentData : {}),
      })),
    };
  }

  async updatePage(slug: string, dto: UpdateCmsPageDto) {
    const { titleAr, titleEn, subtitleAr, subtitleEn, badgeAr, badgeEn, category, isPublished, contentData, ...rest } = dto as any;

    const mergedContent = {
      ...(typeof contentData === 'object' && contentData !== null ? contentData : {}),
      ...rest,
    };

    const updated = await this.prisma.cmsPage.upsert({
      where: { slug },
      create: {
        slug,
        titleAr: titleAr || slug,
        titleEn: titleEn || slug,
        subtitleAr,
        subtitleEn,
        badgeAr,
        badgeEn,
        category: category || 'company',
        isPublished: isPublished ?? true,
        contentData: mergedContent,
      },
      update: {
        ...(titleAr && { titleAr }),
        ...(titleEn !== undefined && { titleEn }),
        ...(subtitleAr !== undefined && { subtitleAr }),
        ...(subtitleEn !== undefined && { subtitleEn }),
        ...(badgeAr !== undefined && { badgeAr }),
        ...(badgeEn !== undefined && { badgeEn }),
        ...(category && { category }),
        ...(isPublished !== undefined && { isPublished }),
        contentData: mergedContent,
      },
    });

    return {
      success: true,
      message: 'تم تحديث الصفحة بنجاح',
      page: updated,
    };
  }
}
