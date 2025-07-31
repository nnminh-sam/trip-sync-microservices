import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { Location } from 'src/models/location.model';
import { CreateLocationDto } from './dtos/create-location.dto';
import { FindLocationsDto } from './dtos/find-locations.dto';
import { UpdateLocationDto } from './dtos/update-location.dto';
import { LocationService } from './location.service';

@ApiTags('Location')
@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new location' })
  @ApiResponseConstruction({
    status: HttpStatus.CREATED,
    description: 'Location created successfully',
    model: Location,
  })
  @ApiBody({ type: CreateLocationDto })
  async create(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() createLocationDto: CreateLocationDto,
  ) {
    return await this.locationService.create(claims, createLocationDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List/filter locations' })
  @ApiResponseConstruction({
    status: HttpStatus.OK,
    description: 'List of locations',
    model: Location,
    isArray: true,
  })
  async find(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() findLocationsDto: FindLocationsDto,
  ) {
    return await this.locationService.find(claims, findLocationsDto);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get location details' })
  @ApiResponseConstruction({
    status: HttpStatus.OK,
    description: 'Location details',
    model: Location,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Location ID' })
  async findOne(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return await this.locationService.findOne(claims, id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update location' })
  @ApiResponseConstruction({
    status: HttpStatus.OK,
    description: 'Location updated successfully',
    model: Location,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Location ID' })
  @ApiBody({ type: UpdateLocationDto })
  async update(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return await this.locationService.update(claims, id, updateLocationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete location' })
  @ApiResponseConstruction({
    status: HttpStatus.NO_CONTENT,
    description: 'Location deleted successfully',
    model: Location,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Location ID' })
  async remove(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return await this.locationService.remove(claims, id);
  }
}
