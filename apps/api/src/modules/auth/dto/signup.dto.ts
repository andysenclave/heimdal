import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'andy@thimple.in' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'supersecret123', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72) // bcrypt truncates at 72 bytes
  password!: string;

  @ApiPropertyOptional({ example: 'Andy' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
