export enum LocationType {
  OFFICE = 'office',
  CLIENT = 'client',
  WAREHOUSE = 'warehouse',
  FIELD = 'field',
  OTHER = 'other',
}

export interface DistanceResult {
  locationId: string;
  locationName: string;
  distance: number;
  unit: 'meters' | 'kilometers';
  isWithinRadius: boolean;
}

export interface LocationMetadata {
  workingHours?: {
    start: string;
    end: string;
  };
  contactPerson?: string;
  contactPhone?: string;
  facilities?: string[];
  capacity?: number;
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  distance: number;
  maxRadius: number;
  locationName: string;
  message?: string;
}

export interface LocationBoundary {
  id: string;
  name: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  boundary?: any;
  type: LocationType;
}

export interface GeoBounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface LocationMetadataExtended extends LocationMetadata {
  timezone?: string;
  accessInstructions?: string;
  parkingAvailable?: boolean;
  publicTransport?: string[];
  contactEmail?: string;
}
