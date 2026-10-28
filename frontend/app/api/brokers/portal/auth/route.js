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
    path.resolve(process.cwd(), '..', 'admin', 'data', 'broker-accounts.json'),
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

export async function POST(request) {
  try {
    const body = await request.json();
    const { usernameOrEmail, password, demoBrokerId } = body;

    const accounts = readAccounts();

    // Support quick 1-click demo login for fast testing
    if (demoBrokerId) {
      const found = accounts.find(
        (a) => a.id === demoBrokerId || a.brokerSlug === demoBrokerId
      );
      if (found) {
        const { password: _, ...safeAccount } = found;
        return NextResponse.json({
          success: true,
          broker: safeAccount,
          token: `bktkn_${found.id}_${Date.now()}`,
          message: 'تم تسجيل الدخول بنجاح بحساب الشريك التجريبي',
        });
      }
    }

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني وكلمة المرور' },
        { status: 400 }
      );
    }

    const cleanInput = String(usernameOrEmail).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    const matched = accounts.find((acc) => {
      const matchesEmail = acc.email && acc.email.toLowerCase() === cleanInput;
      const matchesUsername = acc.username && acc.username.toLowerCase() === cleanInput;
      const matchesId = acc.id && acc.id.toLowerCase() === cleanInput;
      return (matchesEmail || matchesUsername || matchesId);
    });

    if (!matched) {
      return NextResponse.json(
        { success: false, error: 'بيانات الدخول غير صحيحة. يرجى التأكد من اسم المستخدم أو البريد.' },
        { status: 401 }
      );
    }

    if (matched.password !== cleanPassword) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى أو مراجعة مسؤول الحساب.' },
        { status: 401 }
      );
    }

    if (matched.status === 'INACTIVE' || matched.status === 'SUSPENDED') {
      return NextResponse.json(
        { success: false, error: 'حساب الوسيط الشريك غير مفعل حالياً. يرجى التواصل مع إدارة المنظومة.' },
        { status: 403 }
      );
    }

    const { password: _, ...safeAccount } = matched;

    return NextResponse.json({
      success: true,
      broker: safeAccount,
      token: `bktkn_${matched.id}_${Date.now()}`,
      message: 'تم تسجيل دخول الوسيط الشريك بنجاح',
    });
  } catch (error) {
    console.error('Broker auth error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get('id');

    const accounts = readAccounts();

    if (brokerId) {
      const matched = accounts.find(
        (a) => a.id === brokerId || a.brokerSlug === brokerId
      );
      if (!matched) {
        return NextResponse.json({ success: false, error: 'حساب الوسيط غير موجود' }, { status: 404 });
      }
      const { password: _, ...safeAccount } = matched;
      return NextResponse.json({ success: true, broker: safeAccount });
    }

    // Return list of available partner accounts for selection (without passwords)
    const publicAccounts = accounts.map(({ password: _, ...rest }) => rest);
    return NextResponse.json({ success: true, accounts: publicAccounts });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
