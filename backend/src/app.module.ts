import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { UserModule } from './user/user.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RecipeModule } from './recipe/recipe.module.js';
import { WeekPlanModule } from './weekplan/weekplan.module.js';
import { ShoppingListModule } from './shopping-list/shopping-list.module.js';
import { HealthScoreModule } from './health-score/health-score.module.js';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    AuthModule,
    RecipeModule,
    WeekPlanModule,
    ShoppingListModule,
    HealthScoreModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}