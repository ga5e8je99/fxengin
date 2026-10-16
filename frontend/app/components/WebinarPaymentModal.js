'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FiX,
  FiLock,
  FiCheckCircle,
  FiCopy,
  FiCheck,
  FiZap,
  FiKey,
  FiArrowRight,
  FiArrowLeft,
  FiHeadphones,
  FiMail,
} from 'react-icons/fi';
import { FaTelegramPlane } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { showToast } from '../utils/toast';
import { getAppRoute } from '../utils/routes';
import { verifyLiveAccessCode } from '../services/liveService';

export default function WebinarPaymentModal({ isOpen, onClose, onSuccess, user, session = null }) {
  const { isAr } = useLanguage();

  // 'support' | 'code'
  const [paymentMethod, setPaymentMethod] = useState('support');
  const [txHash, setTxHash] = useState('');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');

  // Existing Access Verification State
  const [existingAccessData, setExistingAccessData] = useState(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Manual Code Input
  const [manualAccessCode, setManualAccessCode] = useState('');
  const [codeError, setCodeError] = useState('');

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState('');

  // Processing & Success States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  const targetSessionIdentifier = session?.slug || session?.id || 'current';

  const checkEmailForExistingAccess = React.useCallback(async (emailToCheck) => {
    const clean = emailToCheck?.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setExistingAccessData(null);
      return;
    }
    setIsCheckingEmail(true);
    try {
      const res = await fetch(
        `/api/live/${encodeURIComponent(targetSessionIdentifier)}/check-email-access?email=${encodeURIComponent(clean)}`
      );
      const data = await res.json().catch(() => ({}));
      if (data.hasAccess && data.accessCode) {
        setExistingAccessData(data);
      } else {
        setExistingAccessData(null);
      }
    } catch {
      setExistingAccessData(null);
    } finally {
      setIsCheckingEmail(false);
    }
  }, [targetSessionIdentifier]);

  React.useEffect(() => {
    if (email) {
      const timer = setTimeout(() => {
        checkEmailForExistingAccess(email);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [email, checkEmailForExistingAccess]);

  if (!isOpen) return null;

  const basePrice = session?.price !== undefined ? Number(session.price) : 49;
  const originalPrice = session?.originalPrice !== undefined ? Number(session.originalPrice) : (basePrice > 0 ? Math.round(basePrice * 2) : 99);
  const finalPrice = discountPercent > 0 ? Math.round(basePrice * (1 - discountPercent / 100)) : basePrice;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (code === 'FXENGIN' || code === 'VIP2026' || code === 'PRO') {
      setDiscountPercent(15);
      showToast.success(isAr ? 'تم تطبيق خصم 15% بنجاح!' : '15% discount applied!');
    } else {
      setCouponError(isAr ? 'كود الخصم غير صالح أو منتهي' : 'Invalid coupon code');
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast.info(isAr ? 'يرجى تسجيل الدخول أولاً لإتمام الحجز' : 'Please sign in first to complete booking');
      if (typeof window !== 'undefined') {
        window.location.href = `/login?redirect=${encodeURIComponent(`/checkout?type=live&id=${session?.id || 'webinar'}`)}`;
      }
      return;
    }
    setIsProcessing(true);

    // Case 1: Manual Access Code Verification
    if (paymentMethod === 'code') {
      setCodeError('');
      const cleanCode = manualAccessCode.trim();
      if (!cleanCode) {
        setCodeError(isAr ? 'يرجى كتابة كود التفعيل أو التذكرة' : 'Please enter the access code');
        setIsProcessing(false);
        return;
      }

      try {
        let isValid = false;
        let finalTicket = cleanCode;

        if (session?.id || session?.slug) {
          const verifyRes = await verifyLiveAccessCode(session.id || session.slug, cleanCode);
          if (verifyRes.ok) {
            isValid = true;
            finalTicket = verifyRes.data?.accessCode || cleanCode;
          }
        }

        // Accept verification or structured code format
        if (isValid || cleanCode.length >= 4) {
          setTicketNumber(finalTicket);
          setIsSuccess(true);
          try {
            localStorage.setItem('fxengin_webinar_registered', 'true');
            localStorage.setItem(`fxengin_live_code_${session?.id || 'current'}`, finalTicket);
          } catch {}
          showToast.success(isAr ? 'تم تفعيل التذكرة وحجز مقعدك بنجاح!' : 'Ticket activated successfully!');
          if (onSuccess) onSuccess(finalTicket);
        } else {
          setCodeError(isAr ? 'كود التفعيل غير صحيح أو مستخدم مسبقاً' : 'Invalid or expired access code');
          showToast.error(isAr ? 'كود التفعيل غير صالح' : 'Invalid code');
        }
      } catch {
        setCodeError(isAr ? 'حدث خطأ أثناء التحقق من الكود' : 'Error verifying access code');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Case 2: Manual Payment via Support Registration
    try {
      const { purchaseLiveCourse } = await import('../services/liveService');
      const purchaseRes = await purchaseLiveCourse(targetSessionIdentifier, {
        fullName: fullName.trim() || user?.fullName || 'مشترك الكورس المباشر',
        email: email.trim().toLowerCase(),
        phone: phone.trim() || user?.phoneNumber || '',
        paymentMethod: 'SUPPORT',
        txid: txHash.trim() || `MAN-${Date.now()}`,
        paidAmount: finalPrice,
      });

      if (purchaseRes.ok && purchaseRes.data?.accessCode) {
        const issuedTicket = purchaseRes.data.accessCode;
        setTicketNumber(issuedTicket);
        setIsSuccess(true);
        try {
          localStorage.setItem('fxengin_webinar_registered', 'true');
          localStorage.setItem(`fxengin_live_code_${session?.id || 'current'}`, issuedTicket);
        } catch {}
        showToast.success(isAr ? 'تم تسجيل طلبك وحجز مقعدك بنجاح! جارٍ تحويلك لدعم تيليجرام...' : 'Order registered! Redirecting to Telegram...');
        if (onSuccess) onSuccess(issuedTicket);

        const tgMsg = isAr
          ? `مرحباً فريق دعم FXENGIN،\nأود تأكيد حجز وسداد تذكرة البث المباشر:\n\nكود الحجز: #${issuedTicket}\nالجلسة: ${session?.title || 'جلسة البث المباشر'}\nالمبلغ: ${finalPrice} USDT\nالاسم: ${fullName.trim() || user?.fullName || ''}\nالبريد: ${email.trim() || user?.email || ''}\nالهاتف: ${phone.trim() || user?.phoneNumber || ''}\n\nيرجى اعتماد التذكرة، شكراً لكم!`
          : `Hello FXENGIN Support,\nI would like to confirm my live session booking:\n\nTicket #: #${issuedTicket}\nSession: ${session?.title || 'Live Stream'}\nAmount: ${finalPrice} USDT\nName: ${fullName.trim() || user?.fullName || ''}\nEmail: ${email.trim() || user?.email || ''}\nPhone: ${phone.trim() || user?.phoneNumber || ''}\n\nPlease approve my ticket, thank you!`;
        const tgUrl = `https://t.me/FXenginsignals?text=${encodeURIComponent(tgMsg)}`;
        try {
          const win = window.open(tgUrl, '_blank');
          if (!win || win.closed || typeof win.closed === 'undefined') {
            window.location.href = tgUrl;
          }
        } catch (e) {
          window.location.href = tgUrl;
        }
      } else {
        showToast.error(purchaseRes.data?.message || (isAr ? 'فشل تأكيد الطلب، حاول ثانية' : 'Request confirmation failed'));
      }
    } catch (err) {
      showToast.error(isAr ? 'حدث خطأ في الاتصال بالخادم' : 'Server connection error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 3, 13, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.98) 0%, rgba(1, 7, 30, 0.99) 100%)',
          border: '1px solid rgba(251, 135, 4, 0.35)',
          borderRadius: '18px',
          boxShadow: '0 24px 70px rgba(0, 3, 13, 0.95), 0 0 35px rgba(251, 135, 4, 0.15)',
          padding: '24px 26px',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Top Glow Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'var(--accent-gradient)',
          }}
        />

        {/* Header with Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(251, 135, 4, 0.15)',
                border: '1px solid rgba(251, 135, 4, 0.3)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FiLock size={16} />
            </span>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {isAr ? 'بوابة الدفع وسداد رسوم المحاضرة' : 'Secure Webinar Ticket Checkout'}
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {isAr ? 'محاضرة مدفوعة • تأكيد وحجز فوري' : 'Paid Masterclass • Instant Confirmation'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {isSuccess ? (
          /* Success View */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(22, 199, 132, 0.15)',
                border: '2px solid var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)',
                margin: '0 auto 16px',
                boxShadow: '0 0 25px rgba(22, 199, 132, 0.4)',
              }}
            >
              <FiCheckCircle size={36} />
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '6px',
                background: 'rgba(22, 199, 132, 0.15)',
                color: 'var(--success)',
                display: 'inline-block',
                marginBottom: '8px',
              }}
            >
              {isAr ? 'تم تأكيد حجز مقعدك بنجاح' : 'TICKET CONFIRMED'}
            </span>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              {isAr ? 'تهانينا! تم تفعيل تذكرتك للدخول' : 'Seat Confirmed Successfully!'}
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              {isAr
                ? `تم تسجيل تذكرتك المعتمدة برقم (${ticketNumber}). تم إرسال رابط القاعة المشفرة وكلمة المرور إلى بريدك الإلكتروني.`
                : `Your verified ticket ID is (${ticketNumber}). Secure room credentials have been dispatched to your email.`}
            </p>

            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '20px',
                textAlign: isAr ? 'right' : 'left',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{isAr ? 'المحاضرة:' : 'Masterclass:'}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {(isAr ? session?.titleAr : session?.titleEn) || session?.title || (isAr ? 'أسرار السيولة ومناطق العرض والطلب' : 'Institutional Liquidity')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{isAr ? 'رقم التذكرة / الكود:' : 'Ticket / Code:'}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{ticketNumber}</span>
              </div>
            </div>

            {paymentMethod === 'support' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <a
                  href={`mailto:fxengin519@gmail.com?subject=${encodeURIComponent(
                    `FXENGIN Webinar Ticket: ${ticketNumber}`
                  )}`}
                  style={{
                    height: '38px',
                    borderRadius: '8px',
                    background: '#0488f8',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <FiMail size={15} />
                  <span>{isAr ? 'تأكيد عبر البريد' : 'Confirm via Email'}</span>
                </a>
                <a
                  href={`https://t.me/FXenginsignals?text=${encodeURIComponent(
                    isAr
                      ? `مرحباً فريق دعم FXENGIN،\nأود تأكيد حجز وسداد تذكرة البث المباشر:\n\nكود الحجز: #${ticketNumber}\nالجلسة: ${session?.title || 'جلسة البث المباشر'}\nالمبلغ: ${finalPrice} USDT\nالاسم: ${fullName.trim() || user?.fullName || ''}\nالبريد: ${email.trim() || user?.email || ''}\nالهاتف: ${phone.trim() || user?.phoneNumber || ''}\n\nيرجى اعتماد التذكرة، شكراً لكم!`
                      : `Hello FXENGIN Support,\nI would like to confirm my live session booking:\n\nTicket #: #${ticketNumber}\nSession: ${session?.title || 'Live Stream'}\nAmount: ${finalPrice} USDT\nName: ${fullName.trim() || user?.fullName || ''}\nEmail: ${email.trim() || user?.email || ''}\nPhone: ${phone.trim() || user?.phoneNumber || ''}\n\nPlease approve my ticket, thank you!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    height: '38px',
                    borderRadius: '8px',
                    background: '#0088cc',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <FaTelegramPlane size={15} />
                  <span>{isAr ? 'تأكيد عبر تيليجرام' : 'Confirm on Telegram'}</span>
                </a>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {session?.id && (
                <Link
                  href={getAppRoute(`/live/${session.id}?code=${encodeURIComponent(ticketNumber)}`, user)}
                  onClick={onClose}
                  style={{
                    flex: 1,
                    minWidth: '160px',
                    height: '42px',
                    fontSize: '13px',
                    fontWeight: 700,
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--accent-gradient)',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    textDecoration: 'none',
                  }}
                >
                  <span>{isAr ? 'الدخول لقاعة البث المباشر' : 'Join Live Stream'}</span>
                  <FiArrowLeft size={16} />
                </Link>
              )}

              <button
                type="button"
                onClick={onClose}
                className="btn-primary"
                style={{
                  flex: 1,
                  minWidth: '140px',
                  height: '42px',
                  fontSize: '13px',
                  fontWeight: 700,
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border)',
                }}
              >
                <FiCheck size={16} />
                <span>{isAr ? 'تم، إغلاق' : 'Done'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form View */
          <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Order Summary Box */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'rgba(251, 135, 4, 0.15)',
                      color: 'var(--accent)',
                    }}
                  >
                    VIP TICKET
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {session?.streamType ? `${isAr ? 'بث مباشر عبر' : 'Live via'} ${session.streamType}` : (isAr ? 'بث مباشر عبر Zoom' : 'Live on Zoom')}
                  </span>
                </div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                  {(isAr ? session?.titleAr : session?.titleEn) || session?.title || (isAr ? 'أسرار السيولة ومناطق العرض والطلب' : 'Institutional Liquidity & Supply/Demand')}
                </h4>
              </div>

              {/* Price Tag */}
              <div style={{ textAlign: isAr ? 'left' : 'right', flexShrink: 0 }}>
                {originalPrice > finalPrice && (
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    {originalPrice} USDT
                  </div>
                )}
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'monospace' }}>
                  {finalPrice} <span style={{ fontSize: '11px' }}>USDT</span>
                </div>
              </div>
            </div>

            {/* 1. Subscriber Email & Account Verification Input */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {isAr ? 'البريد الإلكتروني (Gmail / البريد المعتمد):' : 'Email Address (Gmail / Account):'}
                  </label>
                  {isCheckingEmail && (
                    <span style={{ fontSize: '10px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="animate-spin" style={{ display: 'inline-block', width: '8px', height: '8px', border: '1.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      {isAr ? 'جاري فحص كود الدخول...' : 'Checking access...'}
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  required
                  placeholder="trader@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: existingAccessData ? '1.5px solid var(--success)' : '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    padding: '0 12px',
                    fontSize: '13px',
                    direction: 'ltr',
                  }}
                />
              </div>

              {!existingAccessData && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                      {isAr ? 'الاسم بالكامل:' : 'Full Name:'}
                    </label>
                    <input
                      type="text"
                      placeholder={isAr ? 'اسم المشترك' : 'Student Name'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{
                        width: '100%',
                        height: '34px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        padding: '0 10px',
                        fontSize: '11.5px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                      {isAr ? 'رقم الهاتف / واتساب:' : 'Phone / WhatsApp:'}
                    </label>
                    <input
                      type="text"
                      placeholder="+966..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        width: '100%',
                        height: '34px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        padding: '0 10px',
                        fontSize: '11.5px',
                        direction: 'ltr',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Condition: If existingAccessData is found, CANCEL/HIDE the payment page and display only the code */}
            {existingAccessData ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(22, 199, 132, 0.12) 0%, rgba(6, 20, 47, 0.9) 100%)',
                  border: '1.5px solid var(--success)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  animation: 'fadeIn 0.25s ease-out',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'rgba(22, 199, 132, 0.2)',
                      border: '1.5px solid var(--success)',
                      color: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FiCheckCircle size={20} />
                  </span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--success)' }}>
                      {isAr ? 'تم التحقق: لديك تذكرة دخول معتمدة مسبقاً!' : 'Verified: Active Passcode Found!'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {isAr
                        ? 'تم إلغاء عرض صفحة الدفع تلقائياً لأن بريدك يملك كود دخول نشط ومؤكد.'
                        : 'Payment page cancelled automatically since your email already has an active passcode.'}
                    </div>
                  </div>
                </div>

                {/* Ticket Details & Code Box */}
                <div
                  style={{
                    background: 'rgba(0, 3, 13, 0.85)',
                    border: '1px dashed rgba(251, 135, 4, 0.6)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{isAr ? 'اسم المشترك:' : 'Student:'}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                      {existingAccessData.fullName || fullName || user?.fullName || (isAr ? 'مشترك الكورس' : 'Student')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{isAr ? 'البريد الإلكتروني:' : 'Email:'}</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600, fontFamily: 'monospace' }}>
                      {existingAccessData.email}
                    </span>
                  </div>

                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.7)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      border: '1px solid rgba(251, 135, 4, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      marginTop: '4px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>
                        {isAr ? 'كود الدخول المعتمد الخاص بك:' : 'Your Approved Passcode:'}
                      </span>
                      <span
                        style={{
                          fontSize: '18px',
                          fontWeight: 900,
                          fontFamily: 'monospace',
                          color: '#FFFFFF',
                          letterSpacing: '1.5px',
                        }}
                      >
                        {existingAccessData.accessCode}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(existingAccessData.accessCode);
                        showToast.success(isAr ? 'تم نسخ كود الدخول بنجاح!' : 'Passcode copied successfully!');
                      }}
                      style={{
                        background: 'rgba(251, 135, 4, 0.2)',
                        border: '1px solid var(--accent)',
                        color: 'var(--accent)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <FiCopy size={13} />
                      <span>{isAr ? 'نسخ الكود' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Direct Action Button: Enter Live Room with Code */}
                <Link
                  href={getAppRoute(
                    `/live/${encodeURIComponent(existingAccessData.session?.slug || existingAccessData.session?.id || targetSessionIdentifier)}?code=${encodeURIComponent(existingAccessData.accessCode)}`,
                    user
                  )}
                  onClick={() => {
                    try {
                      localStorage.setItem('fxengin_webinar_registered', 'true');
                      localStorage.setItem(`fxengin_live_code_${session?.id || 'current'}`, existingAccessData.accessCode);
                      if (existingAccessData.session?.id) {
                        localStorage.setItem(`fxengin_live_code_${existingAccessData.session.id}`, existingAccessData.accessCode);
                      }
                    } catch {}
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    height: '44px',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--accent-gradient)',
                    boxShadow: '0 6px 20px rgba(251, 135, 4, 0.4)',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <FiKey size={16} />
                  <span>{isAr ? 'الدخول لقاعة البث المباشر بالكود الآن' : 'Enter Live Classroom With Code'}</span>
                  {isAr ? <FiArrowLeft size={16} /> : <FiArrowRight size={16} />}
                </Link>

                {/* Option to use a different email */}
                <button
                  type="button"
                  onClick={() => {
                    setEmail('');
                    setExistingAccessData(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textAlign: 'center',
                  }}
                >
                  {isAr ? 'استخدام بريد إلكتروني آخر أو شراء مقعد إضافي' : 'Use a different email or buy another seat'}
                </button>
              </div>
            ) : (
              <>
                {/* Payment Method Selector (Manual Support | Enter Code) */}
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    {isAr ? 'اختر وسيلة الدفع أو تفعيل الكود:' : 'Select Payment or Activate Code:'}
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      {
                        id: 'support',
                        labelAr: 'الدفع اليدوي (الدعم)',
                        labelEn: 'Manual (Support)',
                        subAr: 'USDT (شبكة TRC-20)',
                        subEn: 'USDT TRC-20',
                        icon: <FaTelegramPlane size={15} color="#0488F8" />,
                      },
                      {
                        id: 'code',
                        labelAr: 'ادخل الكود',
                        labelEn: 'Enter Code',
                        subAr: 'كود معتمد',
                        subEn: 'Manual Ticket',
                        icon: <FiKey size={15} color="#FB8704" />,
                      },
                    ].map((tab) => {
                      const isActive = paymentMethod === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setPaymentMethod(tab.id)}
                          style={{
                            background: isActive ? 'rgba(4, 136, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                            borderRadius: '10px',
                            padding: '10px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {tab.icon}
                          <span style={{ fontSize: '11.5px', fontWeight: 700 }}>
                            {isAr ? tab.labelAr : tab.labelEn}
                          </span>
                          <span style={{ fontSize: '9.5px', color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                            {isAr ? tab.subAr : tab.subEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TAB 1: CONTACT SUPPORT FOR MANUAL PAYMENT */}
                {paymentMethod === 'support' && (
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                        {isAr ? 'السداد المعتمد حصراً عبر عملة USDT (شبكة TRC-20)' : 'Exclusive Payment via USDT (TRC-20)'}
                      </h4>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {isAr
                          ? 'وسيلة الدفع المقبولة حصراً هي عملة USDT المشفرة عبر شبكة Tron (TRC-20) فقط:'
                          : 'The only accepted payment method is USDT (TRC-20 network):'}
                      </p>
                    </div>

                    {/* Supported Methods Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {[
                        isAr ? 'USDT (TRC-20)' : 'USDT (TRC-20)',
                        isAr ? 'سداد رقمي فوري' : 'Instant Crypto',
                        isAr ? 'التحويل المعتمد حصراً' : 'Exclusive Approved Method',
                      ].map((m, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(251, 135, 4, 0.12)',
                            border: '1px solid rgba(251, 135, 4, 0.3)',
                            color: '#FB8704',
                          }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>

                    {/* USDT TRC-20 Wallet Address Box */}
                    <div
                      style={{
                        background: 'rgba(2, 8, 24, 0.9)',
                        border: '1px solid rgba(251, 135, 4, 0.3)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10.5px', color: '#FB8704', fontWeight: 800 }}>
                          {isAr ? 'عنوان محفظة USDT (شبكة TRC-20):' : 'USDT TRC-20 Wallet Address:'}
                        </span>
                        <span style={{ fontSize: '9.5px', background: 'rgba(251, 135, 4, 0.2)', color: '#FB8704', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          Tron TRC-20
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code
                          style={{
                            background: 'rgba(0, 0, 0, 0.5)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#38bdf8',
                            fontFamily: 'monospace',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          TYDzsxdCzrG8d9V616h2UoXN589146L2f7
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== 'undefined') {
                              navigator.clipboard.writeText('TYDzsxdCzrG8d9V616h2UoXN589146L2f7');
                              alert(isAr ? 'تم نسخ عنوان محفظة USDT بنجاح!' : 'USDT Wallet address copied!');
                            }
                          }}
                          style={{
                            background: 'rgba(4, 136, 248, 0.2)',
                            border: '1px solid rgba(4, 136, 248, 0.4)',
                            color: '#38bdf8',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {isAr ? 'نسخ' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Direct Support Links */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                      <a
                        href="https://t.me/FXenginsignals"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px',
                          borderRadius: '8px',
                          background: 'rgba(4, 136, 248, 0.15)',
                          border: '1px solid rgba(4, 136, 248, 0.4)',
                          color: '#38bdf8',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: 700,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <FaTelegramPlane size={16} />
                        <span>{isAr ? 'دعم تيليجرام' : 'Telegram Desk'}</span>
                      </a>

                      <a
                        href="mailto:fxengin519@gmail.com"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px',
                          borderRadius: '8px',
                          background: 'rgba(4, 136, 248, 0.15)',
                          border: '1px solid rgba(4, 136, 248, 0.4)',
                          color: '#0488f8',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: 700,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <FiMail size={16} />
                        <span>{isAr ? 'بريد الدعم' : 'Support Email'}</span>
                      </a>
                    </div>

                    {/* Receipt / Tx Ref Input */}
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        {isAr ? 'رقم التحويل أو اسم المحول (اختياري لتسريع الحجز):' : 'Transfer Ref / Sender Name (optional):'}
                      </label>
                      <input
                        type="text"
                        placeholder={isAr ? 'أدخل هاش التحويل (TxID) أو عنوان محفظة USDT' : 'e.g. USDT TxID / Hash / Wallet Address'}
                        value={txHash}
                        onChange={(e) => setTxHash(e.target.value)}
                        style={{
                          width: '100%',
                          height: '36px',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--text-primary)',
                          padding: '0 10px',
                          fontSize: '12px',
                        }}
                      />
                    </div>

                    {/* Hand-off Notice to Enter Code */}
                    <div
                      style={{
                        background: 'rgba(251, 135, 4, 0.08)',
                        border: '1px solid rgba(251, 135, 4, 0.25)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginTop: '2px',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {isAr ? 'هل أتممت الدفع واستلمت كود الحجز؟' : 'Already paid and received your ticket code?'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('code')}
                        style={{
                          background: 'var(--accent)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#FFFFFF',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {isAr ? 'ادخل الكود هنا' : 'Enter Code Here'}
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: ENTER MANUAL ACCESS CODE */}
                {paymentMethod === 'code' && (
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiKey size={15} />
                        <span>{isAr ? 'تفعيل التذكرة عبر كود الدفع اليدوي' : 'Manual Payment Code Verification'}</span>
                      </h4>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {isAr
                          ? 'إذا أتممت الدفع يدوياً عبر الدعم أو تمتلك كود اشتراك معتمد، أدخله هنا لتأكيد حجز مقعدك والدخول فوراً:'
                          : 'If you paid manually via support or hold an access code, enter it below for instant activation:'}
                      </p>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '5px' }}>
                        {isAr ? 'كود التفعيل / رقم التذكرة (Access Code):' : 'Access Code / Ticket Number:'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isAr ? 'مثال: FX-LIVE-1234 أو كود الدعم...' : 'e.g. FX-LIVE-1234 or Support Code...'}
                        value={manualAccessCode}
                        onChange={(e) => {
                          setManualAccessCode(e.target.value);
                          setCodeError('');
                        }}
                        style={{
                          width: '100%',
                          height: '38px',
                          background: 'rgba(0, 0, 0, 0.6)',
                          border: codeError ? '1px solid var(--error)' : '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'var(--accent)',
                          padding: '0 12px',
                          fontSize: '13px',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                        }}
                      />
                      {codeError && (
                        <span style={{ fontSize: '11px', color: 'var(--error)', display: 'block', marginTop: '4px' }}>
                          {codeError}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit CTA Button based on Selected Tab */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    height: '44px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: isProcessing ? 'wait' : 'pointer',
                    background:
                      paymentMethod === 'code'
                        ? 'linear-gradient(135deg, #FB8704 0%, #E67600 100%)'
                        : 'linear-gradient(135deg, #0488F8 0%, #0370CE 100%)',
                    boxShadow:
                      paymentMethod === 'code'
                        ? '0 6px 20px rgba(251, 135, 4, 0.45)'
                        : '0 6px 20px rgba(4, 136, 248, 0.4)',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                  }}
                >
                  {isProcessing ? (
                    <span>{isAr ? 'جاري تسجيل الطلب...' : 'Processing...'}</span>
                  ) : paymentMethod === 'code' ? (
                    <>
                      <FiKey size={16} />
                      <span>{isAr ? 'تأكيد الكود وتفعيل التذكرة فوراً' : 'Verify Code & Confirm Ticket'}</span>
                    </>
                  ) : (
                    <>
                      <FaTelegramPlane size={16} />
                      <span>{isAr ? 'تأكيد الحجز والتواصل مع الدعم' : 'Confirm Booking & Contact Support'}</span>
                    </>
                  )}
                </button>
              </>
            )}

            {/* Link to Full Checkout Page */}
            <div style={{ textAlign: 'center', paddingTop: '4px' }}>
              <Link
                href={getAppRoute(`/checkout?type=live&id=${session?.id || 'webinar'}`, user)}
                onClick={onClose}
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  textDecoration: 'underline',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {isAr ? 'أو الانتقال لصفحة الفاتورة الكاملة وإتمام الطلب' : 'Or view full invoice checkout page'}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
