import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { NatsModule } from './nats/nats.module';

@Module({
  imports: [ConfigModule, NatsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
