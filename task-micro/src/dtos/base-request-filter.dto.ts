export class BaseRequestFilterDto {
  sortBy: string;

  order: 'asc' | 'desc';

  page: number;

  size: number;
}
