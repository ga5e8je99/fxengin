'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  IoSearchOutline,
  IoStatsChartOutline,
  IoPeopleOutline,
  IoBookOutline,
  IoNewspaperOutline,
  IoTrendingUpOutline,
  IoCardOutline,
  IoSettingsOutline,
  IoAddCircleOutline,
  IoShieldCheckmarkOutline,
  IoSparklesOutline,
} from 'react-icons/io5';

export default function CommandPalette({ isOpen, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const commands = [
    {
      id: 'nav-overview',
      title: 'الإحصائيات العامة ونظرة سريعة',
      titleEn: 'Overview & Analytics',
      icon: IoStatsChartOutline,
      category: 'التنقل المباشر',
      action: () => {
        router.push('/dashboard');
        onClose();
      },
    },
    {
      id: 'nav-users',
      title: 'إدارة المستخدمين والمتداولين',
      titleEn: 'Users & Traders Management',
      icon: IoPeopleOutline,
      category: 'التنقل المباشر',
      action: () => {
        router.push('/dashboard/users');
        onClose();
      },
    },
    {
      id: 'nav-courses',
      title: 'إدارة الكورسات والدروس',
      titleEn: 'Courses & Curriculum',
      icon: IoBookOutline,
      category: 'التنقل المباشر',
      action: () => {
        router.push('/dashboard/courses');
        onClose();
      },
    },
    {
      id: 'nav-articles',
      title: 'إدارة المقالات وأخبار الأسواق',
      titleEn: 'Articles & Market News',
      icon: IoNewspaperOutline,
      category: 'التنقل المباشر',
      action: () => {
        router.push('/dashboard/articles');
        onClose();
      },
    },
    {
      id: 'nav-analysis',
      title: 'التحليلات الفنية وتوصيات السوق',
      titleEn: 'Market Analysis & Trading Signals',
      icon: IoTrendingUpOutline,
      category: 'التنقل المباشر',
      action: () => {
        router.push('/dashboard/analysis');
        onClose();
      },
    },
    {
      id: 'nav-subs',
      title: 'الاشتراكات وباقات العضوية والفواتير',
      titleEn: 'Subscriptions & Billing',
      icon: IoCardOutline,
      category: 'التنقل المباشر',
      action: () => {
        router.push('/dashboard/subscriptions');
        onClose();
      },
    },
    {
      id: 'nav-brokers',
      title: 'إدارة الوسطاء وشركاء التداول (IB)',
      titleEn: 'Brokers & Affiliate Partners',
      icon: IoShieldCheckmarkOutline,
      category: 'التنقل المباشر',
      action: () => {
        router.push('/dashboard/brokers');
        onClose();
      },
    },
    {
      id: 'nav-offers',
      title: 'إدارة العروض الترويجية والخصومات (Offers)',
      titleEn: 'Promotional Offers & Discounts',
      icon: IoSparklesOutline,
      category: 'التنقل المباشر',
      action: () => {
        router.push('/dashboard/offers');
        onClose();
      },
    },
    {
      id: 'nav-settings',
      title: 'إعدادات المنصة وربط الـ API',
      titleEn: 'Platform Settings & API',
      icon: IoSettingsOutline,
      category: 'التنقل المباشر',
      action: () => {
        router.push('/dashboard/settings');
        onClose();
      },
    },
    {
      id: 'act-new-user',
      title: 'إضافة متداول أو مدرب جديد',
      titleEn: 'Create New User',
      icon: IoAddCircleOutline,
      category: 'إجراءات سريعة',
      action: () => {
        router.push('/dashboard/users?action=new');
        onClose();
      },
    },
    {
      id: 'act-new-signal',
      title: 'إصدار توصية أو تحليل سوق جديد',
      titleEn: 'Publish Market Signal',
      icon: IoAddCircleOutline,
      category: 'إجراءات سريعة',
      action: () => {
        router.push('/dashboard/analysis?action=new');
        onClose();
      },
    },
    {
      id: 'act-new-course',
      title: 'إضافة كورس تدريبي جديد',
      titleEn: 'Create New Course',
      icon: IoAddCircleOutline,
      category: 'إجراءات سريعة',
      action: () => {
        router.push('/dashboard/courses?action=new');
        onClose();
      },
    },
    {
      id: 'act-new-offer',
      title: 'إضافة عرض ترويجي أو كود خصم جديد',
      titleEn: 'Create New Offer or Promo Code',
      icon: IoAddCircleOutline,
      category: 'إجراءات سريعة',
      action: () => {
        router.push('/dashboard/offers');
        onClose();
      },
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose ? (isOpen ? onClose() : null) : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.titleEn.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div
        className="fixed inset-0 bg-[#00030D]/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-[#0A1B3D] border border-[#12315C] rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Bar Input */}
        <div className="p-4 border-b border-[#12315C] flex items-center gap-3">
          <IoSearchOutline className="text-xl text-[#0488F8]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="اكتب للبحث السريع أو الانتقال إلى أي قسم... (Ctrl + K)"
            className="w-full bg-transparent border-none text-[#F5F7FA] text-base placeholder-[#687287] outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono text-[#A7AFBF] bg-[#06142F] border border-[#12315C] rounded">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className="w-full text-right rtl:text-right ltr:text-left p-3 rounded-xl flex items-center justify-between hover:bg-[#06142F] hover:border hover:border-[#0488F8]/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#06142F] border border-[#12315C] flex items-center justify-center text-[#0488F8] group-hover:scale-105 transition-transform">
                      <Icon className="text-lg" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#F5F7FA] group-hover:text-[#0488F8] transition-colors">
                        {cmd.title}
                      </div>
                      <div className="text-xs text-[#A7AFBF] font-tabular">
                        {cmd.titleEn}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-[#687287] px-2 py-0.5 rounded bg-[#01071E]">
                    {cmd.category}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-sm text-[#687287]">
              لا توجد نتائج مطابقة لـ &quot;{query}&quot;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
