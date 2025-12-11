import { TripStatusEnum } from 'src/models/trip-status.enum';

export class UpdateTripDto {
  title: string;

  status: TripStatusEnum;

  purpose: string;

  goal: string;

  schedule: Date;

  deadline: Date;

  note: string;
}
