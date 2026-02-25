import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si envían propiedades extras
      transform: true, // Convierte payloads a instancias de DTOs
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('API UIS TG Profe Cátedra')
    .setDescription(
      'Documentación de la API para el sistema de profesores de cátedra',
    )
    .setVersion('1.0')
    .addTag('profesores')
    .addBearerAuth() // Opcional: si usarás autenticación JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
