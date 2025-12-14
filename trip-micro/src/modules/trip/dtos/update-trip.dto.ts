import { TripStatusEnum } from 'src/models/trip-status.enum';
export class UpdateTripDto {
  title?: string;

  schedule?: Date;
  
  deadline?: Date;
  
  status?: TripStatusEnum;

  note?: string;
  
  purpose?: string;
  
  goal?: string;
}
