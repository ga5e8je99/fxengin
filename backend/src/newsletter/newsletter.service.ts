import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscribeNewsletterDto } from './dto/newsletter.dto';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(dto: SubscribeNewsletterDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      if (!existing.isActive) {
        await this.prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
        return {
          success: true,
          message: 'تم إعادة تفعيل اشتراكك في النشرة البريدية بنجاح.',
        };
      }
      return {
        success: true,
        message: 'أنت مشترك بالفعل في النشرة البريدية لمنصة FXENGIN.',
      };
    }

    await this.prisma.newsletterSubscriber.create({
      data: {
        email: cleanEmail,
        isActive: true,
      },
    });

    return {
      success: true,
      message: 'تم اشتراكك في النشرة البريدية بنجاح! ستصلك أحدث التحليلات والفرص فور صدورها.',
    };
  }

  async findAll(query?: { search?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (query?.search) {
      where.email = { contains: query.search.trim().toLowerCase() };
    }

    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query?.limit) || 50));
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.newsletterSubscriber.count({ where }),
      this.prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { subscribedAt: 'desc' },
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

  async remove(id: string) {
    const item = await this.prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Subscriber ${id} not found`);
    await this.prisma.newsletterSubscriber.delete({ where: { id } });
    return { success: true, message: 'تم حذف المشترك بنجاح' };
  }
}
