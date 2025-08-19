<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Task Microservice - Part of the Trip Sync business trip management system. This microservice handles task-related operations for employee work trips and reporting.

## Overview

The Task Microservice is responsible for managing work tasks during business trips, including:
- Task creation and assignment within trips
- Progress tracking and status updates  
- Evidence attachment (photos, videos, documents)
- Task completion reporting with proof of work
- Integration with Google Cloud Storage for media files

## Business Context

This service supports **business trip management** for organizations tracking employee work outside the office:

### Mobile App Features (Employees)
- **Task Progress Updates**: Report objectives achieved, ongoing work, cancellation proposals
- **Evidence Documentation**: Upload photos/videos with location and timestamp as proof of work
- **Task Check-in/Check-out**: Mark task start and completion times
- **Auto-submission**: Automatic report generation based on task progress

### Web App Features (Managers)
- **Task Monitoring**: Track task status and completion rates
- **Evidence Review**: Access submitted photos, videos, and documents
- **Performance Analytics**: Analyze task efficiency and completion patterns
- **Data Export**: Generate reports in CSV/Excel format

## Key Features

- **Media Management**: Integration with Google Cloud Storage for evidence files
- **Real-time Updates**: Task status changes propagate to connected services
- **Validation**: Comprehensive input validation for all task operations
- **Audit Trail**: Complete history of task modifications and evidence submissions

## Environment Configuration

Create a `.env` file with the following variables:

```env
# Google Cloud Storage
GCS_PROJECT_ID=tripsync-466402
GCS_BUCKET_NAME=tripsync
GCS_KEY_FILE=secret.json
MAX_FILE_SIZE=20
ALLOWED_MIME_TYPES=png,jpg,jpeg,docx,doc

# Microservice Configuration
PORT=3002
RABBITMQ_URL=amqp://localhost:5672
```

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## API Endpoints

The Task Microservice uses message patterns for communication:

### Task Management
- `task.create` - Create a new task within a trip
- `task.update` - Update task details and status
- `task.delete` - Remove a task
- `task.findAll` - List tasks with filters
- `task.findOne` - Get specific task details

### Evidence & Reporting
- `task.upload-file` - Upload evidence files (photos/videos)
- `task.attach-evidence` - Link evidence to task
- `task.report` - Submit task completion report
- `task.progress` - Update task progress percentage

## Data Models

### Task Entity
```typescript
{
  id: string
  trip_id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  assignee_id: string
  created_by: string
  progress: number
  evidence_urls: string[]
  location: { lat: number, lng: number }
  check_in_time: Date
  check_out_time: Date
  completed_at: Date
  created_at: Date
  updated_at: Date
}
```

### Task Report
```typescript
{
  task_id: string
  objectives_achieved: string[]
  ongoing_work: string[]
  cancellation_reason?: string
  evidence_attachments: Array<{
    type: 'photo' | 'video' | 'document'
    url: string
    location: { lat: number, lng: number }
    timestamp: Date
  }>
  auto_submitted: boolean
  submitted_at: Date
}
```

## Integration Points

- **Trip Microservice**: Validates trip existence and permissions
- **User Microservice**: Authenticates users and manages roles
- **Report Microservice**: Aggregates task data for reporting
- **Google Cloud Storage**: Stores evidence files and media

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## License

MIT
