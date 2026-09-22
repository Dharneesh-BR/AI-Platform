import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public, type AuthenticatedUser } from '../../../../common/auth';
import {
  CreateSessionResult,
  CreateSessionUseCase,
} from '../../application/use-cases/create-session.use-case';
import { CreateSessionDto } from '../dto/create-session.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly createSessionUseCase: CreateSessionUseCase,
  ) {}

  @Public()
  @Post('session')
  createSession(@Body() dto: CreateSessionDto): Promise<CreateSessionResult> {
    return this.createSessionUseCase.execute({
      firebaseIdToken: dto.firebaseIdToken,
    });
  }

  @ApiBearerAuth()
  @Get('me')
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return {
      user,
      permissions: this.permissionsFor(),
    };
  }

  @ApiBearerAuth()
  @Post('logout')
  logout(): { success: true } {
    return { success: true };
  }

  private permissionsFor(): string[] {
    return ['project.manage', 'project.read', 'knowledge.manage', 'knowledge.upload', 'report.read', 'agent.use'];
  }
}
