import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({ example: 'Mimir Trading App' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'org_cuid001' })
  @IsString()
  @IsNotEmpty()
  orgId!: string;

  @ApiPropertyOptional({ example: 'Paper trading and portfolio tracking app' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
