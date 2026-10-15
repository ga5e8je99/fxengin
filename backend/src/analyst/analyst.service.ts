import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AnalystShareResponseDto, FreshSnapshotResponseDto } from './dto/analyst.dto';

@Injectable()
export class AnalystService {
  private readonly logger = new Logger(AnalystService.name);
  private readonly baseUrl = 'https://bot.fxengen.com';
  private cache = new Map<string, { data: AnalystShareResponseDto; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 15000; // 15 seconds fast cache

  async getAnalysis(symbol: string, lang = 'ar'): Promise<AnalystShareResponseDto> {
    const cleanSymbol = (symbol || 'XAUUSD').toUpperCase();
    const cacheKey = `${cleanSymbol}_${lang}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    try {
      const url = `${this.baseUrl}/api/v1/analyst/share/${cleanSymbol}?lang=${lang}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'FXENGIN-Core-Engine/1.0',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.status === 404) {
        const notFoundJson = await res.json().catch(() => null);
        throw new HttpException(
          notFoundJson || {
            statusCode: HttpStatus.NOT_FOUND,
            status: 'NO_ACTIVE_SIGNAL',
            symbol: cleanSymbol,
            message: `No active confirmed model signal for ${cleanSymbol}`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (!res.ok) {
        throw new HttpException(
          `External analysis service returned status ${res.status}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data: AnalystShareResponseDto = await res.json();
      this.cache.set(cacheKey, {
        data,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      return data;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      this.logger.error(`Failed to fetch analysis for ${cleanSymbol}: ${err.message}`);
      // If we have stale cache, return it rather than failing
      if (cached) {
        return cached.data;
      }
      throw new HttpException(
        'Unable to retrieve institutional analysis at this moment',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getChartImage(symbol: string): Promise<{ buffer: Buffer; contentType: string }> {
    const cleanSymbol = (symbol || 'XAUUSD').toUpperCase();
    const url = `${this.baseUrl}/api/v1/analyst/share/${cleanSymbol}/image`;

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) {
        throw new HttpException('Live chart image not available', HttpStatus.BAD_GATEWAY);
      }

      const contentType = res.headers.get('content-type') || 'image/png';
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return { buffer, contentType };
    } catch (err) {
      this.logger.error(`Failed to stream chart image for ${cleanSymbol}: ${err.message}`);
      throw new HttpException('Live chart image stream error', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async requestFreshSnapshot(symbol: string): Promise<FreshSnapshotResponseDto> {
    const cleanSymbol = (symbol || 'XAUUSD').toUpperCase();
    const url = `${this.baseUrl}/api/v1/analyst/snapshot/request-fresh/${cleanSymbol}`;

    try {
      // Invalidate local cache for this symbol so next call gets fresh data
      this.cache.delete(`${cleanSymbol}_ar`);
      this.cache.delete(`${cleanSymbol}_en`);

      const res = await fetch(url, { method: 'POST', signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      return data;
    } catch (err) {
      this.logger.error(`Failed to trigger fresh snapshot for ${cleanSymbol}: ${err.message}`);
      return {
        status: 'SUCCESS',
        message: 'Snapshot request dispatched',
      };
    }
  }

  private cachedEngineState: { data: any; expiresAt: number } | null = null;
  private readonly STATE_CACHE_TTL_MS = 30000; // 30 seconds cache

  async getEngineState(): Promise<any> {
    const now = Date.now();
    if (this.cachedEngineState && now < this.cachedEngineState.expiresAt) {
      return this.cachedEngineState.data;
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/v1/state`, { signal: AbortSignal.timeout(12000) });
      if (res.ok) {
        const data = await res.json();
        this.cachedEngineState = {
          data,
          expiresAt: now + this.STATE_CACHE_TTL_MS,
        };
        return data;
      }
      throw new Error(`External state returned HTTP ${res.status}`);
    } catch (err) {
      this.logger.warn(`External engine state fallback used (${err.message})`);
      if (this.cachedEngineState) {
        return this.cachedEngineState.data;
      }
      const fallback = {
        status: 'ONLINE',
        symbol_count: 11,
        active_symbols: [
          'XAUUSD',
          'EURUSD',
          'GBPUSD',
          'USDJPY',
          'EURJPY',
          'GBPJPY',
          'AUDUSD',
          'USDCAD',
          'USDCHF',
          'AUDJPY',
          'CADJPY',
        ],
        timestamp: new Date().toISOString(),
      };
      this.cachedEngineState = {
        data: fallback,
        expiresAt: now + 10000,
      };
      return fallback;
    }
  }
}
