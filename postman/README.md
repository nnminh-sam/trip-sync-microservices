# Location APIs Postman Collection

## Overview
This Postman collection provides comprehensive testing for all Location Service API endpoints in the Trip Sync system.

## Setup Instructions

### 1. Import Collection and Environment
1. Open Postman
2. Click "Import" button
3. Import both files:
   - `Location-APIs.postman_collection.json` - The API collection
   - `Location-APIs.postman_environment.json` - Environment variables

### 2. Configure Environment
1. Select "Location API Environment" from the environment dropdown
2. Update the following variables as needed:
   - `base_url`: Your API gateway URL (default: `http://localhost:3000`)
   - `access_token`: Your JWT token (obtain from authentication endpoint)

### 3. Authentication
Before running any tests, you need to set your JWT access token:
1. Login to the system and obtain your access token
2. Set the `access_token` variable in the environment
3. The token will be automatically added to all requests

## Collection Structure

The collection is organized into folders by functionality:

### 📁 CRUD Operations
- **Create Location** - Creates a new location and saves the ID for subsequent tests
- **Get All Locations** - Retrieves locations with pagination and filtering
- **Get Location by ID** - Fetches a specific location
- **Update Location** - Updates location details
- **Delete Location** - Soft deletes a location

### 📁 Check-in/Check-out Operations
- **Validate Coordinates** - Checks if coordinates are within location radius
- **Validate Batch** - Validates multiple location-coordinate pairs

### 📁 GPS and Distance Operations
- **Find Nearby Locations** - Finds locations near coordinates (cached)
- **Find Within Radius** - Finds all locations within specific radius
- **Calculate Distance** - Calculates distance between two points
- **Distance from Location** - Gets distance from coordinates to a location

### 📁 Area and Boundary Operations
- **Find in Area** - Finds locations within geographical bounds
- **Find Nearest** - Finds N nearest locations
- **Check Boundary** - Checks if point is within location boundary
- **Get Boundaries** - Retrieves boundary information

### 📁 Batch Operations
- **Find by IDs** - Retrieves multiple locations by IDs

### 📁 Health Check
- **Health Status** - Checks service health and dependencies

## Running Tests

### Run Individual Request
1. Navigate to the desired request
2. Click "Send"
3. View response and test results in the "Test Results" tab

### Run Entire Collection
1. Click the "Runner" button in Postman
2. Select "Location APIs" collection
3. Choose environment "Location API Environment"
4. Configure iterations and delay if needed
5. Click "Run Location APIs"

### Run Specific Folder
1. Right-click on any folder (e.g., "CRUD Operations")
2. Select "Run folder"
3. Configure run settings
4. Click "Run"

## Test Features

### Automatic Tests
Each request includes automated tests that verify:
- HTTP status codes
- Response structure
- Required fields presence
- Data types
- Response time (< 2 seconds)

### Dynamic Variables
The collection uses variables that are automatically set:
- `location_id` - Set after creating a location, used in subsequent tests
- Collection variables for test coordinates and configuration

### Pre-request Scripts
- Validates authentication token presence
- Logs request details for debugging

### Test Scripts
- Validates response structure
- Stores dynamic values for chaining requests
- Performs assertions on business logic

## Test Data

### Default Test Coordinates (Ho Chi Minh City)
- Latitude: 10.7769331
- Longitude: 106.7009238

### Location Types
- `office` - Office buildings
- `client` - Client locations
- `warehouse` - Storage facilities
- `field` - Field locations
- `other` - Other location types

## Troubleshooting

### Authentication Errors (401)
- Ensure `access_token` is set in environment
- Verify token hasn't expired
- Obtain new token if needed

### Location Not Found (404)
- Run "Create Location" first to generate a test location
- Check `location_id` variable is set

### Connection Errors
- Verify `base_url` is correct
- Ensure API gateway is running
- Check network connectivity

### Validation Failures
- Review request body for required fields
- Check data types match schema
- Verify coordinates are within valid ranges

## Best Practices

1. **Run in Order**: For first-time setup, run requests in order as some depend on others
2. **Clean Up**: Delete test locations after testing to keep database clean
3. **Use Variables**: Leverage environment variables for different environments
4. **Check Tests**: Always review test results tab for validation details
5. **Monitor Performance**: Watch response times for performance issues

## Advanced Usage

### Custom Test Scenarios
You can duplicate and modify requests to create custom test scenarios:
1. Right-click on any request
2. Select "Duplicate"
3. Modify the request body/parameters
4. Update tests as needed

### Data-Driven Testing
Use CSV files with Postman Runner for bulk testing:
1. Create CSV with test data
2. Reference CSV variables in requests
3. Run collection with data file

### CI/CD Integration
Run tests in CI/CD pipeline using Newman:
```bash
npm install -g newman
newman run Location-APIs.postman_collection.json \
  -e Location-APIs.postman_environment.json \
  --env-var "access_token=YOUR_TOKEN"
```

## Support
For issues or questions about the Location Service API, refer to:
- API Documentation: `/docs/location-service-api.md`
- System Requirements: `/docs/requirements.md`
- System Design: `/docs/system-analysis-and-design.md`