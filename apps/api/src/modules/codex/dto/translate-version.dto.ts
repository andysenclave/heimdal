import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

const LOCALE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

export class TranslateVersionDto {
  @IsString()
  @IsNotEmpty()
  @Matches(LOCALE_PATTERN)
  targetLocale!: string;

  @IsOptional()
  @IsString()
  @Matches(LOCALE_PATTERN)
  sourceLocale?: string;
}
