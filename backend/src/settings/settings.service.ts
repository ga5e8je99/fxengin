import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.systemSetting.findUnique({
      where: { id: 'global' },
    });

    if (!settings) {
      settings = await this.prisma.systemSetting.create({
        data: {
          id: 'global',
          siteName: 'FXENGIN Core Terminal',
          currency: 'USD',
          maintenanceMode: false,
          contactEmail: 'fxengin519@gmail.com',
          supportPhone: '+971 4 380 0000',
          telegramChannel: 'https://t.me/FXenginsignals',
          whatsappNumber: '',
        },
      });
    }

    return settings;
  }

  async getPublicSettings() {
    const s = await this.getSettings();
    return {
      success: true,
      data: {
        siteName: s.siteName,
        currency: s.currency,
        maintenanceMode: s.maintenanceMode,
        contactEmail: s.contactEmail,
        supportPhone: s.supportPhone,
        telegramChannel: s.telegramChannel,
        whatsappNumber: s.whatsappNumber,
        metaTitle: s.metaTitle,
        metaDescription: s.metaDescription,
      },
    };
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const existing = await this.getSettings();
    const updated = await this.prisma.systemSetting.update({
      where: { id: existing.id },
      data: {
        ...(dto.siteName !== undefined && { siteName: dto.siteName.trim() }),
        ...(dto.currency !== undefined && { currency: dto.currency.trim() }),
        ...(dto.maintenanceMode !== undefined && { maintenanceMode: dto.maintenanceMode }),
        ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail.trim() }),
        ...(dto.supportPhone !== undefined && { supportPhone: dto.supportPhone.trim() }),
        ...(dto.telegramChannel !== undefined && { telegramChannel: dto.telegramChannel.trim() }),
        ...(dto.whatsappNumber !== undefined && { whatsappNumber: dto.whatsappNumber.trim() }),
        ...(dto.metaTitle !== undefined && { metaTitle: dto.metaTitle.trim() }),
        ...(dto.metaDescription !== undefined && { metaDescription: dto.metaDescription.trim() }),
      },
    });

    return {
      success: true,
      message: 'تم حفظ إعدادات المنصة ومزامنتها بنجاح',
      data: updated,
    };
  }
}
