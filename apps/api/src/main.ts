import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService, { strict: false });
  const configuredCorsOrigin = configService?.get<string>('CORS_ORIGIN');
  const defaultCorsOrigins = [
    'https://magnafic.ai',
    'https://www.magnafic.ai',
    'https://magnaficaidplatform.netlify.app',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  const corsOrigin = [
    ...defaultCorsOrigins,
    ...(configuredCorsOrigin
      ? configuredCorsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean)
      : []),
  ];

  app.use(helmet());
  app.enableCors({ origin: corsOrigin, credentials: true });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Magnafic AI API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(configService?.get<number>('PORT') ?? 3001);
}

void bootstrap();
