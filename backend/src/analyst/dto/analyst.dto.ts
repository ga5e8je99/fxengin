import { ApiProperty } from '@nestjs/swagger';

export class CoordinatesDto {
  @ApiProperty({ example: 2865.50, description: 'Institutional entry price level' })
  entry_price: number;

  @ApiProperty({ example: 2858.00, description: 'Structural Stop Loss price level' })
  sl_price: number;

  @ApiProperty({ example: 75.0, description: 'Stop Loss distance in pips' })
  sl_pips: number;

  @ApiProperty({ example: 2875.00, description: 'Take Profit 1 (Scalp target)' })
  tp1_price: number;

  @ApiProperty({ example: 95.0, description: 'TP1 distance in pips' })
  tp1_pips: number;

  @ApiProperty({ example: 2885.00, description: 'Take Profit 2 (Swing target)' })
  tp2_price: number;

  @ApiProperty({ example: 195.0, description: 'TP2 distance in pips' })
  tp2_pips: number;

  @ApiProperty({ example: '1:2.6', description: 'Calculated Risk-to-Reward ratio' })
  rr_ratio: string | number;

  @ApiProperty({ example: 0.1, required: false, description: 'Suggested safe lot size' })
  suggested_lot?: number;
}

export class IndicatorsDto {
  @ApiProperty({ example: 28.4, description: 'Average Directional Index (ADX 14)' })
  adx: number;

  @ApiProperty({ example: 54.2, description: 'Relative Strength Index (RSI 14)' })
  rsi: number;

  @ApiProperty({ example: 8.5, description: 'Average True Range (ATR)' })
  atr: number;

  @ApiProperty({ example: 'BEARISH_DXY', description: 'US Dollar Index macroeconomic bias' })
  dxy_bias: string;
}

export class SmcFactorsDto {
  @ApiProperty({ example: 'SUPPLY_DISTRIBUTION', description: 'Institutional Order Block classification' })
  order_block: string;

  @ApiProperty({ example: 'FILLED_AND_MITIGATED', description: 'Fair Value Gap (FVG) status' })
  fvg_status: string;

  @ApiProperty({ example: 'COMPLETED_ASIA_SWEEP', description: 'Liquidity sweep status' })
  liquidity_sweep: string;

  @ApiProperty({ example: 'CONFIRMED_STRUCTURAL_BREAK', description: 'Market Structure Shift (MSS) status' })
  mss_status: string;
}

export class FreshnessDto {
  @ApiProperty({ example: 'PRICE_DRIFTED', description: 'Market freshness status code' })
  status_code: string;

  @ApiProperty({ example: false, description: 'Whether the current price is strictly near entry' })
  is_optimal: boolean;

  @ApiProperty({ example: true, description: 'Whether MT5 screenshot refresh is recommended' })
  needs_new_snapshot: boolean;

  @ApiProperty({ example: 12.5, description: 'Elapsed minutes since snapshot' })
  elapsed_minutes: number;

  @ApiProperty({ example: 45.2, description: 'Drift distance in pips' })
  drift_pips: number;

  @ApiProperty({ example: 2870.02, description: 'Current live market price' })
  current_price: number;

  @ApiProperty({ example: 2865.50, description: 'Original setup entry price' })
  entry_price: number;

  @ApiProperty({ example: 'تحرك السعر بمقدار 45.2 نقطة عن نقطة الدخول الأصلية.', description: 'Arabic drift warning' })
  description_ar: string;

  @ApiProperty({ example: 'Price moved 45.2 pips from entry.', description: 'English drift warning' })
  description_en: string;
}

export class AnalystShareResponseDto {
  @ApiProperty({ example: 'SUCCESS', description: 'Execution status' })
  status: string;

  @ApiProperty({ example: 'XAUUSD', description: 'Asset symbol (e.g. XAUUSD, EURUSD)' })
  symbol: string;

  @ApiProperty({ example: 'M5', description: 'Chart timeframe (M5, M15, H1)' })
  timeframe: string;

  @ApiProperty({ example: 'BUY', description: 'Algorithmic signal recommendation (BUY, SELL, HOLD)' })
  recommendation: string;

  @ApiProperty({ example: 'شراء قوي (BUY)', description: 'Human-readable localized recommendation label' })
  recommendation_label: string;

  @ApiProperty({ example: 92.0, description: 'Confidence score percentage (0-100%)' })
  confidence_score: number;

  @ApiProperty({ example: 'A+', description: 'Setup quality grade (A+, A, B, etc.)' })
  setup_grade: string;

  @ApiProperty({ type: CoordinatesDto, description: 'Risk parameters and execution levels' })
  coordinates: CoordinatesDto;

  @ApiProperty({ type: IndicatorsDto, required: false, description: 'Key technical indicators' })
  indicators?: IndicatorsDto;

  @ApiProperty({ type: SmcFactorsDto, required: false, description: 'Smart Money Concepts factors' })
  smc_factors?: SmcFactorsDto;

  @ApiProperty({ type: FreshnessDto, required: false, description: 'Market drift and snapshot freshness' })
  freshness?: FreshnessDto;

  @ApiProperty({ example: 'تقرير فني وتشريحي...', description: 'Full institutional report content' })
  report: string;

  @ApiProperty({ example: 'تقرير فني وتشريحي...', required: false, description: 'Arabic institutional report' })
  report_ar?: string;

  @ApiProperty({ example: 'Comprehensive Institutional Analysis...', required: false, description: 'English institutional report' })
  report_en?: string;

  @ApiProperty({ example: '/api/v1/analyst/share/snap_XAUUSD_.../image', description: 'Relative image URL path' })
  image_url: string;

  @ApiProperty({ example: '/share/analysis/XAUUSD?lang=ar', required: false, description: 'Embeddable web analysis URL' })
  share_web_url?: string;

  @ApiProperty({ example: true, required: false, description: 'Whether the capture was taken directly from active MT5 terminal' })
  is_real_mt5_capture?: boolean;
}

export class FreshSnapshotResponseDto {
  @ApiProperty({ example: 'SUCCESS', description: 'Status of the fresh capture request' })
  status: string;

  @ApiProperty({ example: 'New MT5 snapshot requested successfully', description: 'Response message' })
  message?: string;
}
