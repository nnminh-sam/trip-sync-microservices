import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterUserDto extends BaseRequestFilterDto {
  firstName: string;

  lastName: string;

  email: string;
}
