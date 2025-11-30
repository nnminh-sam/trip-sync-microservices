export class CreateMediaDto {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  gcsUrl: string;
  publicUrl: string;
  taskId?: string;
  status?: string;
  description?: string;
  signatureVerified?: boolean;
  signatureData?: string; // GPG signature
}
