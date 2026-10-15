import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendLiveChatMessageDto {
  @ApiProperty({ description: 'نص رسالة الشات المباشر التفاعلي', example: 'ما هي نقطة الدخول المقترحة لصفقة الذهب؟' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  message: string;
}
