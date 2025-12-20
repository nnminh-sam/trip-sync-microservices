import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class GetDataDto {
  @IsString()
  @IsNotEmpty({ message: 'Path is required' })
  path: string;
}

export class UpdateDataDto {
  @IsString()
  @IsNotEmpty({ message: 'Path is required' })
  path: string;

  @IsObject()
  @IsNotEmpty({ message: 'Data is required' })
  data: Record<string, any>;
}

export class DeleteDataDto {
  @IsString()
  @IsNotEmpty({ message: 'Path is required' })
  path: string;
}
