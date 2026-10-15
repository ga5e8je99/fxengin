import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SignalDirection, SignalStatus } from '@prisma/client';

export class CreateSignalDto {
  @ApiProperty({ example: 'XAU/USD', description: 'رمز زوج العملات أو السلعة' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ enum: SignalDirection, default: SignalDirection.BUY })
  @IsEnum(SignalDirection)
  direction: SignalDirection;

  @ApiProperty({ example: 2342.50, description: 'سعر الدخول' })
  @IsNumber()
  entryPrice: number;

  @ApiProperty({ example: 2335.00, description: 'وقف الخسارة' })
  @IsNumber()
  stopLoss: number;

  @ApiProperty({ example: 2355.00, description: 'الهدف الأول (TP1)' })
  @IsNumber()
  takeProfit1: number;

  @ApiPropertyOptional({ example: 2368.00, description: 'الهدف الثاني (TP2)' })
  @IsOptional()
  @IsNumber()
  takeProfit2?: number;

  @ApiPropertyOptional({ example: 2380.00, description: 'الهدف الثالث (TP3)' })
  @IsOptional()
  @IsNumber()
  takeProfit3?: number;

  @ApiPropertyOptional({ enum: SignalStatus, default: SignalStatus.ACTIVE })
  @IsOptional()
  @IsEnum(SignalStatus)
  status?: SignalStatus;

  @ApiPropertyOptional({ example: '1H', description: 'الإطار الزمني' })
  @IsOptional()
  @IsString()
  timeframe?: string;

  @ApiPropertyOptional({ example: '1:3', description: 'نسبة العائد إلى المخاطرة' })
  @IsOptional()
  @IsString()
  riskReward?: string;

  @ApiPropertyOptional({ example: 'ارتداد من منطقة طلب H1 مع فجوة FVG شرائية' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSignalDto {
  @ApiPropertyOptional({ enum: SignalDirection })
  @IsOptional()
  @IsEnum(SignalDirection)
  direction?: SignalDirection;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  entryPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  stopLoss?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  takeProfit1?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  takeProfit2?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  takeProfit3?: number;

  @ApiPropertyOptional({ enum: SignalStatus })
  @IsOptional()
  @IsEnum(SignalStatus)
  status?: SignalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timeframe?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  riskReward?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
