import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { ExportLog } from 'src/models/export-log.model';
import { CreateExportDto } from './dtos/create-export.dto';

@ApiBearerAuth()
@ApiTags('Export')
@Controller('exports')
export class ExportController {
  constructor() {}

  @Get(':id')
  @ApiOperation({ summary: 'Get export file by ID' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Get export result',
    model: ExportLog,
  })
  @ApiParam({ name: 'id', type: String })
  async findOne(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return { claims, id };
  }

  @Post()
  @ApiOperation({ summary: 'Request export (CSV/Excel)' })
  @ApiResponseConstruction({
    status: 201,
    description: 'Export request created',
    model: ExportLog,
  })
  @ApiBody({ type: CreateExportDto })
  async create(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() payload: CreateExportDto,
  ) {
    return { claims, payload };
  }
}
