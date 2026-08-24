import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CreateSessionUseCase } from './application/use-cases/create-session.use-case';
import { CreateDevSessionUseCase } from './application/use-cases/create-dev-session.use-case';
import { IDENTITY_PROVIDER } from './application/ports/identity-provider.port';
import { PLATFORM_TOKEN_SERVICE } from './application/ports/platform-token.port';
import { USER_SESSION_REPOSITORY } from './application/ports/user-session.repository';
import { FirebaseIdentityProvider } from './infrastructure/external/firebase-identity.provider';
import { JwtPlatformTokenService } from './infrastructure/external/jwt-platform-token.service';
import { PrismaUserSessionRepository } from './infrastructure/prisma/prisma-user-session.repository';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(configService.get<string>('JWT_EXPIRES_IN_SECONDS') ?? 3600),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    CreateSessionUseCase,
    CreateDevSessionUseCase,
    {
      provide: IDENTITY_PROVIDER,
      useClass: FirebaseIdentityProvider,
    },
    {
      provide: PLATFORM_TOKEN_SERVICE,
      useClass: JwtPlatformTokenService,
    },
    {
      provide: USER_SESSION_REPOSITORY,
      useClass: PrismaUserSessionRepository,
    },
  ],
  exports: [JwtModule],
})
export class AuthModule {}
