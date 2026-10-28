import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getContractsFilePath() {
  const candidates = [
    path.resolve('/app', 'data', 'broker-contracts.json'),
    path.resolve(process.cwd(), '..', 'shared-data', 'broker-contracts.json'),
    path.resolve(process.cwd(), 'shared-data', 'broker-contracts.json'),
    path.join(process.cwd(), 'data', 'broker-contracts.json'),
    path.resolve(process.cwd(), '..', 'admin', 'data', 'broker-contracts.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), 'data', 'broker-contracts.json');
}

function readContracts() {
  const fp = getContractsFilePath();
  try {
    if (fs.existsSync(fp)) {
      const content = fs.readFileSync(fp, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading broker-contracts.json:', e);
  }
  return [];
}

function writeContracts(contracts) {
  const targetPaths = [
    getContractsFilePath(),
    path.join(process.cwd(), 'data', 'broker-contracts.json'),
    path.resolve(process.cwd(), '..', 'shared-data', 'broker-contracts.json'),
    path.resolve(process.cwd(), 'shared-data', 'broker-contracts.json'),
    path.resolve('/app', 'data', 'broker-contracts.json'),
  ];
  const uniquePaths = Array.from(new Set(targetPaths));
  let ok = false;
  for (const fp of uniquePaths) {
    try {
      const dir = path.dirname(fp);
      if (fs.existsSync(dir)) {
        fs.writeFileSync(fp, JSON.stringify(contracts, null, 2), 'utf-8');
        ok = true;
      }
    } catch (_) {}
  }
  return ok;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get('brokerId');
    const type = searchParams.get('type');

    let contracts = readContracts();

    if (brokerId && brokerId !== 'all') {
      contracts = contracts.filter((c) => c.brokerId === brokerId || c.brokerSlug === brokerId);
    }

    if (type && type !== 'all') {
      contracts = contracts.filter((c) => c.contractType === type);
    }

    contracts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return NextResponse.json({
      success: true,
      data: contracts,
      total: contracts.length,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      brokerId,
      brokerName,
      contractType, // AD_CAMPAIGN, PROMOTIONAL_OFFER
      packageTitleAr,
      packageTitleEn,
      placement,
      campaignTitle,
      targetUrl,
      bannerImage,
      startDate,
      endDate,
      durationMonths,
      budgetUsd,
      couponCode,
      notes,
    } = body;

    if (!brokerId || !campaignTitle || !startDate) {
      return NextResponse.json(
        { success: false, error: 'يرجى ملء الحقول الأساسية لطلب التعاقد (عنوان الحملة، وتاريخ البدء)' },
        { status: 400 }
      );
    }

    const contracts = readContracts();
    const newId = `CTR-${new Date().getFullYear()}-${String(contracts.length + 101)}`;

    const newContract = {
      id: newId,
      brokerId,
      brokerSlug: brokerId,
      brokerName: brokerName || 'شريك FXENGIN المتعاقد',
      contractType: contractType || 'AD_CAMPAIGN',
      packageTitleAr: packageTitleAr || 'باقة إعلانية مخصصة',
      packageTitleEn: packageTitleEn || 'Custom Ad Package',
      placement: placement || 'HORIZONTAL_BANNER',
      campaignTitle: String(campaignTitle).trim(),
      targetUrl: targetUrl || '#',
      bannerImage: bannerImage || '/assets/Images/brokers/xm.webp',
      startDate: String(startDate),
      endDate: endDate || '',
      durationMonths: Number(durationMonths) || 3,
      budgetUsd: Number(budgetUsd) || 5000,
      impressionsCount: 0,
      clicksCount: 0,
      status: 'PENDING_REVIEW', // Initial status
      paymentStatus: 'PENDING',
      couponCode: couponCode || '',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    contracts.unshift(newContract);
    writeContracts(contracts);

    return NextResponse.json({
      success: true,
      message: 'تم إرسال طلب التعاقد بنجاح، جاري مراجعة الباقة من قبل إدارة الإعلانات',
      contract: newContract,
    });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json({ success: false, error: 'تعذر حفظ طلب التعاقد' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف العقد مطلوب' }, { status: 400 });
    }

    const contracts = readContracts();
    const idx = contracts.findIndex((c) => c.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'العقد غير موجود' }, { status: 404 });
    }

    contracts[idx] = {
      ...contracts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeContracts(contracts);

    return NextResponse.json({
      success: true,
      message: 'تم تحديث بيانات العقد بنجاح',
      contract: contracts[idx],
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
