export const GPSMessagePattern = {
  // GPS Tracking
  trackGPS: 'gps.track',
  batchTrackGPS: 'gps.track.batch',
  getTripRoute: 'gps.route.trip',
  
  // Check-in/Check-out
  checkIn: 'gps.checkIn',
  checkOut: 'gps.checkOut',
  getCheckInOutHistory: 'gps.checkInOut.history',
  
  // Location Validation
  validateLocation: 'gps.validate.location',
  batchValidateLocations: 'gps.validate.batch',
  getNearbyLocations: 'gps.nearby.locations',
  
  // Route Analysis
  detectStops: 'gps.route.stops',
  getRouteStatistics: 'gps.route.statistics',
  simplifyRoute: 'gps.route.simplify',
  
  // Analytics
  getTripStatistics: 'gps.analytics.trip',
  getUserAnalytics: 'gps.analytics.user',
  getAnalyticsSummary: 'gps.analytics.summary',
  getMostVisitedLocations: 'gps.analytics.mostVisited',
  
  // Real-time
  getRealtimeLocations: 'gps.realtime.locations',
  getLatestLocation: 'gps.realtime.latest',
  subscribeToTrip: 'gps.realtime.subscribe',
  unsubscribeFromTrip: 'gps.realtime.unsubscribe',
  
  // Export
  createExport: 'gps.export.create',
  getExportStatus: 'gps.export.status',
  downloadExport: 'gps.export.download',
  listExports: 'gps.export.list',
  
  // Health
  health: 'gps.health',
} as const;