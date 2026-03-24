import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'andy@thimple.in' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'supersecret123' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({
    example: 'app_mimir_prod',
    description: 'App context for JWT aud claim. Defaults to heimdal-admin.',
  })
  @IsOptional()
  @IsString()
  appId?: string;
}
