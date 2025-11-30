export class FilterMediaDto {
  taskId?: string;
  uploaderId?: string;
  status?: string;
  page?: number = 1;
  size?: number = 10;
}
