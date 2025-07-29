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
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { CreateTripDto } from './dtos/create-trip.dto';
import { UpdateTripDto } from './dtos/update-trip.dto';
import { FilterTripDto } from './dtos/filter-trip.dto';
import { ApproveTripDto } from './dtos/approve-trip.dto';
import { Trip } from 'src/models';

@ApiBearerAuth()
@ApiTags('Trip')
@Controller('trips')
export class TripController {
  constructor() {}

  @Get()
  @ApiOperation({ summary: 'List/filter trips' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of trips',
    isArray: true,
    model: Trip,
  })
  async findAll(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() payload: FilterTripDto,
  ) {
    return { claims, payload };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new trip' })
  @ApiResponseConstruction({
    status: 201,
    description: 'Trip created',
    model: Trip,
  })
  @ApiBody({ type: CreateTripDto })
  async create(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() payload: CreateTripDto,
  ) {
    return { claims, payload };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trip details' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Trip details',
    model: Trip,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Trip ID',
  })
  async findOne(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return { claims, id };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update trip' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Trip updated',
    model: Trip,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Trip ID',
  })
  @ApiBody({ type: UpdateTripDto })
  async update(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() payload: UpdateTripDto,
  ) {
    return { claims, id, payload };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete/cancel trip' })
  @ApiResponseConstruction({
    status: 204,
    description: 'Trip deleted',
    model: Trip,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Trip ID',
  })
  async delete(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return { claims, id };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve trip' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Trip approved',
    model: Trip,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Trip ID',
  })
  @ApiBody({ type: ApproveTripDto })
  async approve(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() payload: ApproveTripDto,
  ) {
    return { claims, id, payload };
  }

  @Get(':id/locations')
  @ApiOperation({ summary: 'List trip locations' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of trip locations',
    isArray: true,
    model: Trip,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Trip ID',
  })
  async getLocations(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return { claims, id };
  }

  @Get(':id/approvals')
  @ApiOperation({ summary: 'List trip approvals' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of trip approvals',
    isArray: true,
    model: Trip,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Trip ID',
  })
  async getApprovals(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return { claims, id };
  }
}
