import { IsEmail, IsString } from 'class-validator';

export class LoginAppUserDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @IsString()
  password!: string;
}
