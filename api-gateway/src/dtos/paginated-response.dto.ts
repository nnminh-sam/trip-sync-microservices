export class PaginatedResponseDto<T> {
  data: T;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}
