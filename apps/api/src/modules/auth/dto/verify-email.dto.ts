import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Verification token from the email link' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
