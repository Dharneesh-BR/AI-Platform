import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public, type AuthenticatedUser } from '../../../../common/auth';
import {
  CreateDevSessionUseCase,
} from '../../application/use-cases/create-dev-session.use-case';
import {
  CreateSessionResult,
  CreateSessionUseCase,
} from '../../application/use-cases/create-session.use-case';
import { CreateDevSessionDto } from '../dto/create-dev-session.dto';
import { CreateSessionDto } from '../dto/create-session.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly createSessionUseCase: CreateSessionUseCase,
    private readonly createDevSessionUseCase: CreateDevSessionUseCase,
  ) {}

  @Public()
  @Post('session')
  createSession(@Body() dto: CreateSessionDto): Promise<CreateSessionResult> {
    return this.createSessionUseCase.execute({
      firebaseIdToken: dto.firebaseIdToken,
    });
  }

  @Public()
  @Post('dev-session')
  createDevSession(@Body() dto: CreateDevSessionDto): Promise<CreateSessionResult> {
    return this.createDevSessionUseCase.execute({
      role: dto.role,
    });
  }

  @ApiBearerAuth()
  @Get('me')
  getCurrentUser(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  @ApiBearerAuth()
  @Post('logout')
  logout(): { success: true } {
    return { success: true };
  }
}
