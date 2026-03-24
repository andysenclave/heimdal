import { IsEmail, IsString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInviteDto {
  @ApiProperty({ example: 'newuser@example.com', description: 'Email address of the person to invite' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'clx123abc', description: 'Target organization ID. Null for platform-admin (Heimdal Admin) invites.' })
  @IsString()
  @IsOptional()
  orgId?: string;

  @ApiPropertyOptional({
    example: 'admin',
    description: "Role granted in the target org. Org-admins can only set 'member' or 'admin'.",
    enum: ['owner', 'admin', 'member'],
    default: 'member',
  })
  @IsIn(['owner', 'admin', 'member'])
  @IsOptional()
  orgRole?: 'owner' | 'admin' | 'member';

  @ApiPropertyOptional({ example: 'cuid_app_123', description: 'Application ID. Required when orgRole is member.' })
  @IsString()
  @IsOptional()
  appId?: string;
}
