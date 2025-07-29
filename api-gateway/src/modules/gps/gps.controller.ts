import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { CreateGpsLogDto } from './dtos/create-gps-log.dto';
import { FilterGpsLogDto } from './dtos/filter-gps-log.dto';
import { GPSLog } from 'src/models';

@ApiBearerAuth()
@ApiTags('GPS Logs')
@Controller('gps-logs')
export class GpsController {
  constructor() {}

  @Get()
  @ApiOperation({ summary: 'List/filter GPS logs' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of GPS logs',
    isArray: true,
    model: GPSLog,
  })
  async findAll(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() payload: FilterGpsLogDto,
  ) {
    return { claims, payload };
  }

  @Post()
  @ApiOperation({ summary: 'Add a GPS log' })
  @ApiResponseConstruction({
    status: 201,
    description: 'GPS log created',
    model: GPSLog,
  })
  @ApiBody({ type: CreateGpsLogDto })
  async create(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() payload: CreateGpsLogDto,
  ) {
    return { claims, payload };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get GPS log details' })
  @ApiResponseConstruction({
    status: 200,
    description: 'GPS log details',
    model: GPSLog,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'GPS log ID',
  })
  async findOne(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return { claims, id };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete GPS log' })
  @ApiResponseConstruction({
    status: 204,
    description: 'GPS log deleted',
    model: GPSLog,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'GPS log ID',
  })
  async delete(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return { claims, id };
  }
}
