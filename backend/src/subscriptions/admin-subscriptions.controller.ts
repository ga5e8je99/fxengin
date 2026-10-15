import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { SubscriptionsService } from './subscriptions.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';

@ApiTags('Admin Subscription Plans & Feature Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/subscriptions')
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({
    summary: '1. استعراض كافة الباقات وإحصائيات المشتركين (Admin List Plans)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى في لوحة تحكم الأدمن (/admin/subscriptions).\n' +
      '- تُرجع كافة الباقات (المفعلة والمعطلة) مع عدد المشتركين النشطين في كل باقة والميزات والصلاحيات.\n' +
      '- تتطلب هيدر المشرف (Bearer Token).',
  })
  @ApiResponse({ status: 200, description: 'قائمة بكافة الباقات وبيانات المشتركين.' })
  async listAllPlans() {
    return this.subscriptionsService.adminListPlans();
  }

  @Get('stats')
  @ApiOperation({
    summary: '2. إحصائيات سريعة للاشتراكات (Admin Subscription Stats)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى لكروت الإحصائيات (KPI Cards) في رأس صفحة إدارة الاشتراكات (/admin/subscriptions).\n' +
      '- تُرجع: إجمالي الباقات، الباقات النشطة، وإجمالي المشتركين الفعليين.',
  })
  @ApiResponse({ status: 200, description: 'أرقام وإحصائيات الاشتراكات.' })
  async getStats() {
    return this.subscriptionsService.adminGetStats();
  }

  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '3. إضافة باقة اشتراك جديدة مع تحديد صلاحياتها (Create New Plan)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُربط بفورم "إضافة باقة جديدة" في نافذة المودال (/admin/subscriptions).\n' +
      '- ترسل: الاسم، الـ slug، الوصف، السعر، الدورة، الوسم (Badge)، ومصفوفة الصلاحيات التقنية (`permissions`).\n' +
      '- يتم نشر الباقة فوراً في المنصة وظهورها للزوار والطلاب.',
  })
  @ApiResponse({ status: 201, description: 'تم إنشاء باقة الاشتراك بنجاح.' })
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionsService.adminCreatePlan(dto);
  }

  @Put('plans/:id')
  @ApiOperation({
    summary: '4. تعديل بيانات باقة وصلاحياتها (Update Plan)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُربط بزر "تعديل الباقة" لتغيير السعر، تفعيل/تعطيل، أو إضافة وحذف صلاحيات فيتشرات المنصة.',
  })
  @ApiParam({ name: 'id', description: 'معرف باقة الاشتراك' })
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.subscriptionsService.adminUpdatePlan(id, dto);
  }

  @Delete('plans/:id')
  @ApiOperation({
    summary: '5. حذف أو أرشفة باقة اشتراك (Delete or Archive Plan)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُربط بأيقونة الحذف؛ في حالة وجود مشتركين حاليين بالباقة، يقوم السيرفر بتعطيلها تلقائياً لحماية سجلاتهم بدلاً من الحذف الفيزيائي.',
  })
  @ApiParam({ name: 'id', description: 'معرف باقة الاشتراك' })
  async deletePlan(@Param('id') id: string) {
    return this.subscriptionsService.adminDeletePlan(id);
  }

  @Post('assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '6. منح اشتراك يدوي لمستخدم (Admin Assign Subscription)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُربط بزر "منح اشتراك" لتمكين المشرف من تفعيل أي باقة لمستخدم مجاناً أو كهدية عبر بريده الإلكتروني أو معرفه.',
  })
  @ApiResponse({ status: 200, description: 'تم تفعيل الاشتراك للمستخدم بنجاح.' })
  async assignSubscription(@Body() dto: AssignSubscriptionDto) {
    return this.subscriptionsService.adminAssignSubscription(dto);
  }

  @Get('subscribers')
  @ApiOperation({
    summary: '7. دليل كافة المشتركين بالمنصة (Subscribers Directory)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى لعرض جدول المشتركين النشطين وتواريخ اشتراكاتهم ونهايتها وبياناتهم الشخصية.',
  })
  @ApiResponse({ status: 200, description: 'قائمة بكافة المشتركين وتفاصيل باقاتهم.' })
  async listSubscribers() {
    return this.subscriptionsService.adminListSubscribers();
  }
}
