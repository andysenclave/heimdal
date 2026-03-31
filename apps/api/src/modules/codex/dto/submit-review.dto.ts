import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitForReviewDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
