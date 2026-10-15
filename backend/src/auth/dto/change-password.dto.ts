import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123!', description: 'كلمة المرور الحالية' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewSecretPassword456!', description: 'كلمة المرور الجديدة (8 خانات على الأقل)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف وأرقام' })
  newPassword: string;
}
