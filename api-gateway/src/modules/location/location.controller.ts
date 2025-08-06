import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dtos/create-location.dto';
import { UpdateLocationDto } from './dtos/update-location.dto';
import { FilterLocationDto } from './dtos/filter-location.dto';
import { Location } from 'src/models/location.model';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';

@ApiTags('Location')
@Controller('locations')
@UsePipes(new ValidationPipe({ transform: true }))
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new location' })
  @ApiBody({ type: CreateLocationDto })
  @ApiResponseConstruction({
    status: 201,
    description: 'Location created',
    model: Location,
  })
  async create(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() dto: CreateLocationDto,
  ) {
    return this.locationService.create(claims, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of locations' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of locations',
    model: Location,
    isArray: true,
  })
  async findAll(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() filter: FilterLocationDto,
  ) {
    return this.locationService.findAll(claims, filter);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get location by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponseConstruction({
    status: 200,
    description: 'Location detail',
    model: Location,
  })
  async findOne(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return this.locationService.findOne(claims, id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update location' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateLocationDto })
  @ApiResponseConstruction({
    status: 200,
    description: 'Location updated',
    model: Location,
  })
  async update(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationService.update(claims, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete location' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponseConstruction({
    status: 204,
    description: 'Location deleted',
    model: Location,
  })
  async remove(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ): Promise<void> {
    await this.locationService.remove(claims, id);
  }
}
