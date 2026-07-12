import { IsInt, IsPositive, Min, Max } from 'class-validator';

export class PlaceStakeDto {
  @IsInt()
  @Min(0)
  @Max(9)
  selectedNumber: number;

  @IsInt()
  @IsPositive()
  @Min(10)
  amount: number;

  // Including userId here for now, though usually it would come from req.user
  // after the auth guard decodes the token.
  userId: string;
}
