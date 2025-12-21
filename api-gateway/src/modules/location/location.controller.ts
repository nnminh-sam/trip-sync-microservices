import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dtos/create-location.dto';
import { UpdateLocationDto } from './dtos/update-location.dto';
import { FilterLocationDto } from './dtos/filter-location.dto';
import { ValidateCoordinatesDto } from './dtos/validate-coordinates.dto';
import { DistanceQueryDto } from './dtos/distance-query.dto';
import { Location } from 'src/models';
import { NearbyLocationQueryDto } from 'src/modules/location/dtos';

@ApiTags('Location')
@Controller('locations')
@ApiBearerAuth()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // ==================== CRUD Operations ====================

  @Post()
  @ApiOperation({ summary: 'Create a new location' })
  @ApiBody({ type: CreateLocationDto })
  @ApiResponseConstruction({
    status: 201,
    description: 'Location created successfully',
    model: Location,
  })
  async create(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() createLocationDto: CreateLocationDto,
  ) {
    return await this.locationService.create(claims, createLocationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all locations with filtering' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of locations',
    model: Location,
    isArray: true,
  })
  async findAll(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() filterDto: FilterLocationDto,
  ) {
    return await this.locationService.findAll(claims, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location by ID' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Location details',
    model: Location,
  })
  async findOne(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return await this.locationService.findOne(claims, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update location' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiBody({ type: UpdateLocationDto })
  @ApiResponseConstruction({
    status: 200,
    description: 'Location updated successfully',
    model: Location,
  })
  async update(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return await this.locationService.update(claims, id, updateLocationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete location (soft delete)' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Location deleted successfully',
  })
  async delete(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return await this.locationService.delete(claims, id);
  }
}
