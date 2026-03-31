import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCodexVersionDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsBoolean()
  @IsOptional()
  cloneFromLatest?: boolean;
}
