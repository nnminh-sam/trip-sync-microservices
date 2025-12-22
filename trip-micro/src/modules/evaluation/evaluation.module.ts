import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripEvaluation } from 'src/models/trip-evaluation.model';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { TripModule } from '../trip/trip.module';

@Module({
  imports: [TypeOrmModule.forFeature([TripEvaluation]), TripModule],
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
