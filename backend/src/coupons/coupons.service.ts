import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/create-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate a coupon code for purchase
   */
  async validateCoupon(dto: ValidateCouponDto) {
    const rawCode = dto.code?.trim().toUpperCase();
    if (!rawCode) {
      throw new BadRequestException('يرجى إدخال كود الخصم');
    }

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: rawCode },
      include: {
        course: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('كود الخصم غير صالح أو منتهي الصلاحية');
    }

    // Check expiration date
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      throw new BadRequestException('عذراً، انتهت صلاحية استخدام هذا الكوبون');
    }

    // Check usage limits
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('تم استنفاد الحد الأقصى لمرات استخدام هذا الكود');
    }

    // Check course restriction
    if (coupon.courseId && dto.courseId) {
      const matchesCourse =
        coupon.courseId === dto.courseId ||
        coupon.course?.slug === dto.courseId;
      if (!matchesCourse) {
        throw new BadRequestException(`هذا الكود مخصص فقط لدورة: ${coupon.course?.title || 'أخرى'}`);
      }
    }

    const originalAmount = Number(dto.amount || 0);

    // Check minimum purchase amount
    const minPurchase = Number(coupon.minPurchase || 0);
    if (originalAmount > 0 && originalAmount < minPurchase) {
      throw new BadRequestException(`الحد الأدنى لقيمة الشراء لتفعيل هذا الكود هو ${minPurchase} USDT`);
    }

    // Calculate discount amount
    let discountAmount = 0;
    const discountVal = Number(coupon.discountValue);

    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (originalAmount * discountVal) / 100;
      if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
        discountAmount = Number(coupon.maxDiscount);
      }
    } else {
      // FIXED
      discountAmount = discountVal;
      if (originalAmount > 0 && discountAmount > originalAmount) {
        discountAmount = originalAmount;
      }
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalAmount = originalAmount > 0 ? Math.max(0, Math.round((originalAmount - discountAmount) * 100) / 100) : 0;

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: discountVal,
      discountAmount,
      finalAmount,
      originalAmount,
      message:
        coupon.discountType === 'PERCENTAGE'
          ? `تم تطبيق خصم ${discountVal}% بنجاح!`
          : `تم تطبيق خصم بقيمة ${discountVal} USDT بنجاح!`,
    };
  }

  /**
   * Increment usage count of a coupon after successful checkout
   */
  async recordCouponUsage(code: string) {
    const rawCode = code?.trim().toUpperCase();
    if (!rawCode) return;
    try {
      await this.prisma.coupon.update({
        where: { code: rawCode },
        data: {
          usedCount: { increment: 1 },
        },
      });
    } catch {
      // silent ignore if coupon doesn't exist
    }
  }

  /**
   * Admin: List all coupons
   */
  async findAllCoupons() {
    const coupons = await this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    return coupons.map((c) => ({
      id: c.id,
      code: c.code,
      discountType: c.discountType,
      discountValue: Number(c.discountValue),
      minPurchase: c.minPurchase ? Number(c.minPurchase) : null,
      maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
      courseId: c.courseId,
      courseTitle: c.course?.title || null,
      courseSlug: c.course?.slug || null,
      expiresAt: c.expiresAt,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      isActive: c.isActive,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  /**
   * Admin: Create a new coupon
   */
  async createCoupon(dto: CreateCouponDto) {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (existing) {
      throw new ConflictException(`كود الخصم "${code}" موجود بالفعل`);
    }

    const coupon = await this.prisma.coupon.create({
      data: {
        code,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minPurchase: dto.minPurchase ?? null,
        maxDiscount: dto.maxDiscount ?? null,
        courseId: dto.courseId || null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        maxUses: dto.maxUses ?? 100,
        isActive: dto.isActive ?? true,
      },
    });

    return {
      success: true,
      message: `تم إنشاء كود الخصم ${coupon.code} بنجاح`,
      coupon,
    };
  }

  /**
   * Admin: Update coupon
   */
  async updateCoupon(id: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('كود الخصم غير موجود');
    }

    const updated = await this.prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.discountType && { discountType: dto.discountType }),
        ...(dto.discountValue !== undefined && { discountValue: dto.discountValue }),
        ...(dto.minPurchase !== undefined && { minPurchase: dto.minPurchase }),
        ...(dto.maxDiscount !== undefined && { maxDiscount: dto.maxDiscount }),
        ...(dto.courseId !== undefined && { courseId: dto.courseId || null }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
        ...(dto.maxUses !== undefined && { maxUses: dto.maxUses }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return {
      success: true,
      message: `تم تحديث كود الخصم ${updated.code} بنجاح`,
      coupon: updated,
    };
  }

  /**
   * Admin: Delete coupon
   */
  async deleteCoupon(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('كود الخصم غير موجود');
    }

    await this.prisma.coupon.delete({ where: { id } });

    return {
      success: true,
      message: `تم حذف كود الخصم ${coupon.code} بنجاح`,
    };
  }
}
