import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/create-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

@ApiTags('Coupons & Discount Engine')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'فحص وتطبيق كود الخصم أثناء الدفع (Validate Promo Code)',
    description: 'يُستدعى عند كتابة المستخدم كود خصم في صفحة الشراء لاحتساب الخصم وتحديث السعر الإجمالي.',
  })
  @ApiResponse({ status: 200, description: 'كود الخصم صالح ومقبول' })
  @ApiResponse({ status: 400, description: 'كود الخصم غير صالح أو منتهي' })
  async validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validateCoupon(dto);
  }
}

@ApiTags('Admin Coupons Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  @ApiOperation({ summary: 'سرد كافة أكواد الخصم في المنصة مع عدد مرات الاستخدام والحدود' })
  async findAllCoupons() {
    return this.couponsService.findAllCoupons();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'إنشاء كود خصم جديد (نسبة مئوية أو قيمة ثابتة بـ USDT)' })
  async createCoupon(@Body() dto: CreateCouponDto) {
    return this.couponsService.createCoupon(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تعديل بيانات كود الخصم' })
  async updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.updateCoupon(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف كود الخصم نهائياً' })
  async deleteCoupon(@Param('id') id: string) {
    return this.couponsService.deleteCoupon(id);
  }
}
