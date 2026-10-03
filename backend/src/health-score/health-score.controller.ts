import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { HealthScoreService } from './health-score.service.js';

@Controller('health-score')
@UseGuards(JwtAuthGuard)
export class HealthScoreController {
  constructor(private readonly healthScoreService: HealthScoreService) {}

  @Get()
  getTodayScore(
    @Req() req: { user: { id: string } },
    @Query('date') localDate?: string,
  ) {
    return this.healthScoreService.getTodayScore(Number(req.user.id), localDate);
  }

  @Get('history')
  getHistory(@Req() req: { user: { id: string } }) {
    return this.healthScoreService.getHistory(Number(req.user.id));
  }
}
