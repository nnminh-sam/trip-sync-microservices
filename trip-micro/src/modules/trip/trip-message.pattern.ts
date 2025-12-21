export class TripMessagePattern {
  static readonly CREATE = 'trip.create';
  static readonly FIND_ALL = 'trip.find';
  static readonly FIND_ONE = 'trip.find_one';
  static readonly UPDATE = 'trip.update';
  static readonly DELETE = 'trip.delete';
  static readonly APPROVE = 'trip.approve';
  static readonly REQUEST_CANCEL = 'trip.request_cancel';
  static readonly RESOLVE_CANCEL = 'trip.resolve_cancel';
  static readonly GET_CANCELATIONS = 'trip.get_cancelations';
  static readonly LOCATIONS = 'trip.locations';
  static readonly APPROVALS = 'trip.approvals';
  static readonly CHECK_IN = 'trip.location.check_in';
  static readonly CHECK_OUT = 'trip.location.check_out';
}
