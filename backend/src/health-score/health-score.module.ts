import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthScoreController } from './health-score.controller.js';
import { HealthScoreService } from './health-score.service.js';

@Module({
  controllers: [HealthScoreController],
  providers: [HealthScoreService, PrismaService],
})
export class HealthScoreModule {}
