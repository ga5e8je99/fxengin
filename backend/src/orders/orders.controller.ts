import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SubmitPaymentDto } from './dto/submit-payment.dto';
import { ProductType } from '@prisma/client';

@ApiTags('Orders & Checkout Gateway')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'إنشاء طلب شراء رسمي لكورس أو بث مباشر أو جروب (Create Order)',
    description: 'يتم احتساب السعر الرسمي والخصم من قاعدة البيانات حصرياً وتثبيت الطلب بحالة PENDING.',
  })
  @ApiResponse({ status: 201, description: 'تم إنشاء الطلب بنجاح' })
  async createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user?.id, dto);
  }

  @Get('check-status')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'فحص ما إذا كان للمستخدم طلب معلق أو اشتراك نشط لهذا المنتج لمنع التكرار',
  })
  async checkStatus(
    @Request() req: any,
    @Query('productId') productId: string,
    @Query('productType') productType: ProductType,
    @Query('email') email?: string,
    @Query('phone') phone?: string,
  ) {
    return this.ordersService.checkExistingOrderOrEntitlement(
      req.user?.id,
      productId,
      productType,
      email,
      phone,
    );
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'جلب قائمة كافة طلبات المستخدم الحالي (Get Current User Orders)',
  })
  async getMyOrders(@Request() req: any) {
    return this.ordersService.getMyOrders(req.user.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'جلب تفاصيل طلب محدد وإرشادات السداد (Get Order Details)',
  })
  @ApiParam({ name: 'id', description: 'معرف الطلب أو رقم الطلب (Order ID / Order Number)' })
  async getOrderById(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.getOrderById(id, req.user?.id);
  }

  @Post(':id/submit-payment')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'تقديم إثبات السداد ورقم المعاملة (Submit Payment Proof / TxID)',
    description: 'يقوم بتحويل الطلب إلى UNDER_REVIEW وإرسال إشعار فوري وتفاعلي لبوت التيليجرام الخاص بالإدارة.',
  })
  @ApiParam({ name: 'id', description: 'معرف الطلب' })
  async submitPayment(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: SubmitPaymentDto,
  ) {
    return this.ordersService.submitPayment(id, req.user?.id, dto);
  }
}

