import { IsNotEmpty, IsObject, IsString, Matches } from 'class-validator';

export class UpdateCodexContentDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/)
  locale!: string;

  @IsObject()
  @IsNotEmpty()
  contentTree!: Record<string, unknown>;
}
