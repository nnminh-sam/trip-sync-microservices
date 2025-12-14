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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { TripService } from './trip.service';
import { CreateTripDto } from './dtos/create-trip.dto';
import { UpdateTripDto } from './dtos/update-trip.dto';
import { FilterTripDto } from './dtos/filter-trip.dto';
import { ApproveTripDto } from './dtos/approve-trip.dto';
import { Trip } from 'src/models/trip.model';
import { TripApproval } from 'src/models/trip-approval.model';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { CheckInAtLocationDto } from './dtos/check-in-at-location.dto';

@ApiTags('Trip')
@Controller('trips')
@UsePipes(new ValidationPipe({ transform: true }))
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new trip' })
  @ApiBody({ type: CreateTripDto })
  @ApiResponseConstruction({
    status: 201,
    description: 'Trip created',
    model: Trip,
  })
  async create(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() dto: CreateTripDto,
  ) {
    return this.tripService.create(claims, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of trips' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of trips',
    model: Trip,
    isArray: true,
  })
  async findAll(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() filter: FilterTripDto,
  ) {
    return this.tripService.findAll(claims, filter);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get trip by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponseConstruction({
    status: 200,
    description: 'Trip detail',
    model: Trip,
  })
  async findOne(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return this.tripService.findOne(claims, id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update trip' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateTripDto })
  @ApiResponseConstruction({
    status: 200,
    description: 'Trip updated',
    model: Trip,
  })
  async update(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
    @Body() dto: UpdateTripDto,
  ) {
    return this.tripService.update(claims, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete trip' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponseConstruction({
    status: 204,
    description: 'Trip deleted',
    model: Trip,
  })
  async remove(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ): Promise<void> {
    await this.tripService.remove(claims, id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a trip' })
  @ApiBody({ type: ApproveTripDto })
  @ApiResponseConstruction({
    status: 201,
    description: 'Trip approval created',
    model: TripApproval,
  })
  async approveTrip(
    @Param('id') id: string,
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() dto: ApproveTripDto,
  ) {
    return this.tripService.approveTrip(id, claims, dto);
  }

  @Patch('/locations/check-in')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check-in at location' })
  @ApiBody({ type: CheckInAtLocationDto })
  @ApiResponseConstruction({
    status: 200,
    description: 'Check-in success',
  })
  async checkInAtLocation(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() dto: CheckInAtLocationDto,
  ) {
    return await this.tripService.checkInAtLocation(claims, dto);
  }
}
