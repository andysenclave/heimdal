import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'editor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, { message: 'name must be lowercase alphanumeric with hyphens' })
  name!: string;

  @ApiProperty({ example: 'org_cuid001' })
  @IsString()
  @IsNotEmpty()
  orgId!: string;

  @ApiPropertyOptional({ example: 'role_cuid001', description: 'Parent role ID for hierarchy' })
  @IsOptional()
  @IsString()
  parentRoleId?: string;

  @ApiPropertyOptional({ example: 'Can edit content but not delete' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}
