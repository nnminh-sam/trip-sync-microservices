export const ReportMessagePattern = {
  // Existing patterns
  tripSummary: 'report.trip_summary',
  taskCompletion: 'report.task_completion',
  
  // Task Report Patterns
  taskDetailed: 'report.task.detailed',
  taskSubmit: 'report.task.submit',
  taskEvidence: 'report.task.evidence',
  
  // Location Report Patterns
  locationTrack: 'report.location.track',
  locationHistory: 'report.location.history',
  locationLive: 'report.location.live',
  locationCheckIn: 'report.location.check_in',
  locationCheckOut: 'report.location.check_out',
  
  // Export Patterns
  exportTrips: 'report.export.trips',
  exportTasks: 'report.export.tasks',
  exportAggregate: 'report.export.aggregate',
  
  // Dashboard Patterns
  dashboardSummary: 'report.dashboard.summary',
  dashboardPerformance: 'report.dashboard.performance',
  
  // Aggregation Patterns
  aggregateTrips: 'report.aggregate.trips',
  aggregateTasks: 'report.aggregate.tasks',
} as const;
