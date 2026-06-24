import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { initializeFirebaseAdmin } from './firebase/firebase-admin';

async function bootstrap() {
  // Initialize Firebase Admin before the app starts
  initializeFirebaseAdmin();

  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}

bootstrap();
