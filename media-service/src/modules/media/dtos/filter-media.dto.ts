export class FilterMediaDto {
  taskId?: string;
  uploaderId?: string;
  status?: string;
  page?: number = 1;
  pageSize?: number = 10;
}
