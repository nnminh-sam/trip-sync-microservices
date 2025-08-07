# Location Service API Documentation

## Overview

The Location Service is a microservice responsible for managing physical locations, validating check-in/check-out operations, tracking GPS coordinates, and performing spatial queries. It supports the Trip Sync system's requirements for employee location tracking and trip management.

## Core Features

- **Location Management**: CRUD operations for work locations
- **Check-in/Check-out Validation**: Verify employee positions within location boundaries
- **GPS Tracking**: Real-time location tracking and distance calculations
- **Spatial Queries**: Find nearby locations, calculate distances, and perform geofencing
- **Caching**: Redis-based caching for frequently accessed location data

---

## Event Subscribers / Message Patterns

### 1. Basic CRUD Operations

#### 1.1 Create Location
- **Pattern**: `location.create`
- **Purpose**: Create a new location in the system
- **Input**:
  ```typescript
  {
    name: string;              // Unique location name
    latitude: number;          // -90 to 90
    longitude: number;         // -180 to 180
    offsetRadious?: number;    // Check-in radius in meters (default: 100)
    description?: string;      // Location description
    type?: LocationType;       // office|client|warehouse|field|other
    address?: string;
    city?: string;
    country?: string;
    timezone?: string;
    createdBy: string;         // UUID of creator
  }
  ```
- **Output**:
  ```typescript
  {
    id: string;                // Generated UUID
    name: string;
    latitude: number;
    longitude: number;
    offsetRadious: number;
    geom: { x: number; y: number };  // Spatial point
    type: LocationType;
    // ... all other fields
    createdAt: Date;
    updatedAt: Date;
  }
  ```
- **Use Case**: Manager creates a new work location for employee assignments

#### 1.2 Find All Locations
- **Pattern**: `location.findAll`
- **Purpose**: Retrieve paginated list of locations with filtering
- **Input**:
  ```typescript
  {
    page?: number;             // Page number (default: 1)
    size?: number;             // Items per page (default: 10)
    order?: 'ASC' | 'DESC';   // Sort order
    sortBy?: string;           // Sort field
    name?: string;             // Filter by name (partial match)
    type?: LocationType;       // Filter by type
    createdBy?: string;        // Filter by creator
  }
  ```
- **Output**:
  ```typescript
  {
    data: Location[];          // Array of locations
    total: number;             // Total count
    page: number;
    size: number;
    totalPages: number;
  }
  ```
- **Use Case**: Display list of available locations in admin panel

#### 1.3 Find One Location
- **Pattern**: `location.findOne`
- **Purpose**: Retrieve a single location by ID
- **Input**:
  ```typescript
  {
    path: { id: string }       // Location UUID
  }
  ```
- **Output**: Single `Location` object or error if not found
- **Use Case**: View detailed information about a specific location

#### 1.4 Update Location
- **Pattern**: `location.update`
- **Purpose**: Update existing location details
- **Input**:
  ```typescript
  {
    path: { id: string },      // Location UUID
    body: {
      name?: string;
      latitude?: number;
      longitude?: number;
      offsetRadious?: number;
      description?: string;
      type?: LocationType;
      // ... other updatable fields
    }
  }
  ```
- **Output**: Updated `Location` object
- **Notes**: Automatically updates `geom` field if coordinates change
- **Use Case**: Admin updates location information or boundaries

#### 1.5 Delete Location
- **Pattern**: `location.delete`
- **Purpose**: Soft delete a location (sets deletedAt timestamp)
- **Input**:
  ```typescript
  {
    path: { id: string }       // Location UUID
  }
  ```
- **Output**:
  ```typescript
  {
    success: boolean;
    message: string;
  }
  ```
- **Notes**: Location remains in database but is excluded from queries
- **Use Case**: Deactivate a location no longer in use

---

### 2. Check-in/Check-out Operations

#### 2.1 Validate Coordinates
- **Pattern**: `location.validateCoordinates`
- **Purpose**: Verify if GPS coordinates are within a location's check-in radius
- **Input**:
  ```typescript
  {
    locationId: string;        // Target location UUID
    latitude: number;          // Current GPS latitude
    longitude: number;         // Current GPS longitude
  }
  ```
- **Note**: Service method signature is `validateCoordinatesInRadius(latitude, longitude, locationId)` - parameters reordered in service
- **Output**:
  ```typescript
  {
    isValid: boolean;          // Within radius?
    distance: number;          // Distance in meters
    maxRadius: number;         // Location's offset radius
    locationName: string;
    message: string;           // Descriptive message
  }
  ```
- **Use Case**: Employee check-in/check-out validation at work location
- **Example**: Employee arrives at office and app validates they're within 100m radius

#### 2.2 Batch Validate Locations
- **Pattern**: `location.validateBatch`
- **Purpose**: Validate multiple location-coordinate pairs in one request
- **Input**:
  ```typescript
  {
    locations: Array<{
      locationId: string;
      latitude: number;
      longitude: number;
    }>;
  }
  ```
