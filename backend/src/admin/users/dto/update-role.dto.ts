import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRoleFilter } from './list-users-query.dto';

export class UpdateRoleDto {
  @ApiProperty({
    enum: UserRoleFilter,
    example: UserRoleFilter.VIP,
    description: 'New privilege role assigned to user',
  })
  @IsEnum(UserRoleFilter, { message: 'Invalid role provided' })
  @IsNotEmpty({ message: 'Role is required' })
  role: UserRoleFilter;
}
