import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL ||
            'postgresql://postgres:postgres@localhost:5432/fxengin?schema=public',
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await Promise.race([
        this.$connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout (3s)')), 3000)
        ),
      ]);
      this.logger.log('Prisma connected to PostgreSQL database successfully.');
    } catch (err: any) {
      this.logger.warn(
        `Could not connect to database on startup (${err.message}). The server will start, but database operations require PostgreSQL to be running or a valid DATABASE_URL in .env.`
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {
      // ignore
    }
  }
}
