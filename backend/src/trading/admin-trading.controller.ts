import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TradingService } from './trading.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import {
  CreateCompetitionPlanDto,
  UpdateCompetitionPlanDto,
  CreateManualParticipantDto,
  UpdateManualParticipantDto,
} from './dto/trading.dto';

@ApiTags('Admin Trading Competition & Demo Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/trading')
export class AdminTradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'لوحة المتصدرين الشاملة للمسابقة للإدارة' })
  async getLeaderboard(@Query('limit') limit?: string) {
    const lim = limit ? parseInt(limit, 10) : 100;
    return this.tradingService.getLeaderboard(lim);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'جلب كافة الحسابات التجريبية مع الفلترة والبحث' })
  async getAllAccounts(
    @Query('search') search?: string,
    @Query('planId') planId?: string,
  ) {
    return this.tradingService.adminGetAllAccounts(search, planId);
  }

  @Post('accounts/manual')
  @ApiOperation({ summary: 'إضافة متسابق أو حساب تجريبي يدوياً (مشترك عبر الشركة)' })
  async addManualParticipant(@Body() dto: CreateManualParticipantDto) {
    return this.tradingService.adminCreateManualParticipant(dto);
  }

  @Put('accounts/:id')
  @ApiOperation({ summary: 'تعديل بيانات ورصيد ونتائج حساب المتسابق' })
  async updateAccount(
    @Param('id') id: string,
    @Body() dto: UpdateManualParticipantDto,
  ) {
    return this.tradingService.adminUpdateAccount(id, dto);
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'حذف حساب متسابق' })
  async deleteAccount(@Param('id') id: string) {
    return this.tradingService.adminDeleteAccount(id);
  }

  @Post('accounts/:id/reset')
  @ApiOperation({ summary: 'إعادة ضبط الحساب التجريبي لرصيده الابتدائي' })
  async resetAccount(@Param('id') id: string) {
    return this.tradingService.adminResetAccount(id);
  }

  @Patch('accounts/:id/status')
  @ApiOperation({ summary: 'تغيير حالة الحساب (ACTIVE أو DISQUALIFIED)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.tradingService.adminToggleAccountStatus(id, status);
  }

  @Get('plans')
  @ApiOperation({ summary: 'جلب باقات الحسابات التجريبية والمسابقة للإدارة' })
  async getAllPlans() {
    return this.tradingService.adminGetAllPlans();
  }

  @Post('plans')
  @ApiOperation({ summary: 'إنشاء باقة حساب تجريبي جديدة للمسابقة' })
  async createPlan(@Body() dto: CreateCompetitionPlanDto) {
    return this.tradingService.adminCreatePlan(dto);
  }

  @Put('plans/:id')
  @ApiOperation({ summary: 'تعديل باقة حساب تجريبي' })
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateCompetitionPlanDto,
  ) {
    return this.tradingService.adminUpdatePlan(id, dto);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'حذف باقة مسابقة' })
  async deletePlan(@Param('id') id: string) {
    return this.tradingService.adminDeletePlan(id);
  }
}
