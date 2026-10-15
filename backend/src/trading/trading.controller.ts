import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  Ip,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { TradingService } from './trading.service';
import {
  ActivateTradingAccountDto,
  DirectGuestTradingDto,
  OpenPositionDto,
  ClosePositionDto,
  ModifyPositionDto,
} from './dto/trading.dto';

@ApiTags('Trading MT5 Simulator & Competition')
@Controller('trading')
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Post('auth/activate')
  @ApiOperation({ summary: 'تسجيل الدخول لمحاكي MT5 وتفعيل حساب المسابقة بكود التفعيل' })
  async activateWithCode(
    @Body() dto: ActivateTradingAccountDto,
    @Ip() clientIp: string,
  ) {
    return this.tradingService.activateOrLoginWithCode(dto, clientIp);
  }

  @Post('auth/guest')
  @ApiOperation({ summary: 'الدخول الفوري بحساب تجريبي ضيف لاختبار المحاكي' })
  async guestAccess(@Body() dto: DirectGuestTradingDto) {
    return this.tradingService.guestAccess(dto);
  }

  @Get('user-account')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'جلب بيانات حساب مسابقة التداول للمستخدم مع احتساب رصيد المسابقة حسب المجموعات والكورسات' })
  async getUserAccount(@Req() req: any) {
    if (!req.user?.id) {
      return {
        success: true,
        account: null,
        fundingBreakdown: {
          totalPaid: 0,
          totalSubsTierBalance: 0,
          totalCoursesTierBalance: 0,
          targetCompetitionBalance: 0,
          hasActiveSubscriptions: false,
          hasEnrolledCourses: false,
          groups: [],
          courses: [],
          ruleText: 'رصيد حساب المسابقة: جروب الذهب (50,000$) • الكورسات (25,000$) • جروب الاندكس (10,000$) • جروب الفوركس (5,000$)',
        },
        positions: [],
      };
    }
    return this.tradingService.getUserTradingAccount(req.user.id);
  }

  @Get('account/:id')
  @ApiOperation({ summary: 'جلب بيانات الحساب والصفقات المفتوحة والهامش' })
  async getAccountState(@Param('id') id: string) {
    return this.tradingService.getAccountState(id);
  }

  @Post('account/:id/positions/open')
  @ApiOperation({ summary: 'فتح صفقة شراء أو بيع جديدة (Market Execution)' })
  async openPosition(
    @Param('id') id: string,
    @Body() dto: OpenPositionDto,
  ) {
    return this.tradingService.openPosition(id, dto);
  }

  @Post('account/:id/positions/:posId/close')
  @ApiOperation({ summary: 'إغلاق صفقة مفتوحة واحتساب الأرباح والنقاط' })
  async closePosition(
    @Param('id') id: string,
    @Param('posId') posId: string,
    @Body() dto: ClosePositionDto,
  ) {
    return this.tradingService.closePosition(id, posId, dto);
  }

  @Patch('account/:id/positions/:posId/modify')
  @ApiOperation({ summary: 'تعديل وقف الخسارة وجني الأرباح' })
  async modifyPosition(
    @Param('id') id: string,
    @Param('posId') posId: string,
    @Body() dto: ModifyPositionDto,
  ) {
    return this.tradingService.modifyPosition(id, posId, dto);
  }

  @Get('account/:id/history')
  @ApiOperation({ summary: 'جلب سجل الصفقات المغلقة للحساب' })
  async getTradeHistory(@Param('id') id: string) {
    return this.tradingService.getTradeHistory(id);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'لوحة المتصدرين العامة لمسابقة المتداولين' })
  async getLeaderboard(@Query('limit') limit?: string) {
    const lim = limit ? parseInt(limit, 10) : 50;
    return this.tradingService.getLeaderboard(lim);
  }

  @Get('plans')
  @ApiOperation({ summary: 'قائمة باقات الحسابات التجريبية وشروط المسابقة' })
  async getCompetitionPlans() {
    return this.tradingService.getCompetitionPlans();
  }
}
