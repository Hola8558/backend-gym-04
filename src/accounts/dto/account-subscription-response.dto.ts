import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AccountSubscriptionResponseDto {
  @Expose()
  @ApiProperty()
  status: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  current_period_start: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  current_period_end: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  amount: number | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  currency: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  interval: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  interval_count: number | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  quantity: number | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  product: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  discount: string | null;

  @Expose()
  @ApiProperty()
  cancel_at_period_end: boolean;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  collection_method: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  created: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  trial_end: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  canceled_at: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  ended_at: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  cancel_at: string | null;
}
