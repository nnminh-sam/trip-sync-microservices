import {
  Controller,
  Get,
  Post,
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
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDto } from './dtos/create-evaluation.dto';
import { FilterEvaluationDto } from './dtos/filter-evaluation.dto';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';

@ApiTags('Evaluation')
@Controller('evaluations')
@UsePipes(new ValidationPipe({ transform: true }))
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new trip evaluation' })
  @ApiBody({ type: CreateEvaluationDto })
  @ApiResponseConstruction({
    status: 201,
    description: 'Evaluation created successfully',
  })
  async create(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Body() dto: CreateEvaluationDto,
  ) {
    return this.evaluationService.create(claims, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of evaluations with filters' })
  @ApiResponseConstruction({
    status: 200,
    description: 'List of evaluations',
    isArray: true,
  })
  async findAll(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Query() filter: FilterEvaluationDto,
  ) {
    return this.evaluationService.findAll(claims, filter);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get evaluation by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponseConstruction({
    status: 200,
    description: 'Evaluation detail',
  })
  async findOne(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return this.evaluationService.findOne(claims, id);
  }
}
