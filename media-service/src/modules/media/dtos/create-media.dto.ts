export class CreateMediaDto {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  taskId?: string;
  description?: string;
  signatureData?: string; // GPG signature
}
