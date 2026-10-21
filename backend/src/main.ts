import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './modules';
import { ThrottlerGuard } from '@nestjs/throttler';
import { HttpExceptionFilter } from './http-exception.filter';
async function bootstrap():Promise<void>{const app=await NestFactory.create(AppModule,{bufferLogs:true});app.useLogger(['error','warn','log']);app.use(helmet());app.enableCors({origin:(process.env.FRONTEND_URL||'http://localhost:8080').split(','),credentials:true});app.setGlobalPrefix('api');app.useGlobalPipes(new ValidationPipe({transform:true,whitelist:true,forbidNonWhitelisted:true,forbidUnknownValues:true}));app.useGlobalFilters(new HttpExceptionFilter());app.useGlobalGuards(app.get(ThrottlerGuard));const cfg=new DocumentBuilder().setTitle('AssetFlow ITAM').setDescription('Internal IT asset and license management API').setVersion('1.0').addBearerAuth().build();SwaggerModule.setup('api/docs',app,SwaggerModule.createDocument(app,cfg));await app.listen(3000,'0.0.0.0');}
bootstrap().catch(e=>{console.error(e);process.exit(1);});
