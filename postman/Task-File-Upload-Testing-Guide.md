# Task File Upload API Testing Guide

## Overview
This guide provides instructions for testing the Task File Upload functionality using the provided Postman collection.

## Prerequisites

1. **Services Running**
   - API Gateway: `http://localhost:3000`
   - Task Microservice with Google Cloud Storage configured
   - NATS message broker

2. **Google Cloud Storage Setup**
   - Valid GCS credentials file (`gcs-credentials.json`)
   - Created GCS bucket
   - Proper environment variables configured

3. **Test Files**
   - Prepare sample files for testing:
     - Small image files (JPEG, PNG, GIF) < 10MB
     - PDF documents < 10MB
     - Word documents (.doc, .docx) < 10MB
     - Invalid file for testing (e.g., .exe file)
     - Large file > 10MB for testing size limit

## Setup Instructions

### 1. Import Collection and Environment

1. Open Postman
2. Click "Import" button
3. Select both files:
   - `Task-File-Upload-APIs.postman_collection.json`
   - `Task-File-Upload-APIs.postman_environment.json`
4. Click "Import"

### 2. Configure Environment

1. Go to Environments → Task File Upload Environment
2. Update the following variables:
   - `base_url`: Your API Gateway URL (default: `http://localhost:3000`)
   - `test_email`: Valid test user email
   - `test_password`: Valid test user password
   - `trip_location_id`: Valid trip location ID from your database

### 3. Prepare Test Files

Create a test folder with the following files:
```
/test-files/
  ├── sample-image.jpg      (< 1MB)
  ├── sample-document.pdf   (< 5MB)
  ├── sample-doc.docx       (< 2MB)
  ├── large-file.zip        (> 10MB)
  └── invalid-file.exe      (any size)
```

## Testing Workflow

### Step 1: Authentication
1. Run **Authentication → Login**
   - Verify access token is saved to environment
   - Check response time < 500ms

### Step 2: Create Test Task
1. Run **Task Management → Create Task**
   - A unique task title is auto-generated
   - Task ID is saved for subsequent requests
   - Verify task creation with correct properties

2. Run **Task Management → Get Task Details**
   - Confirm task was created successfully
   - Verify all task fields are present

### Step 3: File Upload Operations

#### Single File Upload
1. Run **File Upload Operations → Upload Single File**
   - Select a test file using the file selector
   - Add optional description
   - Verify response contains:
     - File ID
     - GCS URL
     - Public URL
     - Correct MIME type

#### Multiple Files Upload
1. Run **File Upload Operations → Upload Multiple Files**
   - Select multiple files (max 10)
   - Verify array response with all file details
   - Check each file has correct task_id

#### List Files
1. Run **File Upload Operations → List Task Files**
   - Verify all uploaded files are listed
   - Check file metadata (name, size, contentType)

#### Generate Signed URL
1. Run **File Upload Operations → Get Signed URL**
   - Verify signed URL is generated
   - Check URL contains Google Cloud Storage domain
   - Test URL expiration parameter

#### Delete File
1. Run **File Upload Operations → Delete File**
   - Verify successful deletion message
   - Confirm file is removed from GCS

### Step 4: Error Testing

Test error handling with the following scenarios:

1. **Invalid File Type**
   - Upload a .exe file
   - Expect 400 error with "not allowed" message

2. **Oversized File**
   - Upload file > 10MB
   - Expect 400 error with "exceeds maximum" message

3. **Non-existent Task**
   - Upload to invalid task ID
   - Expect 404 error

4. **Non-existent File Deletion**
   - Delete non-existent file
   - Expect 404 or 500 error

### Step 5: Cleanup
1. Run **Cleanup → Delete Test Task**
   - Removes test task and associated files
   - Cleans up environment variables

## Test Assertions

Each request includes automated tests that verify:

### Response Status Codes
- 200: Successful GET operations
- 201: Successful creation (upload)
- 400: Bad request (invalid file)
- 404: Resource not found
- 401: Unauthorized (if no token)

### Response Data Validation
- File upload returns complete file metadata
- List operations return arrays
- Signed URLs contain valid GCS parameters
- Error responses include descriptive messages

### Performance Tests
- Response time < 2000ms for all operations
- Login response < 500ms

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify user credentials in environment
   - Check API Gateway is running
   - Ensure auth service is accessible

2. **File Upload Fails**
   - Check GCS credentials are configured
   - Verify bucket exists and is accessible
   - Ensure file size is within limits
   - Confirm MIME type is allowed

3. **404 Errors**
   - Verify task_id exists in database
   - Check file paths are correct
   - Ensure services are running

4. **Network Errors**
   - Verify all microservices are running
   - Check NATS connection
   - Confirm ports are not blocked

### Debug Tips

1. **Enable Postman Console**
   - View → Show Postman Console
   - See detailed request/response logs

2. **Check Environment Variables**
   - Verify tokens are being saved
   - Check auto-populated values

3. **Review Test Results**
   - Click "Test Results" tab after each request
   - Check which assertions are failing

## Advanced Testing

### Load Testing
1. Use Postman Collection Runner
2. Set iterations for bulk testing
3. Upload different file combinations

### Security Testing
1. Test with expired tokens
2. Try accessing other users' files
3. Test path traversal attempts

### Integration Testing
1. Upload files through API
2. Verify files in GCS console
3. Check database records
4. Test file persistence after service restart

## Environment Variables Reference

| Variable | Description | Auto-populated |
|----------|-------------|----------------|
| `base_url` | API Gateway URL | No |
| `test_email` | User email for auth | No |
| `test_password` | User password | No |
| `access_token` | JWT token | Yes (after login) |
| `task_id` | Current test task | Yes (after creation) |
| `uploaded_filename` | Last uploaded file | Yes (after upload) |
| `trip_location_id` | Trip location for task | No |

## Best Practices

1. **Reset Environment**: Clear variables between test runs
2. **Use Fresh Data**: Generate unique task titles
3. **Clean Up**: Always run cleanup after testing
4. **Monitor Resources**: Check GCS storage usage
5. **Log Results**: Export test results for documentation

## Support

For issues or questions:
1. Check service logs for detailed errors
2. Verify GCS permissions and quotas
3. Review API documentation
4. Check network connectivity between services