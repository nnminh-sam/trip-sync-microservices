import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { FilterAuditLogDto } from './dtos/filter-audit-log.dto';
import { AuditLog } from 'src/models';
import { CreateAuditLogDto } from 'src/modules/audit/dtos/create-audit-log.dto';
import { AuditService } from 'src/modules/audit/audit.service';

@ApiBearerAuth()
@ApiTags('Audit Logs')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  @ApiOperation({ summary: 'Create an audit log' })
  @ApiResponseConstruction({
    status: 201,
    description: 'Audit log created successfully',
    model: AuditLog,
  })
  async create(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() createAuditLogDto: CreateAuditLogDto,
  ) {
    return this.auditService.create(createAuditLogDto);
  }

  @Get()
  @ApiOperation({ summary: 'List/filter audit logs' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of audit logs',
    isArray: true,
    model: AuditLog,
  })
  async findAll(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() payload: FilterAuditLogDto,
  ) {
    return this.auditService.findAll(payload);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log details' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Audit log details',
    model: AuditLog,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Audit log ID',
  })
  async findOne(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return this.auditService.findById(id);
  }
}
