import { ApiProperty } from '@nestjs/swagger';

export class MarketRateDto {
  @ApiProperty({ example: 'XAU/USD', description: 'Instrument ticker symbol' })
  symbol: string;

  @ApiProperty({ example: 'Gold Spot', description: 'English instrument name' })
  name: string;

  @ApiProperty({ example: 'الذهب مقابل الدولار', description: 'Arabic instrument name' })
  nameAr: string;

  @ApiProperty({ example: 'metals', enum: ['metals', 'forex', 'indices'], description: 'Asset category' })
  category: 'metals' | 'forex' | 'indices';

  @ApiProperty({ example: 2518.40, description: 'Current live market price' })
  price: number;

  @ApiProperty({ example: 1.65, description: '24-hour percentage change' })
  change24h: number;

  @ApiProperty({ example: 2528.50, description: '24-hour high price' })
  high: number;

  @ApiProperty({ example: 2498.20, description: '24-hour low price' })
  low: number;

  @ApiProperty({ example: 0.15, description: 'Institutional execution spread' })
  spread: number;

  @ApiProperty({ example: 2, description: 'Decimal precision digits' })
  precision: number;

  @ApiProperty({ example: 38400000000, description: 'Raw 24-hour trading volume in USD' })
  volumeValue: number;

  @ApiProperty({ example: '$38.4B', description: 'Human-readable formatted volume' })
  volumeFormatted: string;
}

export class MarketAnalyticsDto {
  @ApiProperty({ type: () => MarketRateDto, description: 'Asset with the highest 24h positive percentage gain' })
  topGainer: MarketRateDto;

  @ApiProperty({ type: () => MarketRateDto, description: 'Asset with the highest 24h negative percentage loss' })
  topLoser: MarketRateDto;

  @ApiProperty({ type: () => MarketRateDto, description: 'Asset with the highest 24h dollar volume turnover' })
  highestVolume: MarketRateDto;

  @ApiProperty({ example: '$240.5 Billion', description: 'Total aggregated 24h market volume' })
  totalMarketVolume: string;

  @ApiProperty({ example: 'London / New York Overlap', description: 'Current active global financial session' })
  activeSession: string;

  @ApiProperty({ example: 'جلسة لندن / نيويورك المشتركة', description: 'Active global session name in Arabic' })
  activeSessionAr: string;

  @ApiProperty({ example: 64, description: 'Bullish market sentiment percentage (0-100)' })
  bullishRatio: number;
}

export class MarketOverviewPayloadDto {
  @ApiProperty({ type: () => MarketAnalyticsDto, description: 'Aggregated institutional analytics' })
  analytics: MarketAnalyticsDto;

  @ApiProperty({ type: () => [MarketRateDto], description: 'List of live asset quotes across all categories' })
  rates: MarketRateDto[];

  @ApiProperty({ example: '2026-09-03T14:20:00.000Z', description: 'Snapshot ISO timestamp' })
  timestamp: string;
}

export class MarketRatesResponseDto {
  @ApiProperty({ example: true, description: 'Response success status' })
  success: boolean;

  @ApiProperty({ type: () => [MarketRateDto], description: 'Array of live market rates' })
  data: MarketRateDto[];

  @ApiProperty({ example: '2026-09-03T14:20:00.000Z', description: 'Response ISO timestamp' })
  timestamp: string;
}

export class MarketOverviewResponseDto {
  @ApiProperty({ example: true, description: 'Response success status' })
  success: boolean;

  @ApiProperty({ type: () => MarketOverviewPayloadDto, description: 'Full market overview analytics and rates' })
  data: MarketOverviewPayloadDto;

  @ApiProperty({ example: '2026-09-03T14:20:00.000Z', description: 'Response ISO timestamp' })
  timestamp: string;
}
