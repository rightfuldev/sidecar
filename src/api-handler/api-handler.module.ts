import { Module } from '@nestjs/common';
import { ApiHandlerService } from './api-handler.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.getOrThrow('microservice.url'),
        timeout: configService.getOrThrow('microservice.timeout'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ApiHandlerService],
  exports: [ApiHandlerService],
})
export class ApiHandlerModule {}
