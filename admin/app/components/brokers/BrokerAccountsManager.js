'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  IoKeyOutline,
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoShieldCheckmarkOutline,
  IoAddCircleOutline,
  IoPencilOutline,
  IoCloseCircleOutline,
  IoCopyOutline,
} from 'react-icons/io5';

export default function BrokerAccountsManager() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    brokerSlug: '',
    brokerName: '',
    email: '',
    username: '',
    password: '',
    repName: '',
    repTitle: '',
    repPhone: '',
    contractTier: 'TIER_1_STRATEGIC',
    status: 'ACTIVE',
  });

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/brokers/accounts', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data || []);
      }
    } catch {
      toast.error('خطأ في جلب حسابات الوسطاء');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormData({
      id: `brk_${Date.now().toString().slice(-4)}`,
      brokerSlug: '',
      brokerName: '',
      email: '',
      username: '',
      password: 'Partner@2026',
      repName: '',
      repTitle: 'Head of Partnerships',
      repPhone: '',
      contractTier: 'TIER_1_STRATEGIC',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc) => {
    setEditingAccount(acc);
    setFormData({ ...acc });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.brokerName) {
      toast.warn('يرجى ملء الحقول الإجبارية');
      return;
    }

    try {
      const method = editingAccount ? 'PUT' : 'POST';
      const res = await fetch('/api/brokers/accounts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingAccount ? 'تم تحديث الحساب بنجاح' : 'تم إنشاء حساب الوسيط بنجاح');
        setIsModalOpen(false);
        loadAccounts();
      } else {
        toast.error(data.error || 'تعذر حفظ الحساب');
      }
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const copyCreds = (acc) => {
    const text = `بيانات دخول بوابة الوسطاء:\nالرابط: https://fxengin.com/brokers/portal/login\nاسم المستخدم: ${acc.username}\nكلمة المرور: ${acc.password}`;
    navigator.clipboard.writeText(text);
    toast.info('تم نسخ بيانات الدخول إلى الحافظة');
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">حسابات تسجيل دخول الوسطاء والشركاء</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            إدارة بيانات اعتماد الدخول الخاصة بممثلي شركات الوساطة إلى بوابة الشركاء (Broker Portal)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold"
        >
          <IoAddCircleOutline size={16} />
          <span>إضافة حساب وسيط جديد</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">جاري التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-surface-container-low border border-border-structural/80 rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-black text-text-primary text-base">{acc.brokerName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-bullish-up/10 text-bullish-up border border-bullish-up/30 font-bold">
                    {acc.contractTier}
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-3 rounded-lg border border-border-structural/50 space-y-2 text-xs mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-text-tertiary">اسم المستخدم:</span>
                    <span className="font-mono font-bold text-primary">{acc.username}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-tertiary">كلمة المرور:</span>
                    <span className="font-mono text-text-primary">{acc.password}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-tertiary">البريد الإلكتروني:</span>
                    <span className="text-text-secondary">{acc.email}</span>
                  </div>
                </div>

                <div className="text-xs space-y-1 mb-4 text-text-secondary">
                  <div>الممثل: <strong className="text-text-primary">{acc.repName}</strong> ({acc.repTitle || 'Director'})</div>
                  {acc.repPhone && <div className="text-[11px] text-text-tertiary">هاتف: {acc.repPhone}</div>}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-border-structural/60">
                <button
                  onClick={() => copyCreds(acc)}
                  className="flex-1 py-1.5 px-2.5 bg-surface-container hover:bg-surface-container-high rounded text-xs font-bold text-text-primary flex items-center justify-center gap-1"
                >
                  <IoCopyOutline size={13} />
                  <span>نسخ البيانات</span>
                </button>
                <button
                  onClick={() => handleOpenEdit(acc)}
                  className="p-1.5 bg-surface-container hover:bg-surface-container-high rounded text-text-secondary hover:text-text-primary"
                  title="تعديل"
                >
                  <IoPencilOutline size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-deep/80 backdrop-blur-sm">
          <div className="bg-surface-container-low border border-border-structural rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border-structural/60 mb-4">
              <h3 className="font-bold text-base text-text-primary">
                {editingAccount ? 'تعديل بيانات حساب الوسيط' : 'إنشاء حساب جديد للوسيط الشريك'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-secondary">
                <IoCloseCircleOutline size={22} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-secondary font-bold mb-1">اسم الوسيط / الشركة *</label>
                <input
                  type="text"
                  required
                  value={formData.brokerName}
                  onChange={(e) => setFormData({ ...formData, brokerName: e.target.value })}
                  className="w-full p-2.5 bg-surface-container-lowest border border-border-structural/70 rounded-lg text-text-primary text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-bold mb-1">اسم المستخدم للدخول *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full p-2.5 bg-surface-container-lowest border border-border-structural/70 rounded-lg text-text-primary text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-bold mb-1">كلمة المرور *</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2.5 bg-surface-container-lowest border border-border-structural/70 rounded-lg text-text-primary text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary font-bold mb-1">البريد الإلكتروني للوسيط</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-surface-container-lowest border border-border-structural/70 rounded-lg text-text-primary text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-bold mb-1">اسم الممثل الرسمي</label>
                  <input
                    type="text"
                    value={formData.repName}
                    onChange={(e) => setFormData({ ...formData, repName: e.target.value })}
                    className="w-full p-2.5 bg-surface-container-lowest border border-border-structural/70 rounded-lg text-text-primary text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-bold mb-1">هاتف الممثل</label>
                  <input
                    type="text"
                    value={formData.repPhone}
                    onChange={(e) => setFormData({ ...formData, repPhone: e.target.value })}
                    className="w-full p-2.5 bg-surface-container-lowest border border-border-structural/70 rounded-lg text-text-primary text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border-structural/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface-container rounded-lg text-text-secondary font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold"
                >
                  حفظ الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
