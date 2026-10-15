import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ProductType } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {
  ActivateTradingAccountDto,
  DirectGuestTradingDto,
  OpenPositionDto,
  ClosePositionDto,
  ModifyPositionDto,
  CreateCompetitionPlanDto,
  UpdateCompetitionPlanDto,
  CreateManualParticipantDto,
  UpdateManualParticipantDto,
} from './dto/trading.dto';

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);
  private readonly secretSalt: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.secretSalt =
      process.env.ACTIVATION_SECRET_SALT ||
      process.env.ENCRYPTION_SECRET_KEY ||
      'fxengin_super_secure_activation_salt_2026_production_hmac';
  }

  private hashActivationCode(code: string): string {
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    return crypto.createHmac('sha256', this.secretSalt).update(normalized).digest('hex');
  }

  private getSymbolContractSize(symbol: string): number {
    const s = symbol.toUpperCase().replace('/', '');
    if (s.includes('XAU') || s.includes('GOLD')) return 100;
    if (s.includes('XAG') || s.includes('SILVER')) return 5000;
    if (s.includes('BTC')) return 1;
    if (s.includes('ETH')) return 10;
    if (s.includes('OIL') || s.includes('WTI') || s.includes('BRENT')) return 1000;
    if (s.includes('US30') || s.includes('NAS') || s.includes('SPX')) return 1;
    if (s.includes('JPY')) return 100000;
    return 100000; // Standard Forex Lot
  }

  private getSymbolPipSize(symbol: string): number {
    const s = symbol.toUpperCase().replace('/', '');
    if (s.includes('JPY')) return 0.01;
    if (s.includes('XAU') || s.includes('GOLD')) return 0.10;
    if (s.includes('BTC')) return 1.0;
    if (s.includes('US30') || s.includes('NAS')) return 1.0;
    return 0.0001; // Standard Forex Pip
  }

  /**
   * 1. الدخول أو التفعيل عبر كود التفعيل المستلم بعد الدفع
   */
  async activateOrLoginWithCode(dto: ActivateTradingAccountDto, clientIp?: string) {
    const cleanCode = dto.activationCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (!cleanCode || cleanCode.length < 8) {
      throw new BadRequestException('صيغة كود التفعيل غير صالحة');
    }

    const codeHash = this.hashActivationCode(cleanCode);

    // البحث عن الكود في جدول الأكواد
    let codeRecord = await this.prisma.activationCode.findUnique({
      where: { codeHash },
      include: {
        order: true,
        user: true,
      },
    });

    // إذا لم يكن مسجلاً بالهاش الدقيق (مثلاً في حال إدخال كود مباشر أو كود تجريبي)
    if (!codeRecord) {
      // فحص إذا كان هناك كود بالبادئة أو مسجل في النظام
      const anyCode = await this.prisma.activationCode.findFirst({
        where: {
          OR: [
            { displayPrefix: { contains: cleanCode.substring(0, 7) } },
            { id: cleanCode },
          ],
        },
        include: { order: true, user: true },
      });
      if (anyCode) {
        codeRecord = anyCode;
      }
    }

    // إذا تم العثور على الكود الحقيقي
    let userId: string;
    let traderName: string = dto.accountName || 'Trader Demo';
    let productType: ProductType = ProductType.COMMUNITY_GROUP;
    let productId: string | undefined;

    if (codeRecord) {
      if (codeRecord.status === 'REVOKED') {
        throw new ForbiddenException('تم إلغاء صلاحية كود التفعيل هذا');
      }
      userId = codeRecord.userId;
      traderName = dto.accountName || codeRecord.user.fullName || 'FX Trader';
      productType = codeRecord.productType;
      productId = codeRecord.productId;
    } else {
      // إذا كان كود عام أو طلب تجريبي بكود صالح البنية
      // نتحقق من وجود مستخدم تجريبي أو نربطه بمستخدم النظام الافتراضي
      const defaultUser = await this.prisma.user.findFirst({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'USER'] } },
      });
      if (!defaultUser) {
        throw new NotFoundException('لا يوجد مستخدم مسجل في النظام');
      }
      userId = defaultUser.id;
      traderName = dto.accountName || 'Trader ' + cleanCode.slice(-4);
    }

    // البحث عن باقة المسابقة المتوافقة
    let matchedPlan = await this.prisma.tradingCompetitionPlan.findFirst({
      where: {
        isActive: true,
        ...(productId ? { targetProductId: productId } : {}),
      },
    });

    if (!matchedPlan) {
      matchedPlan = await this.prisma.tradingCompetitionPlan.findFirst({
        where: {
          isActive: true,
          targetProductType: productType,
        },
      });
    }

    if (!matchedPlan) {
      matchedPlan = await this.prisma.tradingCompetitionPlan.findFirst({
        where: { isActive: true },
        orderBy: { initialBalance: 'desc' },
      });
    }

    // البحث عما إذا كان المستخدم لديه حساب تجريبي مفعل بهذا الكود
    let account = await this.prisma.tradingAccount.findFirst({
      where: {
        userId,
        ...(codeRecord ? { activationCodeId: codeRecord.id } : {}),
      },
      include: {
        competitionPlan: true,
        positions: true,
      },
    });

    // إذا لم يكن لديه حساب، نقوم بإنشاء حساب مسابقة جديد وفق مواصفات الباقة
    if (!account) {
      const initialBal = matchedPlan ? Number(matchedPlan.initialBalance) : 25000.0;
      const leverage = matchedPlan ? matchedPlan.leverage : 200;
      const broker = matchedPlan ? matchedPlan.brokerServer : 'FXENGIN Prime ECN';
      const accountNumber = String(500000 + Math.floor(Math.random() * 499999));

      account = await this.prisma.tradingAccount.create({
        data: {
          accountNumber,
          accountName: traderName,
          userId,
          activationCodeId: codeRecord ? codeRecord.id : null,
          competitionPlanId: matchedPlan ? matchedPlan.id : null,
          brokerServer: broker,
          initialBalance: initialBal,
          balance: initialBal,
          equity: initialBal,
          freeMargin: initialBal,
          margin: 0,
          marginLevel: 0,
          leverage,
          status: 'ACTIVE',
        },
        include: {
          competitionPlan: true,
          positions: true,
        },
      });

      this.logger.log(`Created new Trading Account #${account.accountNumber} for user ${userId} under plan ${matchedPlan?.titleAr}`);
    }

    // توليد رمز وصول JWT لمنصة التداول
    const token = this.jwtService.sign(
      {
        sub: account.userId,
        accountId: account.id,
        accountNumber: account.accountNumber,
        role: 'TRADER',
      },
      { expiresIn: '30d' },
    );

    return {
      success: true,
      token,
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        balance: Number(account.balance),
        equity: Number(account.equity),
        margin: Number(account.margin),
        freeMargin: Number(account.freeMargin),
        marginLevel: Number(account.marginLevel),
        leverage: account.leverage,
        brokerServer: account.brokerServer,
        initialBalance: Number(account.initialBalance),
        points: Number(account.points),
        totalPips: Number(account.totalPips),
        winTrades: account.winTrades,
        lossTrades: account.lossTrades,
        totalTrades: account.totalTrades,
        status: account.status,
        plan: account.competitionPlan,
      },
      message: 'تم تفعيل حساب التداول بنجاح والدخول للمسابقة!',
    };
  }

  /**
   * 2. الدخول التجريبي الفوري (Guest Demo Access)
   */
  async guestAccess(dto: DirectGuestTradingDto) {
    const defaultUser = await this.prisma.user.findFirst();
    if (!defaultUser) throw new NotFoundException('مستخدم النظام غير متوفر');

    let plan = null;
    if (dto.planId) {
      plan = await this.prisma.tradingCompetitionPlan.findUnique({ where: { id: dto.planId } });
    }
    if (!plan) {
      plan = await this.prisma.tradingCompetitionPlan.findFirst({
        where: { isActive: true },
        orderBy: { initialBalance: 'asc' },
      });
    }

    const initialBal = plan ? Number(plan.initialBalance) : 10000.0;
    const leverage = plan ? plan.leverage : 100;
    const broker = plan ? plan.brokerServer : 'FXENGIN Prime ECN';
    const accountNumber = String(510000 + Math.floor(Math.random() * 399999));
    const traderName = dto.accountName || `Trader Guest #${accountNumber.slice(-3)}`;

    const account = await this.prisma.tradingAccount.create({
      data: {
        accountNumber,
        accountName: traderName,
        userId: defaultUser.id,
        competitionPlanId: plan?.id,
        brokerServer: broker,
        initialBalance: initialBal,
        balance: initialBal,
        equity: initialBal,
        freeMargin: initialBal,
        margin: 0,
        marginLevel: 0,
        leverage,
        status: 'ACTIVE',
      },
      include: {
        competitionPlan: true,
      },
    });

    const token = this.jwtService.sign(
      {
        sub: account.userId,
        accountId: account.id,
        accountNumber: account.accountNumber,
        role: 'TRADER',
      },
      { expiresIn: '14d' },
    );

    return {
      success: true,
      token,
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        balance: Number(account.balance),
        equity: Number(account.equity),
        margin: Number(account.margin),
        freeMargin: Number(account.freeMargin),
        marginLevel: Number(account.marginLevel),
        leverage: account.leverage,
        brokerServer: account.brokerServer,
        initialBalance: Number(account.initialBalance),
        points: Number(account.points),
        totalPips: Number(account.totalPips),
        winTrades: account.winTrades,
        lossTrades: account.lossTrades,
        totalTrades: account.totalTrades,
        status: account.status,
        plan: account.competitionPlan,
      },
    };
  }

  /**
   * 3. جلب حالة الحساب والصفقات المفتوحة وتحديث الهامش والأرباح العائمة
   */
  async getAccountState(accountId: string) {
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },
      include: {
        competitionPlan: true,
        positions: {
          orderBy: { openedAt: 'desc' },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('حساب التداول غير موجود');
    }

    // حساب إجمالي الهامش المحجوز والأرباح العائمة
    let totalMargin = 0;
    let totalFloatingProfit = 0;

    for (const pos of account.positions) {
      const contractSize = this.getSymbolContractSize(pos.symbol);
      const posMargin = (Number(pos.lots) * contractSize * Number(pos.openPrice)) / account.leverage;
      totalMargin += posMargin;
      totalFloatingProfit += Number(pos.profit);
    }

    const currentBalance = Number(account.balance);
    const equity = currentBalance + totalFloatingProfit;
    const freeMargin = Math.max(0, equity - totalMargin);
    const marginLevel = totalMargin > 0 ? (equity / totalMargin) * 100 : 0;

    // تحديث سريع للحساب إن لزم
    if (
      Math.abs(Number(account.equity) - equity) > 0.01 ||
      Math.abs(Number(account.margin) - totalMargin) > 0.01
    ) {
      await this.prisma.tradingAccount.update({
        where: { id: accountId },
        data: {
          equity,
          margin: totalMargin,
          freeMargin,
          marginLevel,
        },
      });
    }

    return {
      success: true,
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        balance: currentBalance,
        equity,
        margin: totalMargin,
        freeMargin,
        marginLevel,
        leverage: account.leverage,
        brokerServer: account.brokerServer,
        initialBalance: Number(account.initialBalance),
        points: Number(account.points),
        totalPips: Number(account.totalPips),
        winTrades: account.winTrades,
        lossTrades: account.lossTrades,
        totalTrades: account.totalTrades,
        status: account.status,
        plan: account.competitionPlan,
      },
      positions: account.positions.map((p) => ({
        id: p.id,
        ticket: p.ticket,
        symbol: p.symbol,
        type: p.type,
        lots: Number(p.lots),
        openPrice: Number(p.openPrice),
        currentPrice: Number(p.currentPrice),
        stopLoss: p.stopLoss ? Number(p.stopLoss) : null,
        takeProfit: p.takeProfit ? Number(p.takeProfit) : null,
        profit: Number(p.profit),
        pips: Number(p.pips),
        swap: Number(p.swap),
        commission: Number(p.commission),
        openedAt: p.openedAt,
      })),
    };
  }

  /**
   * 4. فتح صفقة جديدة (Market Execution)
   */
  async openPosition(accountId: string, dto: OpenPositionDto) {
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new NotFoundException('حساب التداول غير موجود');
    if (account.status !== 'ACTIVE') {
      throw new ForbiddenException('حساب التداول موقوف أو تم استبعاده من المسابقة');
    }

    const price = dto.executionPrice || (dto.type === 'BUY' ? 1.0850 : 1.0848);
    const contractSize = this.getSymbolContractSize(dto.symbol);
    const requiredMargin = (dto.lots * contractSize * price) / account.leverage;

    if (Number(account.freeMargin) < requiredMargin) {
      throw new BadRequestException('الهامش المتاح غير كافٍ لفتح هذا العقد (Not enough free margin)');
    }

    const ticket = Math.floor(100000 + Math.random() * 900000);

    const position = await this.prisma.tradingPosition.create({
      data: {
        ticket,
        accountId,
        symbol: dto.symbol.toUpperCase(),
        type: dto.type,
        lots: dto.lots,
        openPrice: price,
        currentPrice: price,
        stopLoss: dto.stopLoss || null,
        takeProfit: dto.takeProfit || null,
        profit: 0.0,
        pips: 0.0,
        commission: dto.lots * 3.5, // عمولة تجريبية واقعية $3.5 للوت ECN
      },
    });

    // تحديث الهامش
    const newMargin = Number(account.margin) + requiredMargin;
    const newFreeMargin = Math.max(0, Number(account.equity) - newMargin);
    const newMarginLevel = newMargin > 0 ? (Number(account.equity) / newMargin) * 100 : 0;

    await this.prisma.tradingAccount.update({
      where: { id: accountId },
      data: {
        margin: newMargin,
        freeMargin: newFreeMargin,
        marginLevel: newMarginLevel,
      },
    });

    return {
      success: true,
      message: `تم فتح صفقة ${dto.type} لـ ${dto.symbol} بحجم ${dto.lots} لوت بنجاح!`,
      position: {
        ...position,
        lots: Number(position.lots),
        openPrice: Number(position.openPrice),
        currentPrice: Number(position.currentPrice),
        profit: Number(position.profit),
      },
    };
  }

  /**
   * 5. إغلاق صفقة واحتساب النقاط والأرباح وترتيب المتسابق
   */
  async closePosition(accountId: string, positionId: string, dto: ClosePositionDto) {
    const position = await this.prisma.tradingPosition.findUnique({
      where: { id: positionId },
      include: {
        account: {
          include: { competitionPlan: true },
        },
      },
    });

    if (!position || position.accountId !== accountId) {
      throw new NotFoundException('الصفقة غير موجودة');
    }

    const closePrice = dto.closePrice || Number(position.currentPrice);
    const contractSize = this.getSymbolContractSize(position.symbol);
    const pipSize = this.getSymbolPipSize(position.symbol);

    let priceDiff = 0;
    if (position.type === 'BUY') {
      priceDiff = closePrice - Number(position.openPrice);
    } else {
      priceDiff = Number(position.openPrice) - closePrice;
    }

    const pips = priceDiff / pipSize;
    // الربح = فرق السعر * اللوت * حجم العقد - العمولة
    const grossProfit = priceDiff * Number(position.lots) * contractSize;
    const netProfit = grossProfit - Number(position.commission);

    // احتساب نقاط المسابقة
    const planMultiplier = position.account.competitionPlan?.pointsPerPip || 1.0;
    // معادلة النقاط: (النقاط Pips * مضاعف الباقة) + بونص 10% من صافي الربح إذا كانت رابحة
    let earnedPoints = pips * planMultiplier;
    if (netProfit > 0) {
      earnedPoints += (netProfit * 0.05); // Bonus
    }

    // التنفيذ في معاملة ذرية:
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. تسجيل في السجل
      const history = await tx.tradingHistory.create({
        data: {
          ticket: position.ticket,
          accountId,
          symbol: position.symbol,
          type: position.type,
          lots: position.lots,
          openPrice: position.openPrice,
          closePrice,
          stopLoss: position.stopLoss,
          takeProfit: position.takeProfit,
          profit: netProfit,
          pips,
          swap: position.swap,
          commission: position.commission,
          closeReason: dto.reason || 'MANUAL',
          openedAt: position.openedAt,
          closedAt: new Date(),
        },
      });

      // 2. حذف من الصفقات المفتوحة
      await tx.tradingPosition.delete({ where: { id: positionId } });

      // 3. تحديث الحساب
      const newBalance = Number(position.account.balance) + netProfit;
      const isWin = netProfit > 0;
      const updatedAccount = await tx.tradingAccount.update({
        where: { id: accountId },
        data: {
          balance: newBalance,
          equity: newBalance,
          totalPips: { increment: pips },
          points: { increment: earnedPoints },
          totalTrades: { increment: 1 },
          ...(isWin ? { winTrades: { increment: 1 } } : { lossTrades: { increment: 1 } }),
        },
      });

      return { history, updatedAccount };
    });

    return {
      success: true,
      message: `تم إغلاق الصفقة #${position.ticket} بنجاح! النتيجة: ${netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}$ (${pips >= 0 ? '+' : ''}${pips.toFixed(1)} Pips)`,
      profit: netProfit,
      pips,
      earnedPoints,
      history: result.history,
    };
  }

  /**
   * 6. تعديل وقف الخسارة وجني الأرباح
   */
  async modifyPosition(accountId: string, positionId: string, dto: ModifyPositionDto) {
    const position = await this.prisma.tradingPosition.findUnique({
      where: { id: positionId },
    });

    if (!position || position.accountId !== accountId) {
      throw new NotFoundException('الصفقة غير موجودة');
    }

    const updated = await this.prisma.tradingPosition.update({
      where: { id: positionId },
      data: {
        stopLoss: dto.stopLoss !== undefined ? dto.stopLoss : position.stopLoss,
        takeProfit: dto.takeProfit !== undefined ? dto.takeProfit : position.takeProfit,
      },
    });

    return {
      success: true,
      message: 'تم تحديث مستويات وقف الخسارة وجني الأرباح بنجاح',
      position: updated,
    };
  }

  /**
   * 7. جلب سجل الصفقات المغلقة
   */
  async getTradeHistory(accountId: string) {
    const history = await this.prisma.tradingHistory.findMany({
      where: { accountId },
      orderBy: { closedAt: 'desc' },
      take: 100,
    });

    let totalProfit = 0;
    let totalPips = 0;
    let wins = 0;
    let losses = 0;

    const formatted = history.map((h) => {
      const p = Number(h.profit);
      totalProfit += p;
      totalPips += Number(h.pips);
      if (p > 0) wins++;
      else losses++;

      return {
        id: h.id,
        ticket: h.ticket,
        symbol: h.symbol,
        type: h.type,
        lots: Number(h.lots),
        openPrice: Number(h.openPrice),
        closePrice: Number(h.closePrice),
        stopLoss: h.stopLoss ? Number(h.stopLoss) : null,
        takeProfit: h.takeProfit ? Number(h.takeProfit) : null,
        profit: p,
        pips: Number(h.pips),
        commission: Number(h.commission),
        closeReason: h.closeReason,
        openedAt: h.openedAt,
        closedAt: h.closedAt,
      };
    });

    return {
      success: true,
      history: formatted,
      stats: {
        totalProfit,
        totalPips,
        totalTrades: history.length,
        winRate: history.length > 0 ? ((wins / history.length) * 100).toFixed(1) : '0',
      },
    };
  }

  /**
   * جلب معرفات المستخدمين المؤهلين والمشتركين في المسابقة (استكملوا الشروط الـ 4 أو معتمدين)
   */
  private getQualifiedUserIds(): Set<string> {
    const list: string[] = [];
    if (process.env.SHARED_DATA_DIR) {
      list.push(path.join(process.env.SHARED_DATA_DIR, 'competition-qualification.json'));
    }
    list.push('/app/shared-data/competition-qualification.json');
    list.push('/app/data/competition-qualification.json');
    list.push('/root/fxengin-website/shared-data/competition-qualification.json');
    list.push(path.join(process.cwd(), '..', 'shared-data', 'competition-qualification.json'));
    list.push(path.join(process.cwd(), '..', 'fx-engin', 'data', 'competition-qualification.json'));
    list.push(path.join(process.cwd(), 'data', 'competition-qualification.json'));

    for (const f of list) {
      try {
        if (fs.existsSync(f)) {
          const raw = fs.readFileSync(f, 'utf-8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed?.participants)) {
            const qualified = new Set<string>();
            for (const p of parsed.participants) {
              if (p.isQualified || p.manualApproval) {
                qualified.add(p.userId);
              }
            }
            return qualified;
          }
        }
      } catch (err) {
        // Continue fallback search
      }
    }
    return new Set<string>();
  }

  /**
   * 8. لوحة المتصدرين للمسابقة (Competition Leaderboard)
   * فقط المتسابقون الذين استكملوا الشروط الـ 4 يُحتسبون في تصنيف وجوائز المسابقة
   */
  async getLeaderboard(limit = 50) {
    const qualifiedUserIds = this.getQualifiedUserIds();

    const accounts = await this.prisma.tradingAccount.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ points: 'desc' }, { equity: 'desc' }],
      take: limit * 2,
      include: {
        user: { select: { fullName: true, email: true } },
        competitionPlan: { select: { titleAr: true, titleEn: true, badgeName: true } },
      },
    });

    // Only accounts of traders who completed the 4 competition conditions are counted in the official leaderboard
    const eligibleAccounts = accounts
      .filter((acc) => qualifiedUserIds.has(acc.userId))
      .slice(0, limit);

    const leaderboard = eligibleAccounts.map((acc, index) => {
      const bal = Number(acc.balance);
      const initBal = Number(acc.initialBalance);
      const profit = bal - initBal;
      const roi = initBal > 0 ? ((profit / initBal) * 100).toFixed(2) : '0.00';
      const winRate =
        acc.totalTrades > 0
          ? ((acc.winTrades / acc.totalTrades) * 100).toFixed(1)
          : '0.0';

      return {
        rank: index + 1,
        accountId: acc.id,
        accountNumber: acc.accountNumber,
        traderName: acc.accountName || acc.user?.fullName || 'متداول',
        badge: acc.competitionPlan?.badgeName || 'TRADER',
        planTitle: acc.competitionPlan?.titleAr || 'حساب المسابقة',
        points: Math.round(Number(acc.points)),
        totalPips: Math.round(Number(acc.totalPips)),
        balance: bal,
        profit,
        roiPercent: Number(roi),
        totalTrades: acc.totalTrades,
        winRate: Number(winRate),
        status: acc.status,
        isCompetitionQualified: true,
      };
    });

    return {
      success: true,
      leaderboard,
      totalParticipants: eligibleAccounts.length,
      updatedAt: new Date(),
    };
  }

  /**
   * 9. باقات المسابقة المتاحة
   */
  async getCompetitionPlans() {
    const plans = await this.prisma.tradingCompetitionPlan.findMany({
      where: { isActive: true },
      orderBy: { initialBalance: 'asc' },
    });

    return {
      success: true,
      plans: plans.map((p) => ({
        id: p.id,
        titleAr: p.titleAr,
        titleEn: p.titleEn,
        targetProductType: p.targetProductType,
        targetProductId: p.targetProductId,
        initialBalance: Number(p.initialBalance),
        leverage: p.leverage,
        brokerServer: p.brokerServer,
        maxDailyDrawdown: p.maxDailyDrawdown,
        maxTotalDrawdown: p.maxTotalDrawdown,
        pointsPerPip: p.pointsPerPip,
        badgeName: p.badgeName,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
      })),
    };
  }

  // ==========================================
  // ADMIN DASHBOARD METHODS
  // ==========================================

  async adminGetAllAccounts(search?: string, planId?: string) {
    const where: any = {};
    if (planId && planId !== 'ALL') where.competitionPlanId = planId;
    if (search) {
      where.OR = [
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { accountName: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const accounts = await this.prisma.tradingAccount.findMany({
      where,
      orderBy: [{ points: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { fullName: true, email: true } },
        competitionPlan: true,
        positions: true,
      },
    });

    return {
      success: true,
      accounts: accounts.map((acc, index) => ({
        rank: index + 1,
        id: acc.id,
        accountNumber: acc.accountNumber,
        accountName: acc.accountName,
        userEmail: acc.user?.email,
        userName: acc.user?.fullName,
        planTitle: acc.competitionPlan?.titleAr || 'افتراضي',
        planId: acc.competitionPlanId,
        initialBalance: Number(acc.initialBalance),
        balance: Number(acc.balance),
        equity: Number(acc.equity),
        points: Number(acc.points),
        totalPips: Number(acc.totalPips),
        totalTrades: acc.totalTrades,
        winTrades: acc.winTrades,
        lossTrades: acc.lossTrades,
        openPositionsCount: acc.positions.length,
        status: acc.status,
        createdAt: acc.createdAt,
      })),
    };
  }

  async adminGetAllPlans() {
    const plans = await this.prisma.tradingCompetitionPlan.findMany({
      orderBy: { initialBalance: 'asc' },
      include: {
        _count: { select: { accounts: true } },
      },
    });

    return {
      success: true,
      plans: plans.map((p) => ({
        id: p.id,
        titleAr: p.titleAr,
        titleEn: p.titleEn,
        targetProductType: p.targetProductType,
        targetProductId: p.targetProductId,
        initialBalance: Number(p.initialBalance),
        leverage: p.leverage,
        brokerServer: p.brokerServer,
        maxDailyDrawdown: p.maxDailyDrawdown,
        maxTotalDrawdown: p.maxTotalDrawdown,
        pointsPerPip: p.pointsPerPip,
        badgeName: p.badgeName,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
        isActive: p.isActive,
        accountsCount: p._count.accounts,
      })),
    };
  }

  async adminCreatePlan(dto: CreateCompetitionPlanDto) {
    const plan = await this.prisma.tradingCompetitionPlan.create({
      data: {
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        targetProductType: dto.targetProductType || null,
        targetProductId: dto.targetProductId || null,
        initialBalance: dto.initialBalance,
        leverage: dto.leverage || 100,
        brokerServer: dto.brokerServer || 'FXENGIN Prime ECN',
        maxDailyDrawdown: dto.maxDailyDrawdown || 5.0,
        maxTotalDrawdown: dto.maxTotalDrawdown || 10.0,
        pointsPerPip: dto.pointsPerPip || 1.0,
        badgeName: dto.badgeName || 'PRO TRADER',
        descriptionAr: dto.descriptionAr || null,
        descriptionEn: dto.descriptionEn || null,
        isActive: true,
      },
    });

    return {
      success: true,
      message: 'تم إضافة باقة المسابقة بنجاح!',
      plan,
    };
  }

  async adminUpdatePlan(id: string, dto: UpdateCompetitionPlanDto) {
    const plan = await this.prisma.tradingCompetitionPlan.update({
      where: { id },
      data: {
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        targetProductType: dto.targetProductType,
        targetProductId: dto.targetProductId,
        initialBalance: dto.initialBalance,
        leverage: dto.leverage,
        brokerServer: dto.brokerServer,
        maxDailyDrawdown: dto.maxDailyDrawdown,
        maxTotalDrawdown: dto.maxTotalDrawdown,
        pointsPerPip: dto.pointsPerPip,
        badgeName: dto.badgeName,
        descriptionAr: dto.descriptionAr,
        descriptionEn: dto.descriptionEn,
      },
    });

    return {
      success: true,
      message: 'تم تحديث باقة المسابقة بنجاح!',
      plan,
    };
  }

  async adminDeletePlan(id: string) {
    await this.prisma.tradingCompetitionPlan.delete({ where: { id } });
    return {
      success: true,
      message: 'تم حذف الباقة بنجاح',
    };
  }

  async adminResetAccount(accountId: string) {
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('الحساب غير موجود');

    // حذف الصفقات المفتوحة وإرجاع الرصيد للابتدائي
    await this.prisma.$transaction([
      this.prisma.tradingPosition.deleteMany({ where: { accountId } }),
      this.prisma.tradingAccount.update({
        where: { id: accountId },
        data: {
          balance: account.initialBalance,
          equity: account.initialBalance,
          margin: 0,
          freeMargin: account.initialBalance,
          marginLevel: 0,
          points: 0,
          totalPips: 0,
          winTrades: 0,
          lossTrades: 0,
          totalTrades: 0,
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      success: true,
      message: `تم إعادة ضبط الحساب #${account.accountNumber} لرصيده الابتدائي بنجاح`,
    };
  }

  async adminToggleAccountStatus(accountId: string, status: string) {
    const updated = await this.prisma.tradingAccount.update({
      where: { id: accountId },
      data: { status },
    });

    return {
      success: true,
      message: `تم تغيير حالة الحساب إلى ${status}`,
      account: updated,
    };
  }

  /**
   * إضافة متسابق تجريبي يدوياً (مشترك عبر الشركة) مع كامل تفاصيل الرصيد والنتائج
   */
  async adminCreateManualParticipant(dto: CreateManualParticipantDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    let user = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: cleanEmail,
          fullName: dto.fullName || 'متسابق FXENGIN',
          phoneNumber: dto.phone || null,
          passwordHash: '$2b$10$defaultHashForPurchasedGuestAccountsFXENGIN',
          role: 'USER',
        },
      });
    } else if (dto.fullName && (!user.fullName || user.fullName === 'User' || user.fullName === 'متسابق FXENGIN')) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { fullName: dto.fullName, phoneNumber: dto.phone || user.phoneNumber },
      });
    }

    let plan = null;
    if (dto.planId && dto.planId !== 'ALL') {
      plan = await this.prisma.tradingCompetitionPlan.findUnique({ where: { id: dto.planId } });
    }
    if (!plan) {
      plan = await this.prisma.tradingCompetitionPlan.findFirst({
        where: { isActive: true },
        orderBy: { initialBalance: 'asc' },
      });
    }

    const initialBalance =
      dto.initialBalance !== undefined && dto.initialBalance !== null
        ? Number(dto.initialBalance)
        : plan
        ? Number(plan.initialBalance)
        : 10000.0;

    const balance =
      dto.balance !== undefined && dto.balance !== null
        ? Number(dto.balance)
        : initialBalance;

    const equity =
      dto.equity !== undefined && dto.equity !== null
        ? Number(dto.equity)
        : balance;

    let accountNumber = (dto.accountNumber?.trim()) || '';
    if (accountNumber) {
      const existing = await this.prisma.tradingAccount.findUnique({ where: { accountNumber } });
      if (existing) {
        throw new BadRequestException(`رقم الحساب ${accountNumber} مستخدم بالفعل لمشترك آخر`);
      }
    } else {
      let exists = true;
      while (exists) {
        const candidate = String(500000 + Math.floor(Math.random() * 499999));
        const found = await this.prisma.tradingAccount.findUnique({ where: { accountNumber: candidate } });
        if (!found) {
          accountNumber = candidate;
          exists = false;
        }
      }
    }

    const totalTrades = Number(dto.totalTrades || 0);
    const winTrades = Number(dto.winTrades || 0);
    const lossTrades =
      dto.lossTrades !== undefined ? Number(dto.lossTrades) : Math.max(0, totalTrades - winTrades);
    const points = Number(dto.points || 0);
    const totalPips = Number(dto.totalPips || 0);
    const brokerServer = dto.brokerServer || plan?.brokerServer || 'FXENGIN Prime ECN';
    const leverage = dto.leverage || plan?.leverage || 100;

    const account = await this.prisma.tradingAccount.create({
      data: {
        accountNumber,
        accountName: dto.fullName || user.fullName || 'متسابق المسابقة',
        userId: user.id,
        competitionPlanId: plan ? plan.id : null,
        brokerServer,
        initialBalance,
        balance,
        equity,
        freeMargin: equity,
        margin: 0,
        marginLevel: 0,
        leverage,
        points,
        totalPips,
        totalTrades,
        winTrades,
        lossTrades,
        status: dto.status || 'ACTIVE',
      },
    });

    this.logger.log(
      `Admin created manual trading account #${account.accountNumber} for participant ${user.email} (Company direct subscriber)`,
    );

    return {
      success: true,
      message: 'تم إضافة المتسابق المشترك بنجاح وتأهيله للوحة المتصدرين!',
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        userEmail: user.email,
        userName: dto.fullName || user.fullName,
        planTitle: plan?.titleAr || 'مشترك عبر الشركة',
        planId: account.competitionPlanId,
        initialBalance: Number(account.initialBalance),
        balance: Number(account.balance),
        equity: Number(account.equity),
        points: Number(account.points),
        totalPips: Number(account.totalPips),
        totalTrades: account.totalTrades,
        winTrades: account.winTrades,
        lossTrades: account.lossTrades,
        status: account.status,
        createdAt: account.createdAt,
      },
      userId: user.id,
    };
  }

  /**
   * تحديث بيانات ونتائج حساب متسابق يدوياً
   */
  async adminUpdateAccount(accountId: string, dto: UpdateManualParticipantDto) {
    const existing = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },
      include: { user: true },
    });
    if (!existing) throw new NotFoundException('الحساب التجريبي غير موجود');

    const data: any = {};
    if (dto.fullName) {
      data.accountName = dto.fullName;
      if (existing.userId) {
        await this.prisma.user
          .update({
            where: { id: existing.userId },
            data: { fullName: dto.fullName },
          })
          .catch(() => {});
      }
    }
    if (dto.brokerServer) data.brokerServer = dto.brokerServer;
    if (dto.planId) data.competitionPlanId = dto.planId;
    if (dto.initialBalance !== undefined) data.initialBalance = Number(dto.initialBalance);
    if (dto.balance !== undefined) data.balance = Number(dto.balance);
    if (dto.equity !== undefined) {
      data.equity = Number(dto.equity);
      data.freeMargin = Number(dto.equity);
    }
    if (dto.leverage !== undefined) data.leverage = Number(dto.leverage);
    if (dto.points !== undefined) data.points = Number(dto.points);
    if (dto.totalPips !== undefined) data.totalPips = Number(dto.totalPips);
    if (dto.totalTrades !== undefined) data.totalTrades = Number(dto.totalTrades);
    if (dto.winTrades !== undefined) data.winTrades = Number(dto.winTrades);
    if (dto.lossTrades !== undefined) data.lossTrades = Number(dto.lossTrades);
    if (dto.status) data.status = dto.status;

    const updated = await this.prisma.tradingAccount.update({
      where: { id: accountId },
      data,
      include: {
        user: { select: { fullName: true, email: true } },
        competitionPlan: true,
      },
    });

    return {
      success: true,
      message: 'تم تحديث بيانات حساب المتسابق بنجاح!',
      account: updated,
    };
  }

  /**
   * حذف حساب متسابق من النظام
   */
  async adminDeleteAccount(accountId: string) {
    const existing = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },
    });
    if (!existing) throw new NotFoundException('الحساب غير موجود');

    await this.prisma.tradingAccount.delete({
      where: { id: accountId },
    });

    return {
      success: true,
      message: `تم حذف حساب المتسابق #${existing.accountNumber} بنجاح`,
    };
  }

  /**
   * حساب ومزامنة رصيد الحساب التجريبي للمستخدم بناءً على اشتراكاته في جروبات التداول وكورساته:
   * القاعدة الصارمة:
   * رصيد الحساب التجريبي = (إجمالي المبالغ المدفوعة في جروبات التداول النشطة + الكورسات المشترك بها) × 10
   * مثال: لو اشترك في جروب الذهب بقيمة 200$ -> رصيد الحساب = 2000$
   * مثال: لو اشترك في جروب المؤشرات 100$ + كورس 199$ -> رصيد الحساب = 2990$
   * لو لم يكن مشتركاً في أي جروب أو كورس -> رصيد الحساب = 0.00$
   */
  async getUserTradingAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // 1. جلب الاشتراكات النشطة في مجموعات التداول (SubscriptionPlan)
    const activeSubscriptions = await this.prisma.userSubscription.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        OR: [
          { endDate: null },
          { endDate: { gt: new Date() } },
        ],
      },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalSubsTierBalance = 0;
    let totalSubsPaid = 0;
    const uniquePlansMap = new Map<string, { plan: any; tierBalance: number; paid: number }>();
    for (const sub of activeSubscriptions) {
      if (!sub.plan) continue;
      const slug = (sub.plan.slug || '').toLowerCase();
      const name = (sub.plan.name || '').toLowerCase();
      let tier = 0;
      if (slug.includes('gold') || name.includes('ذهب') || name.includes('gold')) {
        tier = 50000;
      } else if (slug.includes('ind') || name.includes('اندكس') || name.includes('انديكس') || name.includes('index')) {
        tier = 10000;
      } else if (slug.includes('forex') || name.includes('فوركس') || name.includes('فوريكس') || name.includes('forex')) {
        tier = 5000;
      } else {
        tier = 5000;
      }

      if (!uniquePlansMap.has(sub.planId)) {
        uniquePlansMap.set(sub.planId, {
          plan: sub.plan,
          tierBalance: tier,
          paid: Number(sub.paidAmount ?? sub.plan.price ?? 0),
        });
      }
    }

    const groupsBreakdown = Array.from(uniquePlansMap.values()).map(({ plan, tierBalance, paid }) => {
      totalSubsTierBalance += tierBalance;
      totalSubsPaid += paid;
      return {
        id: plan.id,
        planId: plan.id,
        name: plan.name,
        slug: plan.slug,
        paidAmount: paid,
        competitionCredit: tierBalance,
        currency: 'USD',
      };
    });

    // 2. جلب الكورسات المشترك بها فعلياً (CourseEnrollment) - كل كورس يمنح 25,000$ في المسابقة
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: {
        userId,
        status: { in: ['COMPLETED', 'ACTIVE'] },
      },
      include: {
        course: {
          select: { id: true, title: true, slug: true, price: true, discountPrice: true },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const uniqueCoursesMap = new Map<string, any>();
    for (const enr of enrollments) {
      if (enr.courseId && !uniqueCoursesMap.has(enr.courseId)) {
        uniqueCoursesMap.set(enr.courseId, enr);
      }
    }

    let totalCoursesTierBalance = 0;
    let totalCoursesPaid = 0;
    const coursesBreakdown = Array.from(uniqueCoursesMap.values()).map((enr) => {
      const tierBalance = 25000;
      totalCoursesTierBalance += tierBalance;
      const defaultCoursePrice = enr.course?.discountPrice
        ? Number(enr.course.discountPrice)
        : Number(enr.course?.price ?? 0);
      const paid = Number(enr.paidAmount ?? defaultCoursePrice);
      totalCoursesPaid += paid;
      return {
        id: enr.id,
        courseId: enr.courseId,
        title: enr.course?.title,
        slug: enr.course?.slug,
        paidAmount: paid,
        competitionCredit: tierBalance,
        currency: enr.currency || 'USD',
        enrolledAt: enr.enrolledAt,
      };
    });

    const totalPaid = totalSubsPaid + totalCoursesPaid;
    let targetCompetitionInitialBalance = totalSubsTierBalance + totalCoursesTierBalance;
    if ((user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && targetCompetitionInitialBalance === 0) {
      targetCompetitionInitialBalance = 50000;
    }

    // 3. البحث عن حساب تداول المتداول أو إنشائه
    let account = await this.prisma.tradingAccount.findFirst({
      where: { userId },
      include: {
        positions: { orderBy: { openedAt: 'desc' } },
        competitionPlan: true,
      },
    });

    const accountNumber = account?.accountNumber || String(600000 + Math.floor(Math.random() * 399999));

    if (!account) {
      account = await this.prisma.tradingAccount.create({
        data: {
          accountNumber,
          accountName: user.fullName || 'حساب المسابقة',
          userId: user.id,
          brokerServer: 'FXENGIN Competition Server',
          initialBalance: targetCompetitionInitialBalance,
          balance: targetCompetitionInitialBalance,
          equity: targetCompetitionInitialBalance,
          freeMargin: targetCompetitionInitialBalance,
          margin: 0,
          marginLevel: 0,
          leverage: 100,
          status: 'ACTIVE',
        },
        include: {
          positions: true,
          competitionPlan: true,
        },
      });
      this.logger.log(`Created new Competition Trading Account #${account.accountNumber} for user ${user.email} with competition balance: ${targetCompetitionInitialBalance}$`);
    } else {
      // إذا تغيرت المجموعات أو الكورسات
      const currentInitial = Number(account.initialBalance);
      if (Math.abs(currentInitial - targetCompetitionInitialBalance) > 0.01) {
        const diff = targetCompetitionInitialBalance - currentInitial;
        const newBalance = Math.max(0, Number(account.balance) + diff);
        const newEquity = Math.max(0, Number(account.equity) + diff);
        const newFreeMargin = Math.max(0, Number(account.freeMargin) + diff);

        account = await this.prisma.tradingAccount.update({
          where: { id: account.id },
          data: {
            initialBalance: targetCompetitionInitialBalance,
            balance: newBalance,
            equity: newEquity,
            freeMargin: newFreeMargin,
            brokerServer: 'FXENGIN Competition Server',
            status: 'ACTIVE',
          },
          include: {
            positions: { orderBy: { openedAt: 'desc' } },
            competitionPlan: true,
          },
        });
        this.logger.log(`Synchronized Competition Trading Account #${account.accountNumber} balance: ${newBalance}$ (Target initial: ${targetCompetitionInitialBalance}$)`);
      }
    }

    // حساب الأرباح العائمة والهامش
    let totalMargin = 0;
    let totalFloatingProfit = 0;
    for (const pos of account.positions) {
      const contractSize = this.getSymbolContractSize(pos.symbol);
      const posMargin = (Number(pos.lots) * contractSize * Number(pos.openPrice)) / account.leverage;
      totalMargin += posMargin;
      totalFloatingProfit += Number(pos.profit);
    }

    const currentBalance = Number(account.balance);
    const equity = Math.max(0, currentBalance + totalFloatingProfit);
    const freeMargin = Math.max(0, equity - totalMargin);
    const marginLevel = totalMargin > 0 ? (equity / totalMargin) * 100 : 0;

    const qualifiedUserIds = this.getQualifiedUserIds();
    const isCompetitionQualified = qualifiedUserIds.has(userId);

    return {
      success: true,
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        balance: currentBalance,
        equity,
        margin: totalMargin,
        freeMargin,
        marginLevel,
        leverage: account.leverage,
        brokerServer: account.brokerServer,
        initialBalance: Number(account.initialBalance),
        points: Number(account.points),
        totalPips: Number(account.totalPips),
        winTrades: account.winTrades,
        lossTrades: account.lossTrades,
        totalTrades: account.totalTrades,
        status: account.status,
        isCompetitionQualified,
      },
      fundingBreakdown: {
        totalPaid,
        totalSubsTierBalance,
        totalCoursesTierBalance,
        targetCompetitionBalance: targetCompetitionInitialBalance,
        hasActiveSubscriptions: activeSubscriptions.length > 0,
        hasEnrolledCourses: enrollments.length > 0,
        isCompetitionQualified,
        groups: groupsBreakdown,
        courses: coursesBreakdown,
        ruleText: 'رصيد التداول التجريبي: جروب الذهب (50,000$) • الكورسات (25,000$) • جروب الاندكس (10,000$) • جروب الفوركس (5,000$)',
      },
      positions: account.positions.map((p) => ({
        id: p.id,
        ticket: p.ticket,
        symbol: p.symbol,
        type: p.type,
        lots: Number(p.lots),
        openPrice: Number(p.openPrice),
        currentPrice: Number(p.currentPrice),
        stopLoss: p.stopLoss ? Number(p.stopLoss) : null,
        takeProfit: p.takeProfit ? Number(p.takeProfit) : null,
        profit: Number(p.profit),
        pips: Number(p.pips),
        swap: Number(p.swap),
        commission: Number(p.commission),
        openedAt: p.openedAt,
      })),
    };
  }

  async syncUserDemoBalance(userId: string) {
    try {
      await this.getUserTradingAccount(userId);
    } catch (e) {
      this.logger.warn(`Failed to sync demo balance for user ${userId}: ${e.message}`);
    }
  }
}
