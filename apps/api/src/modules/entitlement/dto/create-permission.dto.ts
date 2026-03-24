import { IsString, IsNotEmpty, IsOptional, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ example: 'trade:execute', description: 'domain:action format' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z]+:[a-z]+$/, { message: 'key must be in domain:action format (lowercase only)' })
  key!: string;

  @ApiProperty({ example: 'org_cuid001' })
  @IsString()
  @IsNotEmpty()
  orgId!: string;

  @ApiPropertyOptional({ example: 'Execute a paper trade in the portfolio' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
