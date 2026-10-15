import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'The refresh token issued during login/registration',
    example: 'd9b7f58a-3c4a-4e89-b1d9-7e4e1f5d8a9c',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
