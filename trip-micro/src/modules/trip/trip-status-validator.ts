import { TripStatusEnum } from 'src/models/trip-status.enum';
import { TRIP_STATUS_TRANSISTION_MAP } from './status-transistion-map';

export class TripStatusValidator {
  static validateTransition(current: TripStatusEnum, next: TripStatusEnum) {
    const allowed = TRIP_STATUS_TRANSISTION_MAP[current] ?? [];

    if (!allowed.includes(next)) {
      throw new Error(`Invalid status transition: ${current} -> ${next}`);
    }
  }
}
