import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateCodeDto {
  @ApiProperty({ description: 'كود التفعيل الصادر من النظام (مثال: FXG-7K9P-X4QM-82LA)', example: 'FXG-7K9P-X4QM-82LA' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
