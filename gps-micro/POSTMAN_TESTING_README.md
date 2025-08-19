# GPS Service Postman Testing Guide

## Overview
This Postman collection provides comprehensive testing for the GPS microservice, covering all endpoints including tracking, check-in/out, analytics, and export features.

## Setup Instructions

### 1. Import Collection and Environment

1. Open Postman
2. Click "Import" button
3. Import the following files:
   - `GPS_Service_Postman_Collection.json` - Main collection
   - `GPS_Service_Postman_Environment.json` - Environment variables

### 2. Configure Environment

Select "GPS Service - Development" environment and update the following variables:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `gps_service_url` | GPS microservice URL | `http://localhost:3004` |
| `access_token` | JWT authentication token | (obtain from auth service) |
| `user_id` | Test user UUID | `123e4567-e89b-12d3-a456-426614174000` |
| `trip_id` | Test trip UUID | `323e4567-e89b-12d3-a456-426614174000` |
| `trip_location_id` | Test trip location UUID | `423e4567-e89b-12d3-a456-426614174000` |
| `location_id` | Test location UUID | `523e4567-e89b-12d3-a456-426614174000` |

### 3. Authentication Setup

Before running tests, obtain an access token:

1. Login through the Auth service
2. Copy the access token
3. Update the `access_token` environment variable

## Collection Structure

### 1. GPS Tracking
- **Track Single GPS Point**: Log individual GPS coordinates
- **Batch Track GPS Points**: Send multiple GPS points at once
- **Get Trip Route**: Retrieve complete route for a trip
- **Get Simplified Trip Route**: Get optimized route with fewer points

### 2. Check-in/Check-out
- **Check In at Location**: Record arrival at a location
- **Check Out from Location**: Record departure from a location
- **Validate Location**: Check if coordinates are within location radius
- **Get Nearby Locations**: Find locations within specified radius

### 3. Route Analysis
- **Detect Stops**: Identify stops during a trip
- **Get Trip Statistics**: Get comprehensive trip metrics

### 4. Analytics
- **Get Analytics Summary**: Overview of GPS data for date range
- **Get User Analytics**: User-specific analytics

### 5. Real-time Monitoring
- **Get Realtime Locations**: Current locations for multiple trips/users
- **Get Latest Location**: Most recent location for a specific trip

### 6. Export
- **Create GPS Export**: Generate CSV/JSON/GPX export
- **Get Export Status**: Check export job progress
- **Create JSON Export**: Export with anonymization
- **Create GPX Export**: GPS tracking format export

### 7. Health Check
- **Health Check**: Verify service status

### 8. Error Scenarios
- **Track GPS - Duplicate Timestamp**: Test duplicate prevention
- **Check In - Already Checked In**: Test double check-in prevention
- **Check Out - No Check In**: Test check-out validation
- **Export - Invalid Format**: Test format validation

## Test Execution

### Running Individual Tests

1. Select a request from the collection
2. Click "Send" button
3. Review response and test results in "Test Results" tab

### Running Collection

1. Right-click on collection or folder
2. Select "Run collection"
3. Configure:
   - Iterations: 1
   - Delay: 500ms (recommended)
   - Data file: (optional)
4. Click "Run GPS Service"

### Test Order Recommendations

For best results, run tests in this sequence:

1. Health Check
2. Track Single GPS Point
3. Batch Track GPS Points
4. Get Trip Route
5. Check In at Location
6. Check Out from Location
7. Detect Stops
8. Get Trip Statistics
9. Get Analytics Summary
10. Create GPS Export
11. Get Export Status

## Automated Tests

Each request includes automated tests that verify:

- Response status codes
- Response structure and data types
- Business logic validation
- Error handling

### Test Examples

```javascript
// Status code validation
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Response structure validation
pm.test("Response has required fields", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
    pm.expect(jsonData).to.have.property('message');
});

// Business logic validation
pm.test("Efficiency score range", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.efficiencyScore).to.be.at.least(0);
    pm.expect(jsonData.efficiencyScore).to.be.at.most(100);
});
```

## Pre-request Scripts

Some requests include pre-request scripts that:

- Generate timestamps
- Create test data
- Set dynamic variables

Example:
```javascript
// Generate current timestamp
pm.variables.set('current_timestamp', new Date().toISOString());

// Generate GPS locations array
const locations = [];
for (let i = 0; i < 10; i++) {
    locations.push({
        latitude: 21.0285 + (Math.random() * 0.01),
        longitude: 105.8542 + (Math.random() * 0.01),
        timestamp: new Date(Date.now() - (i * 60000)).toISOString()
    });
}
pm.variables.set('gps_locations', JSON.stringify(locations));
```

## Common Test Scenarios

### 1. Complete Trip Tracking Flow

1. Create batch GPS tracks for a trip
2. Get trip route
3. Detect stops
4. Get trip statistics
5. Export trip data

### 2. Check-in/Check-out Flow

1. Check in at location
2. Track GPS points during visit
3. Check out from location
4. Verify duration calculation

### 3. Analytics Flow

1. Track GPS data for multiple trips
2. Get analytics summary
3. Get user-specific analytics
4. Export analytics data

### 4. Real-time Monitoring Flow

1. Track GPS points
2. Get real-time locations
3. Subscribe to trip updates (WebSocket)
4. Monitor location changes

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Update `access_token` in environment
   - Ensure token is not expired

2. **404 Not Found**
   - Verify UUID values in environment
   - Ensure test data exists in database

3. **409 Conflict**
   - Clear duplicate timestamps
   - Reset check-in/check-out state

4. **500 Internal Server Error**
   - Check GPS service logs
   - Verify database connection
   - Ensure NATS service is running

### Debug Tips

1. Use Postman Console (View > Show Postman Console) for detailed logs
2. Check "Test Results" tab for failed assertions
3. Review response headers for additional error details
4. Use environment variables to avoid hardcoding values

## WebSocket Testing

For real-time features, use Postman's WebSocket support:

1. New > WebSocket Request
2. Connect to: `ws://localhost:3004/gps/realtime`
3. Send subscription message:
```json
{
    "action": "subscribe",
    "tripIds": ["323e4567-e89b-12d3-a456-426614174000"]
}
```

## Performance Testing

For load testing:

1. Use Collection Runner with multiple iterations
2. Set appropriate delays between requests
3. Monitor service metrics during test execution
4. Review response times in results

## Export Formats

The service supports three export formats:

- **CSV**: Spreadsheet-compatible format
- **JSON**: Structured data format
- **GPX**: GPS Exchange Format for tracking apps

## Best Practices

1. Always clean up test data after testing
2. Use meaningful variable names
3. Document any custom test scenarios
4. Keep environment variables updated
5. Run health check before test suite
6. Review all test results, not just status codes

## Support

For issues or questions:
- Check service logs: `docker logs gps-micro`
- Review API documentation
- Contact development team