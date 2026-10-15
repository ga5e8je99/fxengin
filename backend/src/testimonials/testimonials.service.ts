import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestimonialDto, UpdateTestimonialDto } from './dto/testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTestimonialDto) {
    return this.prisma.testimonial.create({
      data: {
        clientName: dto.clientName.trim(),
        location: dto.location?.trim(),
        roleTitle: dto.roleTitle?.trim() || 'متداول معتمد',
        avatarText: dto.avatarText?.trim() || 'FX',
        category: dto.category?.trim() || 'courses',
        rating: dto.rating ?? 5,
        metricText: dto.metricText?.trim(),
        reviewAr: dto.reviewAr.trim(),
        reviewEn: dto.reviewEn?.trim(),
        courseName: dto.courseName?.trim(),
        isApproved: dto.isApproved ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async findPublic(category?: string) {
    const where: any = { isApproved: true };
    if (category && category !== 'ALL') {
      where.category = category;
    }

    const data = await this.prisma.testimonial.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    const formatted = data.map((item) => ({
      ...item,
      nameAr: item.clientName,
      nameEn: item.clientName,
      textAr: item.reviewAr,
      textEn: item.reviewEn || item.reviewAr,
      roleAr: item.roleTitle,
      roleEn: item.roleTitle,
      avatar: item.avatarText,
      metricAr: item.metricText,
      metricEn: item.metricText,
      courseAr: item.courseName,
      courseEn: item.courseName,
      locationAr: item.location,
      locationEn: item.location,
      metricPositive: true,
    }));

    return {
      success: true,
      count: formatted.length,
      data: formatted,
    };
  }

  async findAllAdmin(query?: { search?: string; isApproved?: boolean; category?: string }) {
    const where: any = {};
    if (query?.category && query.category !== 'ALL') {
      where.category = query.category;
    }
    if (query?.isApproved !== undefined) {
      where.isApproved = query.isApproved;
    }
    if (query?.search) {
      const q = query.search.trim();
      where.OR = [
        { clientName: { contains: q, mode: 'insensitive' } },
        { reviewAr: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
      ];
    }

    const data = await this.prisma.testimonial.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return {
      success: true,
      count: data.length,
      data,
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Testimonial ${id} not found`);
    return item;
  }

  async update(id: string, dto: UpdateTestimonialDto) {
    await this.findOne(id);
    return this.prisma.testimonial.update({
      where: { id },
      data: {
        ...(dto.clientName && { clientName: dto.clientName.trim() }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.roleTitle !== undefined && { roleTitle: dto.roleTitle }),
        ...(dto.avatarText !== undefined && { avatarText: dto.avatarText }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.metricText !== undefined && { metricText: dto.metricText }),
        ...(dto.reviewAr && { reviewAr: dto.reviewAr.trim() }),
        ...(dto.reviewEn !== undefined && { reviewEn: dto.reviewEn }),
        ...(dto.courseName !== undefined && { courseName: dto.courseName }),
        ...(dto.isApproved !== undefined && { isApproved: dto.isApproved }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.testimonial.delete({ where: { id } });
    return { success: true, message: 'تم حذف الرأي بنجاح' };
  }
}
