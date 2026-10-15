import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { UpdateAdSenseConfigDto } from './dto/update-adsense-config.dto';
import { AdPlacement } from '@prisma/client';

@ApiTags('Admin Advertisement Management (إدارة المساحات الإعلانية)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/ads')
export class AdminAdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get()
  @ApiOperation({
    summary: '1. استعراض كافة المساحات الإعلانية مع الفلترة (List All Ads)',
    description: 'يعيد قائمة بجميع الإعلانات المسجلة مع إمكانية الفلترة حسب مكان الظهور أو الحالة أو البحث.',
  })
  @ApiQuery({ name: 'placement', enum: AdPlacement, required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  async getAllAds(
    @Query('placement') placement?: AdPlacement,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const activeBool = isActive !== undefined ? isActive === 'true' : undefined;
    return this.adsService.getAllAds(placement, activeBool, search);
  }

  @Get('stats')
  @ApiOperation({
    summary: '2. إحصائيات أداء الإعلانات والنقرات (Ads Performance KPIs)',
    description: 'يعيد أرقام التحليلات: إجمالي الإعلانات، النشط، النقرات، المشاهدات، ومعدل CTR.',
  })
  async getAdsStats() {
    return this.adsService.getAdsStats();
  }

  @Get('adsense-config')
  @ApiOperation({
    summary: '3. جلب إعدادات جوجل أدسنس للوحة التحكم (Get AdSense Config)',
    description: 'يعيد الإعدادات الحالية لـ Google AdSense متضمنة معرف الناشر وحالة الوحدات الإعلانية.',
  })
  async getAdSenseConfig() {
    return this.adsService.getAdSenseConfig();
  }

  @Put('adsense-config')
  @ApiOperation({
    summary: '4. حفظ وتحديث إعدادات جوجل أدسنس (Update AdSense Config)',
    description: 'تحديث حالة التفعيل ومعرف الناشر والوحدات الإعلانية المخصصة.',
  })
  async updateAdSenseConfig(@Body() dto: UpdateAdSenseConfigDto) {
    return this.adsService.updateAdSenseConfig(dto);
  }

  @Post('seed-defaults')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '5. إعادة تعيين الإعلانات الافتراضية الأولية (Seed Default Ads)',
    description: 'يعيد زرع بنرات FXENGIN الافتراضية للأشرطة الجانبية والبنرات الأفقية.',
  })
  async seedDefaultAds() {
    return this.adsService.seedDefaultAds();
  }

  @Get(':id')
  @ApiOperation({
    summary: '6. جلب تفاصيل إعلان معين بالمعرف (Get Ad by ID)',
  })
  @ApiParam({ name: 'id', description: 'معرف الإعلان' })
  async getAdById(@Param('id') id: string) {
    return this.adsService.getAdById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '5. إنشاء إعلان أو بنر جديد (Create Advertisement)',
  })
  async createAd(@Body() dto: CreateAdDto) {
    return this.adsService.createAd(dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: '6. تحديث بيانات إعلان (Update Advertisement)',
  })
  @ApiParam({ name: 'id', description: 'معرف الإعلان' })
  async updateAd(@Param('id') id: string, @Body() dto: UpdateAdDto) {
    return this.adsService.updateAd(id, dto);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({
    summary: '7. تفعيل أو تعطيل الإعلان بنقرة واحدة (Toggle Ad Active Status)',
  })
  @ApiParam({ name: 'id', description: 'معرف الإعلان' })
  async toggleStatus(@Param('id') id: string) {
    return this.adsService.toggleAdStatus(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '8. حذف إعلان نهائياً (Delete Advertisement)',
  })
  @ApiParam({ name: 'id', description: 'معرف الإعلان' })
  async deleteAd(@Param('id') id: string) {
    return this.adsService.deleteAd(id);
  }
}
