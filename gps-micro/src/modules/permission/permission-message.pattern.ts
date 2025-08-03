export class PermissionMessagePattern {
  static readonly CREATE = 'permission.create';
  static readonly FIND_ALL = 'permission.find_all';
  static readonly FIND_ONE = 'permission.find_one';
  static readonly FIND_BY_ACTION_RESOURCE =
    'permission.find_by_action_resource';
  static readonly UPDATE = 'permission.update';
  static readonly REMOVE = 'permission.remove';
  static readonly BULK_CREATE = 'permission.bulk_create';
}
