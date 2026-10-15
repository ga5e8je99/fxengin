import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { PaymentsService } from './payments.service';

@ApiTags('Admin Orders & Payments Desk')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminOrdersController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ==========================================
  // إدارة الطلبات والمدفوعات (Orders Desk)
  // ==========================================

  @Get('orders')
  @ApiOperation({ summary: 'سرد كافة طلبات الشراء مع الفلترة حسب الحالة والبحث والإحصائيات' })
  @ApiQuery({ name: 'status', required: false, description: 'حالة الطلب (ALL, PENDING, UNDER_REVIEW, PAID, FAILED)' })
  @ApiQuery({ name: 'search', required: false, description: 'بحث برقم الطلب، الإيميل، الاسم، أو TxID' })
  @ApiQuery({ name: 'page', required: false, description: 'رقم الصفحة' })
  @ApiQuery({ name: 'limit', required: false, description: 'عدد العناصر بالصفحة' })
  async listOrders(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.listAdminOrders({ status, search, page, limit });
  }

  @Post('orders/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'اعتماد سداد الطلب وتوليد كود التفعيل وإرساله للعميل (Approve Order & Generate Code)',
  })
  @ApiParam({ name: 'id', description: 'معرف الطلب أو رقم الطلب' })
  async approveOrder(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body?: { adminNotes?: string; transactionRef?: string },
  ) {
    return this.paymentsService.approveOrder(id, req.user?.id, body);
  }

  @Post('orders/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'رفض طلب السداد مع تحديد السبب وإشعار العميل بالبريد' })
  @ApiParam({ name: 'id', description: 'معرف الطلب أو رقم الطلب' })
  async rejectOrder(
    @Param('id') id: string,
    @Request() req: any,
    @Body('reason') reason?: string,
  ) {
    return this.paymentsService.rejectOrder(id, req.user?.id, reason);
  }

  @Delete('orders/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف نهائي للطلب وكافة بياناته من قاعدة البيانات' })
  @ApiParam({ name: 'id', description: 'معرف الطلب أو رقم الطلب' })
  async deleteOrder(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.paymentsService.deleteAdminOrder(id, req.user?.id);
  }

  // ==========================================
  // إدارة أكواد التفعيل (Activation Codes Vault)
  // ==========================================

  @Get('activation-codes')
  @ApiOperation({ summary: 'سرد سجل كافة أكواد التفعيل وحالتها ومشتريها' })
  @ApiQuery({ name: 'status', required: false, description: 'حالة الكود (ALL, UNUSED, ACTIVATED, REVOKED, UNACTIVATED)' })
  @ApiQuery({ name: 'search', required: false, description: 'بحث بالبادئة، الإيميل، أو رقم الطلب' })
  @ApiQuery({ name: 'page', required: false, description: 'رقم الصفحة' })
  @ApiQuery({ name: 'limit', required: false, description: 'عدد العناصر' })
  async listActivationCodes(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.listAdminActivationCodes({ status, search, page, limit });
  }

  @Post('activation-codes/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تفعيل الطلب أو الكود فوراً وإصدار كود التفعيل للعميل' })
  @ApiParam({ name: 'id', description: 'معرف الكود أو الطلب المعلق' })
  async activateActivationCode(
    @Param('id') id: string,
    @Request() req: any,
    @Body('notes') notes?: string,
  ) {
    return this.paymentsService.activateCodeOrOrder(id, req.user?.id, notes);
  }

  @Post('activation-codes/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إلغاء صلاحية كود تفعيل وتعطيل أي ترخيص مشتق منه فوراً' })
  @ApiParam({ name: 'id', description: 'معرف سجل كود التفعيل' })
  async revokeActivationCode(
    @Param('id') id: string,
    @Request() req: any,
    @Body('reason') reason?: string,
  ) {
    return this.paymentsService.revokeActivationCode(id, req.user?.id, reason);
  }

  @Post('activation-codes/:id/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إبطال الكود القديم وإصدار كود تفعيل جديد وإرساله للعميل' })
  @ApiParam({ name: 'id', description: 'معرف سجل كود التفعيل' })
  async regenerateActivationCode(
    @Param('id') id: string,
    @Request() req: any,
    @Body('notes') notes?: string,
  ) {
    return this.paymentsService.regenerateActivationCode(id, req.user?.id, notes);
  }

  @Delete('activation-codes/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف نهائي لكود التفعيل أو الطلب من قاعدة البيانات' })
  @ApiParam({ name: 'id', description: 'معرف السجل أو الطلب' })
  async deleteActivationCode(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.paymentsService.deleteAdminActivationCode(id, req.user?.id);
  }
}
