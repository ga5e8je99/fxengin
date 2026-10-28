import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getAccountsFilePath() {
  const candidates = [
    path.resolve('/app', 'data', 'broker-accounts.json'),
    path.resolve(process.cwd(), '..', 'shared-data', 'broker-accounts.json'),
    path.resolve(process.cwd(), 'shared-data', 'broker-accounts.json'),
    path.join(process.cwd(), 'data', 'broker-accounts.json'),
    path.resolve(process.cwd(), '..', 'frontend', 'data', 'broker-accounts.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), 'data', 'broker-accounts.json');
}

function readAccounts() {
  const fp = getAccountsFilePath();
  try {
    if (fs.existsSync(fp)) {
      const content = fs.readFileSync(fp, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading broker-accounts.json:', e);
  }
  return [];
}

function writeAccounts(accounts) {
  const targetPaths = [
    getAccountsFilePath(),
    path.join(process.cwd(), 'data', 'broker-accounts.json'),
    path.resolve(process.cwd(), '..', 'shared-data', 'broker-accounts.json'),
    path.resolve(process.cwd(), 'shared-data', 'broker-accounts.json'),
    path.resolve(process.cwd(), '..', 'frontend', 'data', 'broker-accounts.json'),
    path.resolve('/app', 'data', 'broker-accounts.json'),
  ];
  const uniquePaths = Array.from(new Set(targetPaths));
  let ok = false;
  for (const fp of uniquePaths) {
    try {
      const dir = path.dirname(fp);
      if (fs.existsSync(dir)) {
        fs.writeFileSync(fp, JSON.stringify(accounts, null, 2), 'utf-8');
        ok = true;
      }
    } catch (_) {}
  }
  return ok;
}

export async function GET(request) {
  try {
    const accounts = readAccounts();
    return NextResponse.json({
      success: true,
      data: accounts,
      total: accounts.length,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const accounts = readAccounts();

    const newAccount = {
      ...body,
      id: body.id || `brk_${Date.now()}`,
      registeredAt: body.registeredAt || new Date().toISOString(),
      status: body.status || 'ACTIVE',
    };

    accounts.push(newAccount);
    writeAccounts(accounts);

    return NextResponse.json({ success: true, account: newAccount });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف الحساب مطلوب' }, { status: 400 });
    }

    const accounts = readAccounts();
    const idx = accounts.findIndex((a) => a.id === id || a.brokerSlug === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'الحساب غير موجود' }, { status: 404 });
    }

    accounts[idx] = {
      ...accounts[idx],
      ...updates,
    };

    writeAccounts(accounts);

    return NextResponse.json({ success: true, account: accounts[idx] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
