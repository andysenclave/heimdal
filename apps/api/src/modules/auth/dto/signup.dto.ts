import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
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

  @ApiProperty({ example: 'HMD-7X3K9', description: 'Invite code from an existing Heimdal Admin' })
  @IsString()
  @IsNotEmpty({ message: 'Invite code is required' })
  @Matches(/^HMD-[A-HJ-NP-Z2-9]{5}$/, { message: 'Invalid invite code format' })
  inviteCode!: string;
}
