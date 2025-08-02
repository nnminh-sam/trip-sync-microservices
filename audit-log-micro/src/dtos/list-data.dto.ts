export class ListDataDto<T> {
  data: T[] = [];

  count: number;

  pagination: {
    page: number;
    size: number;
    totalPages: number;
  };

  static build<T>(options: {
    data: T[];
    page: number;
    size: number;
    total: number;
  }): ListDataDto<T> {
    const { data, page, size, total } = options;
    const totalPages = Math.ceil(total / size) || 1;
    const dto = new ListDataDto<T>();
    dto.data = data;
    dto.count = data.length;
    dto.pagination = {
      page,
      size,
      totalPages,
    };
    return dto;
  }
}
