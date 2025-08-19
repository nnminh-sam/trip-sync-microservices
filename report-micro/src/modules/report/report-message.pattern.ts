export class ReportMessagePattern {
  static readonly TRIP_SUMMARY = 'report.trip_summary';
  static readonly TASK_COMPLETION = 'report.task_completion';
  
  // Task Report Patterns
  static readonly TASK_DETAILED = 'report.task.detailed';
  static readonly TASK_SUBMIT = 'report.task.submit';
  static readonly TASK_EVIDENCE = 'report.task.evidence';
  
  // Location Report Patterns
  static readonly LOCATION_TRACK = 'report.location.track';
  static readonly LOCATION_HISTORY = 'report.location.history';
  static readonly LOCATION_LIVE = 'report.location.live';
  static readonly LOCATION_CHECK_IN = 'report.location.check_in';
  static readonly LOCATION_CHECK_OUT = 'report.location.check_out';
  
  // Export Patterns
  static readonly EXPORT_TRIPS = 'report.export.trips';
  static readonly EXPORT_TASKS = 'report.export.tasks';
  static readonly EXPORT_AGGREGATE = 'report.export.aggregate';
  
  // Dashboard Patterns
  static readonly DASHBOARD_SUMMARY = 'report.dashboard.summary';
  static readonly DASHBOARD_PERFORMANCE = 'report.dashboard.performance';
  
  // Aggregation Patterns
  static readonly AGGREGATE_TRIPS = 'report.aggregate.trips';
  static readonly AGGREGATE_TASKS = 'report.aggregate.tasks';
}
