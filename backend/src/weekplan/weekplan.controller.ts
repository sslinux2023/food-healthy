import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { WeekPlanService } from './weekplan.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('weekplan')
export class WeekPlanController {
  constructor(private readonly weekPlanService: WeekPlanService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generate(@Req() req: Request & { user: { id: string } }) {
    return this.weekPlanService.generate(Number(req.user.id));
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCurrent(@Req() req: Request & { user: { id: string } }) {
    return this.weekPlanService.getCurrent(Number(req.user.id));
  }
}
