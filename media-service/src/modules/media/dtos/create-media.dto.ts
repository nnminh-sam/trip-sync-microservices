export class CreateMediaDto {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  gcsUrl: string;
  publicUrl: string;
  metadata?: string;
  signatureVerified?: boolean;
  signatureData?: string;
}
