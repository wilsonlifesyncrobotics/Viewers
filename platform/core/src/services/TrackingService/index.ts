// TrackingService moved to extensions/default/src/services/TrackingService.ts
// This is now using the new SyncForge API integration
// Export a placeholder to prevent import errors
export default null;
export const TRACKING_EVENTS = {
  TRACKING_STARTED: 'event::tracking_started',
  TRACKING_STOPPED: 'event::tracking_stopped',
  TRACKING_UPDATE: 'event::tracking_update',
  CONNECTION_STATUS: 'event::connection_status',
};
