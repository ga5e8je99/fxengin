import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';
import { RedisService } from './services/redis.service';

@Global()
@Module({
  providers: [EncryptionService, RedisService],
  exports: [EncryptionService, RedisService],
})
export class CommonModule {}
