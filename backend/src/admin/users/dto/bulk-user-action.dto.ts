import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class BulkDeleteUsersDto {
  @ApiProperty({
    example: ['cmtprh57w0000pm01ixrtqrfa', 'cmtps2jh30002o601roky1cog'],
    description: 'Array of user IDs to permanently delete',
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one user ID must be provided' })
  @IsString({ each: true })
  userIds: string[];
}
