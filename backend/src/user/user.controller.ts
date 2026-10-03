import * as bcrypt from 'bcrypt';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
  Patch,
  Query,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto.js';
import { UpdateCheckInDto } from './dto/update-check-in.dto.js';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Patch('onboarding')
  async completeOnboarding(
    @Req() req: { user: { id: string } },
    @Body() dto: UpdateOnboardingDto,
  ) {
    return this.userService.updateOnboarding(Number(req.user.id), dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('checkin')
  async getTodayCheckIn(
    @Req() req: { user: { id: string } },
    @Query('date') localDate?: string,
  ) {
    return this.userService.getTodayCheckIn(Number(req.user.id), localDate);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('checkin')
  async updateTodayCheckIn(
    @Req() req: { user: { id: string } },
    @Body() dto: UpdateCheckInDto,
  ) {
    return this.userService.updateTodayCheckIn(Number(req.user.id), dto);
  }

  @Post('register')
  async register(@Body() body: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(body.password, 10);
    try {
      const user = await this.userService.create({
        ...body,
        password: hashedPassword,
      });
      const token = this.authService.generateToken(user);
      return {
        access_token: token,
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
        bmi: user.bmi,
        dailyCalories: user.dailyCalories,
        tdee: user.tdee,
        goal: user.goal,
        height: user.height,
        weight: user.weight,
        idealWeightMax: user.idealWeightMax,
        proteinGrams: user.proteinGrams,
        carbGrams: user.carbGrams,
        fatGrams: user.fatGrams,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Registration failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.userService.findByEmail(body.email);
    if (!user)
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    const isMatch = await bcrypt.compare(body.password, user.password);
    if (!isMatch)
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    const token = this.authService.generateToken(user);
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
        bmi: user.bmi,
        dailyCalories: user.dailyCalories,
        tdee: user.tdee,
        goal: user.goal,
        height: user.height,
        weight: user.weight,
        idealWeightMax: user.idealWeightMax,
        proteinGrams: user.proteinGrams,
        carbGrams: user.carbGrams,
        fatGrams: user.fatGrams,
      },
    };
  }

  // ⭐ MUST come before @Get(':id') — otherwise ':id' matches 'me'
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: { user: { id: string } }) {
    return this.userService.findMe(Number(req.user.id));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }
}