- **Output**:
  ```typescript
  {
    results: Array<{
      locationId: string;
      isValid: boolean;
      distance?: number;
      error?: string;
    }>
  }
  ```
- **Use Case**: Validate check-ins for multiple employees or locations simultaneously
- **Performance**: Processes validations in parallel for efficiency

---

### 3. GPS and Distance Operations

#### 3.1 Find Nearby Locations
- **Pattern**: `location.findNearby`
- **Purpose**: Find locations near given coordinates (cached)
- **Input**:
  ```typescript
  {
    latitude: number;
    longitude: number;
    radius?: number;           // Search radius in meters (default: 1000)
    type?: LocationType;       // Filter by type
  }
  ```
- **Output**: Array of `Location` objects within radius
- **Notes**: Results are cached in Redis for 5 minutes
- **Use Case**: Show nearby work locations on mobile app map

#### 3.2 Find Locations Within Radius
- **Pattern**: `location.findWithinRadius`
- **Purpose**: Find all locations within specific radius
- **Input**:
  ```typescript
  {
    latitude: number;
    longitude: number;
    radius: number;            // Required radius in meters
    includeInactive?: boolean; // Include soft-deleted locations
  }
  ```
- **Output**: Array of `Location` objects
- **Use Case**: Search for all company locations within 5km of current position

#### 3.3 Calculate Distance
- **Pattern**: `location.calculateDistance`
- **Purpose**: Calculate distance between two coordinate pairs
- **Input**:
  ```typescript
  {
    fromLat: number;
    fromLng: number;
    toLat: number;
    toLng: number;
  }
  ```
- **Output**:
  ```typescript
  {
    distance: number;          // Distance in meters
    distanceKm: number;        // Distance in kilometers
  }
  ```
- **Use Case**: Calculate travel distance between locations

#### 3.4 Get Distance From Location
- **Pattern**: `location.getDistanceFromLocation`
- **Purpose**: Calculate distance from coordinates to a specific location
- **Input**:
  ```typescript
  {
    locationId: string;        // Target location UUID
    latitude: number;          // Current latitude
    longitude: number;         // Current longitude
  }
  ```
- **Note**: Service method signature is `getDistanceFromLocation(latitude, longitude, locationId)` - parameters reordered in service
- **Output**:
  ```typescript
  {
    locationId: string;
    locationName: string;
    distance: number;          // Meters
    unit: 'meters' | 'kilometers';
    isWithinRadius: boolean;   // Within location's offset radius
  }
  ```
- **Use Case**: Show employee's distance from assigned work location

---

### 4. Area and Boundary Operations

#### 4.1 Find Locations in Area
- **Pattern**: `location.findInArea`
- **Purpose**: Find locations within rectangular boundaries
- **Input**:
  ```typescript
  {
    bounds: {
      minLat: number;          // Southwest corner latitude
      minLng: number;          // Southwest corner longitude
      maxLat: number;          // Northeast corner latitude
      maxLng: number;          // Northeast corner longitude
    };
    type?: LocationType;       // Optional type filter
  }
  ```
- **Output**:
  ```typescript
  {
    data: Location[];
    total: number;
  }
  ```
- **Use Case**: Display locations visible in current map viewport

#### 4.2 Find Nearest Locations
- **Pattern**: `location.findNearest`
- **Purpose**: Find the N nearest locations to coordinates
- **Input**:
  ```typescript
  {
    latitude: number;
    longitude: number;
    limit?: number;            // Max results (default: 5)
  }
  ```
- **Output**: Array of `Location` objects ordered by distance
- **Use Case**: Suggest nearest work locations for assignment

#### 4.3 Check Point in Boundary
- **Pattern**: `location.isPointInBoundary`
- **Purpose**: Check if coordinates are within location's polygon boundary
- **Input**:
  ```typescript
  {
    locationId: string;
    latitude: number;
    longitude: number;
  }
  ```
- **Note**: Service method signature is `isPointInLocationBoundary(latitude, longitude, locationId)` - parameters reordered in service
- **Output**:
  ```typescript
  {
    isInside: boolean;
    locationName: string;
  }
  ```
- **Use Case**: Advanced geofencing for complex location boundaries

#### 4.4 Get Location Boundaries
- **Pattern**: `location.getBoundaries`
- **Purpose**: Retrieve boundary information for locations
- **Input**:
  ```typescript
  {
    locationIds?: string[];    // Array of location UUIDs (optional - returns all if not provided)
  }
  ```
- **Note**: Service method only accepts `locationIds` parameter, no type filter
- **Output**:
  ```typescript
  Array<{
    id: string;
    name: string;
    center: { latitude: number; longitude: number };
    radius: number;
    boundary?: any;            // Polygon data if exists
    type: LocationType;
  }>
  ```
- **Use Case**: Draw location boundaries on map

---

### 5. Batch Operations

#### 5.1 Find Locations by IDs
- **Pattern**: `location.findByIds`
- **Purpose**: Retrieve multiple locations by their IDs
- **Input**:
  ```typescript
  {
    ids: string[];             // Array of location UUIDs
  }
  ```
