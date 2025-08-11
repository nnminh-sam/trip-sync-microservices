import { Controller, Delete, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseConstruction } from 'src/common/decorators/api-response-construction.decorator';
import { RequestUserClaims } from 'src/common/decorators/request-user-claims.decorator';
import { TokenClaimsDto } from 'src/dtos/token-claims.dto';
import { TaskProof } from 'src/models/task-proof.model';
import { TaskProofService } from 'src/modules/task-proof/task-proof.service';

@ApiBearerAuth()
@ApiTags('Proof')
@Controller('proofs')
export class TaskProofController {
  constructor(private readonly taskProofService: TaskProofService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get proof by ID' })
  @ApiResponseConstruction({
    status: 200,
    description: 'Proof details',
    model: TaskProof,
  })
  @ApiParam({ name: 'id', type: String })
  async findOne(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return await this.taskProofService.findOne(claims, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete proof' })
  @ApiResponseConstruction({
    status: 204,
    description: 'Proof deleted',
    model: TaskProof,
  })
  @ApiParam({ name: 'id', type: String })
  async delete(
    @RequestUserClaims() claims: TokenClaimsDto,
    @Param('id') id: string,
  ) {
    return await this.taskProofService.delete(claims, id);
  }
}
