import { IsString } from 'class-validator';

export class RefreshAppTokenDto {
  @IsString()
  refreshToken!: string;
}
