import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/contact.dto';

@ApiTags('Contact Us & Support Desk')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إرسال رسالة تواصل جديدة من الموقع' })
  @ApiResponse({ status: 200, description: 'تم استلام الرسالة بنجاح' })
  async create(@Body() dto: CreateContactMessageDto) {
    return this.contactService.create(dto);
  }
}
