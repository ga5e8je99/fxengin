import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private memoryFallback: Map<string, { val: string; expiresAt: number }> = new Map();
  private isConnected = false;

  onModuleInit() {
    const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const redisHost = process.env.REDIS_HOST;
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    // In serverless environments without explicit external Redis host, use instant memory fallback
    if (isVercel && (!redisHost || redisHost === '127.0.0.1' || redisHost === 'localhost')) {
      this.logger.log('Running in serverless mode without remote Redis. Using high-speed memory fallback.');
      return;
    }

    if (!redisHost && !process.env.REDIS_URL) {
      this.logger.log('Redis host not configured. Using high-speed memory fallback.');
      return;
    }

    try {
      this.client = new Redis({
        host: redisHost || '127.0.0.1',
        port: redisPort,
        password: redisPassword,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 1) {
            this.logger.warn('Redis unreachable, switching to memory fallback.');
            return null;
          }
          return 500;
        },
      });

      this.client.connect().catch((err) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection failed (${err.message}). Using memory fallback.`);
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`Redis connected successfully to ${redisHost || '127.0.0.1'}:${redisPort}`);
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection error (${err.message}). Using memory fallback.`);
      });
    } catch (err: any) {
      this.logger.warn(`Failed to initialize Redis client: ${err.message}. Using memory fallback.`);
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch {
        // Fallback below
      }
    }
    const item = this.memoryFallback.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.memoryFallback.delete(key);
      return null;
    }
    return item.val;
  }

  async set(key: string, value: string, ttlSeconds = 60): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.set(key, value, 'EX', ttlSeconds);
        return;
      } catch {
        // Fallback below
      }
    }
    this.memoryFallback.set(key, {
      val: value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch {
        // Fallback below
      }
    }
    this.memoryFallback.delete(key);
  }

  /**
   * Acquire a single active stream lease for a user to block account sharing.
   * Only one device/session can watch paid or enrolled courses simultaneously.
   */
  async acquireStreamLease(
    userId: string,
    sessionId: string,
    ttlSeconds = 90,
  ): Promise<{ success: boolean; activeSessionId: string }> {
    const key = `course:stream:lease:${userId}`;
    const current = await this.get(key);

    if (current && current !== sessionId) {
      // Overwrite or track concurrent attempt:
      // We grant the lease to the newest active player (or kick older session)
      this.logger.warn(`Active stream lease hijacked or switched for user ${userId} from ${current} to ${sessionId}`);
    }

    await this.set(key, sessionId, ttlSeconds);
    return { success: true, activeSessionId: sessionId };
  }

  async checkStreamLease(userId: string, sessionId: string): Promise<boolean> {
    const key = `course:stream:lease:${userId}`;
    const current = await this.get(key);
    if (!current) return true; // lease expired or first call
    return current === sessionId;
  }
}
