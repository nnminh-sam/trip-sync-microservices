import { PartialType } from '@nestjs/mapped-types';
import { CreateLocationDto } from './create-location.dto';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLocationDto extends PartialType(CreateLocationDto) {
    @ApiPropertyOptional({ description: 'Name', example: 'Hai Phong' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Address', example: '123 Le Loi' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ description: 'Latitude', example: 20.8449 })
    @IsOptional()
    @IsNumber()
    latitude?: number;

    @ApiPropertyOptional({ description: 'Longitude', example: 106.6881 })
    @IsOptional()
    @IsNumber()
    longitude?: number;

    @ApiPropertyOptional({ description: 'Description', example: 'City in northern Vietnam' })
    @IsOptional()
    @IsString()
    description?: string;
}
