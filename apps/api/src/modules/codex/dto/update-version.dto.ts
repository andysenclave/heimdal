import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCodexVersionDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
