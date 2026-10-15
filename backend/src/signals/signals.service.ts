import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSignalDto, UpdateSignalDto } from './dto/signal.dto';
import { SignalStatus } from '@prisma/client';

@Injectable()
export class SignalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSignalDto) {
    return this.prisma.signal.create({
      data: {
        symbol: dto.symbol.trim().toUpperCase(),
        direction: dto.direction,
        entryPrice: dto.entryPrice,
        stopLoss: dto.stopLoss,
        takeProfit1: dto.takeProfit1,
        takeProfit2: dto.takeProfit2,
        takeProfit3: dto.takeProfit3,
        status: dto.status || SignalStatus.ACTIVE,
        timeframe: dto.timeframe || '1H',
        riskReward: dto.riskReward || '1:3',
        notes: dto.notes,
      },
    });
  }

  async findAll(query?: { symbol?: string; status?: string; limit?: number }) {
    const where: any = {};
    if (query?.symbol) {
      where.symbol = { contains: query.symbol.toUpperCase() };
    }
    if (query?.status && query.status !== 'ALL') {
      where.status = query.status as SignalStatus;
    }

    const take = query?.limit ? Number(query.limit) : 50;

    const [total, data] = await Promise.all([
      this.prisma.signal.count({ where }),
      this.prisma.signal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
      }),
    ]);

    return {
      success: true,
      total,
      data,
    };
  }

  async findActive() {
    const data = await this.prisma.signal.findMany({
      where: { status: SignalStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      success: true,
      count: data.length,
      data,
    };
  }

  async findOne(id: string) {
    const signal = await this.prisma.signal.findUnique({ where: { id } });
    if (!signal) {
      throw new NotFoundException(`Signal with ID ${id} not found`);
    }
    return signal;
  }

  async update(id: string, dto: UpdateSignalDto) {
    await this.findOne(id);
    return this.prisma.signal.update({
      where: { id },
      data: {
        ...(dto.direction && { direction: dto.direction }),
        ...(dto.entryPrice !== undefined && { entryPrice: dto.entryPrice }),
        ...(dto.stopLoss !== undefined && { stopLoss: dto.stopLoss }),
        ...(dto.takeProfit1 !== undefined && { takeProfit1: dto.takeProfit1 }),
        ...(dto.takeProfit2 !== undefined && { takeProfit2: dto.takeProfit2 }),
        ...(dto.takeProfit3 !== undefined && { takeProfit3: dto.takeProfit3 }),
        ...(dto.status && { status: dto.status }),
        ...(dto.timeframe && { timeframe: dto.timeframe }),
        ...(dto.riskReward && { riskReward: dto.riskReward }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.signal.delete({ where: { id } });
    return { success: true, message: 'Signal deleted successfully' };
  }
}
