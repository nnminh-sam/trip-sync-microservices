import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from 'src/models/location.model';
import { CreateLocationDto } from './dtos/create-location.dto';
import { UpdateLocationDto } from './dtos/update-location.dto';
import { AuthorizeClaimsPayloadDto } from 'src/modules/location/dtos/authorize-claims-payload.dto';
import { FilterLocationDto } from 'src/modules/location/dtos/filter-location.dto';
import { throwRpcException, paginateAndOrder } from 'src/utils';
import { ListDataDto } from 'src/dtos/list-data.dto';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async onStartUp(): Promise<void> {
  this.logger.log('[LocationService] onStartUp() called');
  // Thêm logic tùy bạn muốn: ví dụ seed location, validate config, preload cache...
}

  async authorizeClaims(payload: AuthorizeClaimsPayloadDto) {
    const { claims, required } = payload;
    const claimedRole = claims.role;

    if (!claimedRole) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid Token',
      });
    }

    // Simple role check (modify with full permission check if needed)
    if (!required.roles.includes(claimedRole)) {
      throwRpcException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Forbidden: Insufficient role',
      });
    }

    this.logger.log(
      `Authorized for user (${claims.email}) with role (${claims.role}) to perform action (${required.permission.action}) on resource (${required.permission.resource})`,
    );

    return true;
  }

  async create(dto: CreateLocationDto): Promise<Location> {
    try {
      const location = this.locationRepository.create(dto);
      const saved = await this.locationRepository.save(location);
      this.logger.log(`Location created with id: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error('Failed to create location', error.stack);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create location',
      });
    }
  }

  async findAll(filter: FilterLocationDto): Promise<ListDataDto<Location>> {
    const { name, sortBy, order, page, size } = filter;

    const [items, total] = await this.locationRepository.findAndCount({
      where: { ...(name && { name }) },
      ...paginateAndOrder({ page, size, sortBy, order }),
    });

    return ListDataDto.build<Location>({
      data: items,
      page,
      size,
      total,
    });
  }

  async findOne(id: string): Promise<Location> {
    const location = await this.locationRepository.findOne({ where: { id } });

    if (!location) {
      this.logger.warn(`Location not found: ${id}`);
      throwRpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Location not found',
      });
    }

    return location;
  }

  async update(id: string, dto: UpdateLocationDto): Promise<Location> {
    const location = await this.findOne(id);

    Object.assign(location, dto);
    try {
      const saved = await this.locationRepository.save(location);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to update location: ${id}`, error.stack);
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update location',
      });
    }
  }

 async remove(id: string): Promise<{ success: boolean; id: string }> {
    const location = await this.findOne(id);
    await this.locationRepository.remove(location);
    this.logger.log(`Location removed with id: ${id}`);
    return { success: true, id };
}
}
