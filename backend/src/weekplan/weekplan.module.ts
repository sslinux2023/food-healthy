import { Module } from '@nestjs/common';
import { WeekPlanController } from './weekplan.controller.js';
import { WeekPlanService } from './weekplan.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [WeekPlanController],
  providers: [WeekPlanService, PrismaService],
})
export class WeekPlanModule {}
