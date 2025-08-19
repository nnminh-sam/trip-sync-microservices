import { BaseModel } from 'src/models/base.model';
import { GPSLog } from 'src/models/gps-log.model';
import { CheckInOut } from 'src/models/check-in-out.model';
import { GPSExport } from 'src/models/gps-export.model';

export const tableSchemas = [
  BaseModel,
  GPSLog,
  CheckInOut,
  GPSExport,
];
