import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInviteDto {
  @ApiProperty({ example: 'newadmin@example.com', description: 'Email address of the person to invite' })
  @IsEmail()
  email!: string;
}
