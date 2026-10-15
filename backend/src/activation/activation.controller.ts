import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivationService } from './activation.service';
import { ActivateCodeDto } from './dto/activate-code.dto';

@ApiTags('Product Activation & Entitlements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activate')
export class ActivationController {
  constructor(private readonly activationService: ActivationService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'تفعيل كود الكورس أو الاشتراك وإصدار ترخيص الاستحقاق (Activate Code)',
    description: 'يتحقق من الكود المشفر، والتأكد من ملكية الحساب، وعدم التكرار، ومنح الوصول الفوري للمحتوى.',
  })
  @ApiResponse({ status: 200, description: 'تم تفعيل الكود بنجاح وفك القفل عن المحتوى' })
  async activateCode(
    @Request() req: any,
    @Body() dto: ActivateCodeDto,
    @Ip() clientIp: string,
  ) {
    const userIp = req.headers['x-forwarded-for'] || clientIp || '';
    return this.activationService.activateCode(req.user.id, dto.code, String(userIp));
  }

  @Get('my-entitlements')
  @ApiOperation({
    summary: 'جلب التراخيص والاستحقاقات النشطة للمستخدم (Get My Active Entitlements)',
  })
  async getMyEntitlements(@Request() req: any) {
    return this.activationService.getMyEntitlements(req.user.id);
  }
}