- **Output**: Array of `Location` objects
- **Use Case**: Load location details for multiple trip destinations

---

### 6. Health Check

#### 6.1 Service Health Status
- **Pattern**: `location.health`
- **Purpose**: Check service and dependency health
- **Input**: None
- **Output**:
  ```typescript
  {
    status: 'healthy' | 'unhealthy';
    database: boolean;
    redis: boolean;
    spatialSupport: boolean;
    timestamp: Date;
  }
  ```
- **Use Case**: Monitoring and alerting

---

## Database Schema

### Location Table
```sql
CREATE TABLE location (
  id VARCHAR(36) PRIMARY KEY,        -- UUID from BaseModel
  name VARCHAR(255) UNIQUE NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  offset_radious FLOAT DEFAULT 100,  -- Note: typo in column name
  description TEXT,
  created_by VARCHAR(36) NOT NULL,   -- UUID, not VARCHAR(255)
  geom POINT NOT NULL SRID 4326,     -- Spatial point, required for spatial index
  type ENUM('office','client','warehouse','field','other') DEFAULT 'office',
  boundary POLYGON SRID 4326,        -- Optional polygon boundary
  metadata JSON,                      -- Flexible JSON field
  address VARCHAR(255),
  city VARCHAR(100),
  country VARCHAR(100),
  timezone VARCHAR(50),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,  -- From BaseModel
  updatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP, -- From BaseModel
  deletedAt DATETIME,                 -- From BaseModel (soft delete)
  
  SPATIAL INDEX idx_location_geom (geom),        -- For spatial queries
  INDEX idx_location_type (type),                -- For type filtering
  INDEX idx_location_created_by (created_by)     -- For user's locations
);
```

---

## Integration Examples

### Mobile App Check-in Flow
```typescript
// 1. Employee opens app at work location
const position = await GPS.getCurrentPosition();

// 2. Validate check-in (controller handles parameter reordering)
const validation = await locationService.send('location.validateCoordinates', {
  locationId: assignedLocationId,
  latitude: position.latitude,
  longitude: position.longitude
});

if (validation.isValid) {
  // 3. Proceed with check-in
  await tripService.checkIn(tripId, position);
} else {
  // 4. Show error: "You are ${validation.distance}m away from ${validation.locationName}"
}
```

### Manager Dashboard - Monitor Employees
```typescript
// 1. Get all active locations
const locations = await locationService.send('location.findAll', {
  page: 1,
  size: 100,
  type: 'office'
});

// 2. For each location, show employees within radius
for (const location of locations.data) {
  const nearby = await gpsService.getEmployeesNearLocation(location.id);
  // Display on map
}
```

### Trip Planning - Multi-destination Route
```typescript
// 1. Get details for all trip destinations
const destinationIds = trip.destinations.map(d => d.locationId);
const locations = await locationService.send('location.findByIds', {
  ids: destinationIds
});

// 2. Calculate total distance
let totalDistance = 0;
for (let i = 0; i < locations.length - 1; i++) {
  const result = await locationService.send('location.calculateDistance', {
    fromLat: locations[i].latitude,
    fromLng: locations[i].longitude,
    toLat: locations[i + 1].latitude,
    toLng: locations[i + 1].longitude
  });
  totalDistance += result.distance;
}
```

---

## Performance Considerations

### Caching Strategy
- **Redis TTL**: 5 minutes for nearby location queries
- **Cache Keys**: 
  - Single location: `location:${id}`
  - Nearby search: `nearby:${lat}:${lng}:${radius}:${type}`
- **Cache Invalidation**: On update/delete operations

### Spatial Indexing
- MySQL spatial index on `geom` column for fast distance queries
- Supports queries on millions of locations with sub-second response

### Batch Processing
- Batch validation processes up to 100 locations in parallel
- Use batch operations when checking multiple locations

---

## Error Handling

### Common Error Responses
```typescript
// Location not found
{
  statusCode: 404,
  message: 'Location not found',
  error: 'Not Found'
}

// Invalid location data (from model transformer)
{
  statusCode: 400,
  message: 'Invalid location data',
  error: 'Bad Request'
}

// Unique constraint violation
{
  statusCode: 409,
  message: 'Location name already exists',
  error: 'Conflict'
}

// Required field missing
{
  statusCode: 400,
  message: 'Location ID is required',
  error: 'Bad Request'
}
```

---

## Security Considerations

1. **Authorization**: All operations require valid JWT token
2. **Input Validation**: Coordinates validated for valid ranges
3. **SQL Injection**: Protected via TypeORM parameterized queries
4. **Rate Limiting**: Implement at API Gateway level
5. **Data Privacy**: Location data filtered by user permissions

---

## Monitoring & Metrics

### Key Metrics to Track
- Check-in validation success/failure rate
- Average response time for spatial queries
- Cache hit rate for nearby location searches
- Number of active locations per type
- Database query performance

### Alerts
- Spatial index degradation
- High validation failure rate (>20%)
- Redis connection failures
- Database connection pool exhaustion