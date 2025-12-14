import { IsDateString, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class CheckInAtLocationDto {
  @IsUUID()
  @IsNotEmpty()
  tripLocationId?: string;

  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @IsDateString()
  @IsNotEmpty()
  timestamp: Date;
}
