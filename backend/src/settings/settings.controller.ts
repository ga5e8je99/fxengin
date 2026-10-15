import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SettingsService } from './settings.service';

@ApiTags('Public System Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  @ApiOperation({ summary: 'استعراض الإعدادات العامة للمنصة (العملة، وضع الصيانة، معلومات الاتصال)' })
  @ApiResponse({ status: 200, description: 'الإعدادات العامة' })
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }
}
