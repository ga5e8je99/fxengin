import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeNewsletterDto {
  @ApiProperty({ example: 'trader@example.com', description: 'البريد الإلكتروني للاشتراك في النشرة' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
