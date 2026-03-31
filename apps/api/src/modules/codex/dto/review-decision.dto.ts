import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewDecisionDto {
  @IsString()
  @IsIn(['approve', 'reject'])
  decision!: 'approve' | 'reject';

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  feedback?: string;
}
