import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8887794694:AAFwA33_54SK4SiaVDapNpQFP_NfB9kVkXo';
const FALLBACK_BOT_TOKEN = '8446714836:AAGUN--4SDnrmN2bXaiCz_rL1u39AwGRr10';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5108366071';

export async function POST(req) {
  try {
    const data = await req.json();
    const {
      orderId,
      itemTitle,
      price,
      currency = 'USDT',
      customerName,
      customerEmail,
      customerTelegram,
      paymentMethod = 'الدفع عبر USDT (شبكة TRC-20)',
      dateStr = new Date().toLocaleString('ar-EG'),
    } = data;

    const messageText = `<b>طلب اشتراك جديد في FXENGIN</b>

<b>رقم الطلب:</b> <code>${orderId || 'FX-PENDING'}</code>
<b>الباقة / الخدمة:</b> <b>${itemTitle || 'مجموعة التحليلات'}</b>
<b>المبلغ المستحق:</b> <code>${price} ${currency}</code>
<b>اسم العميل:</b> ${customerName || 'مشترك جديد'}
<b>البريد الإلكتروني:</b> ${customerEmail || 'غير محدد'}
<b>حساب / هاتف تيليجرام:</b> ${customerTelegram || 'غير محدد'}
<b>وسيلة الدفع:</b> ${paymentMethod}
<b>الوقت:</b> ${dateStr}

<i>يرجى مراجعة إيصال السداد وتفعيل الصلاحيات للمشترك.</i>`;

    // Try primary bot (FXenginGoldbot)
    let sent = false;
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: messageText,
          parse_mode: 'HTML',
        }),
      });
      const resJson = await res.json();
      if (resJson.ok) sent = true;
    } catch (e) {
      console.warn('Primary telegram notify error:', e);
    }

    // Try fallback bot if primary failed
    if (!sent) {
      try {
        const res2 = await fetch(`https://api.telegram.org/bot${FALLBACK_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: messageText,
            parse_mode: 'HTML',
          }),
        });
        const res2Json = await res2.json();
        if (res2Json.ok) sent = true;
      } catch (e2) {
        console.warn('Fallback telegram notify error:', e2);
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (err) {
    console.error('Order notify handler error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
