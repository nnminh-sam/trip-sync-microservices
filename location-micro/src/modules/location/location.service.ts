import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateLocationDto } from 'src/modules/location/dtos/create-location.dto';
import { FilterLocationDto } from 'src/modules/location/dtos/filter-location.dto';
import { UpdateLocationDto } from 'src/modules/location/dtos/update-location.dto';
import { paginateAndOrder, throwRpcException } from 'src/utils';
import { ILike, Repository } from 'typeorm';
import { Location } from 'src/models/location.model';
import { ListDataDto } from 'src/dtos/list-data.dto';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    private readonly logger: Logger,
  ) {
    this.logger = new Logger(LocationService.name);
  }

  async create(payload: CreateLocationDto) {
    try {
      const location = this.locationRepository.create(payload);
      const createdLocation = await this.locationRepository.save(location);
      return createdLocation;
    } catch (error: any) {
      this.logger.error('Cannot create location:', error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Server unavailable',
      });
    }
  }

  async findAll(payload: FilterLocationDto) {
    const {
      page,
      size,
      order,
      sortBy,
      name,
      latitude,
      longitude,
      location,
      createdBy,
    } = payload;

    const [locations, total] = await this.locationRepository.findAndCount({
      where: {
        ...(name && { name: ILike(`%${name}%`) }),
        ...(latitude && { latitude }),
        ...(longitude && { longitude }),
        ...(location && { location: ILike(`%${location}%`) }),
        ...(createdBy && { createdBy }),
      },
      ...paginateAndOrder({
        page,
        size,
        order,
        sortBy,
      }),
    });

    return ListDataDto.build<Location>({
      data: locations,
      total,
      page,
      size,
    });
  }

  async findOne(id: string) {
    const location = await this.locationRepository.findOne({
      where: { id },
    });

    if (!location) {
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Location not found',
      });
    }

    return location;
  }

  async update(id: string, payload: UpdateLocationDto) {
    const { name, latitude, longitude, offsetRadious, location } = payload;
    const existingLocation = await this.findOne(id);
    if (name) {
      existingLocation.name = name;
    }
    if (latitude) {
      existingLocation.latitude = latitude;
    }
    if (longitude) {
      existingLocation.longitude = longitude;
    }
    if (offsetRadious) {
      existingLocation.offsetRadious = offsetRadious;
    }
    if (location) {
      existingLocation.location = location;
    }
    try {
      const updatedLocation =
        await this.locationRepository.save(existingLocation);
      return updatedLocation;
    } catch (error: any) {
      this.logger.error('Cannot update location:', error);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Server unavailable',
      });
    }
  }

  async delete(id: string) {
    const existingLocation = await this.findOne(id);
    try {
      // TODO: implement deleted at field
    } catch (error: any) {
      this.logger.error('Cannot delete location:', error);
    }
  }
}
