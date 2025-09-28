import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';


async function bootstrap() {
  try {
    
    const app = await NestFactory.create(AppModule, {
      logger: false,
    });

    app.enableCors({
      origin: "*",
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );


    const port = process.env.PORT || 3002;
    await app.listen(port, '0.0.0.0');

    
    setTimeout(async () => {
      try {
        await fetch(`http://localhost:${port}/`);
      } catch (error) {
      }
    }, 2000);
  } catch (error) {
    process.exit(1);
  }
}
bootstrap();
