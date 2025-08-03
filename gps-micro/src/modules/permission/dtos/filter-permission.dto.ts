import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterPermissionDto extends BaseRequestFilterDto {
  action?: string;

  resource?: string;
}
