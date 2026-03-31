import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateCodexScreenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9-]*$/)
  @MaxLength(50)
  slug!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
