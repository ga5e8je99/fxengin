import fs from 'fs';
import path from 'path';

const TARGET_URLS = {
  tg: 'https://t.me/FXENGIN1NEWS',
  telegram: 'https://t.me/FXENGIN1NEWS',
  ig: 'https://www.instagram.com/fx_engin/',
  instagram: 'https://www.instagram.com/fx_engin/',
  fb: 'https://www.facebook.com/profile.php?id=61592983707520',
  facebook: 'https://www.facebook.com/profile.php?id=61592983707520',
  community: 'https://fxengen.com/join-us',
};

function getCandidatePaths() {
  const list = [];
  const primary = path.join(process.cwd(), 'data', 'competition-qualification.json');
  list.push(primary);

  if (process.env.SHARED_DATA_DIR) {
    list.push(path.join(process.env.SHARED_DATA_DIR, 'competition-qualification.json'));
  }
  list.push('/app/data/competition-qualification.json');
  list.push('/root/fxengin-website/shared-data/competition-qualification.json');
  list.push(path.join(process.cwd(), '..', 'shared-data', 'competition-qualification.json'));
  list.push(path.join(process.cwd(), '..', 'fxengin-admin', 'data', 'competition-qualification.json'));
  list.push(path.join(process.cwd(), '..', 'fx-engin', 'data', 'competition-qualification.json'));

  return [...new Set(list)];
}

function resolveReadFile() {
  const candidates = getCandidatePaths();
  let bestFile = null;
  let bestMtime = 0;

  for (const f of candidates) {
    try {
      if (fs.existsSync(f)) {
        const stats = fs.statSync(f);
        if (stats.mtimeMs > bestMtime) {
          bestMtime = stats.mtimeMs;
          bestFile = f;
        }
      }
    } catch {}
  }
  return bestFile || path.join(process.cwd(), 'data', 'competition-qualification.json');
}

export function readCompetitionData() {
  try {
    const file = resolveReadFile();
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        participants: Array.isArray(parsed?.participants) ? parsed.participants : [],
        clicks: Array.isArray(parsed?.clicks) ? parsed.clicks : [],
      };
    }
  } catch (err) {
    console.error('Error reading competition-qualification.json:', err);
  }
  return { participants: [], clicks: [] };
}

export function writeCompetitionData(data) {
  const content = JSON.stringify(data, null, 2);
  const candidates = getCandidatePaths();

  for (const f of candidates) {
    try {
      const dir = path.dirname(f);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(f, content, 'utf-8');
    } catch {}
  }
}

/**
 * Determine participant balance tier based on user's active subscriptions and courses:
 * - Gold Group: $50,000
 * - Courses: $25,000
 * - Indices: $10,000
 * - Forex: $5,000
 */
export function calculateParticipantTier(subscriptions = [], courses = []) {
  const hasGold = subscriptions.some((s) => {
    const name = (s.name || s.slug || s.plan?.name || s.plan?.slug || '').toLowerCase();
    return name.includes('gold') || name.includes('ذهب') || name.includes('xau');
  });

  const hasIndices = subscriptions.some((s) => {
    const name = (s.name || s.slug || s.plan?.name || s.plan?.slug || '').toLowerCase();
    return name.includes('index') || name.includes('indices') || name.includes('اندكس') || name.includes('مؤشرات') || name.includes('nas') || name.includes('us30');
  });

  const hasForex = subscriptions.some((s) => {
    const name = (s.name || s.slug || s.plan?.name || s.plan?.slug || '').toLowerCase();
    return name.includes('forex') || name.includes('فوركس') || name.includes('عملات') || name.includes('fx');
  });

  const hasCourses = Array.isArray(courses) && courses.length > 0;

  if (hasGold) {
    return { category: 'GOLD', titleAr: 'جروب الذهب', titleEn: 'Gold VIP Group', balance: 50000 };
  }
  if (hasCourses) {
    return { category: 'COURSES', titleAr: 'الكورسات التدريبية', titleEn: 'Trading Academy Courses', balance: 25000 };
  }
  if (hasIndices) {
    return { category: 'INDICES', titleAr: 'جروب الاندكس والمؤشرات', titleEn: 'Indices & Futures Group', balance: 10000 };
  }
  if (hasForex) {
    return { category: 'FOREX', titleAr: 'جروب الفوركس والعملات', titleEn: 'Forex Currencies Group', balance: 5000 };
  }

  return { category: 'STANDARD', titleAr: 'حساب المسابقة الأساسي', titleEn: 'Standard Competition Tier', balance: 5000 };
}

/**
 * Get or register participant in competition qualification system
 */
export function getOrCreateParticipant(user, subscriptions = [], courses = []) {
  if (!user || !user.id) return null;

  const data = readCompetitionData();
  let participant = data.participants.find((p) => p.userId === user.id);

  const tier = calculateParticipantTier(subscriptions, courses);
  const now = new Date().toISOString();

  if (!participant) {
    participant = {
      userId: user.id,
      userName: user.fullName || user.username || user.name || 'متسابق FXENGIN',
      userEmail: user.email || '',
      userPhone: user.phone || '',
      planCategory: tier.category,
      categoryTitleAr: tier.titleAr,
      categoryTitleEn: tier.titleEn,
      assignedBalance: tier.balance,
      tasks: {
        telegram: {
          channel: 'tg',
          titleAr: 'مشاركة لينك التليجرام لـ 10 مستخدمين',
          titleEn: 'Share Telegram Link to 10 Users',
          required: 10,
          current: 0,
          completed: false,
          subLink: `/c/tg/${user.id}`,
          targetUrl: TARGET_URLS.tg,
        },
        instagram: {
          channel: 'ig',
          titleAr: 'مشاركة حساب الانستجرام لـ 10 مستخدمين',
          titleEn: 'Share Instagram to 10 Users',
          required: 10,
          current: 0,
          completed: false,
          subLink: `/c/ig/${user.id}`,
          targetUrl: TARGET_URLS.ig,
        },
        facebook: {
          channel: 'fb',
          titleAr: 'مشاركة صفحة الفيسبوك لـ 10 مستخدمين',
          titleEn: 'Share Facebook to 10 Users',
          required: 10,
          current: 0,
          completed: false,
          subLink: `/c/fb/${user.id}`,
          targetUrl: TARGET_URLS.fb,
        },
        community: {
          channel: 'community',
          titleAr: 'الانضمام لمجتمعنا (ربح 10%) ومشاركة الرابط',
          titleEn: 'Join 10% Profit Community & Share Link',
          required: 1,
          current: 0,
          joined: false,
          shared: false,
          completed: false,
          subLink: `/c/community/${user.id}`,
          targetUrl: TARGET_URLS.community,
        },
      },
      isQualified: false,
      manualApproval: false,
      qualifiedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    data.participants.push(participant);
    writeCompetitionData(data);
  } else {
    // Update tier & balance if newly subscribed to higher category (unless manually set or company direct)
    let hasChanges = false;
    if (!participant.manualApproval && !participant.isCompanyDirect) {
      if (participant.assignedBalance !== tier.balance || participant.planCategory !== tier.category) {
        participant.planCategory = tier.category;
        participant.categoryTitleAr = tier.titleAr;
        participant.categoryTitleEn = tier.titleEn;
        participant.assignedBalance = tier.balance;
        hasChanges = true;
      }
    }
    if (user.fullName && participant.userName !== user.fullName) {
      participant.userName = user.fullName;
      hasChanges = true;
    }
    if (hasChanges) {
      participant.updatedAt = now;
      writeCompetitionData(data);
    }
  }

  return participant;
}

/**
 * Record a click on a user's sub-link and auto-verify tasks
 */
export function recordSubLinkClick(channel, userId, clientIp = '127.0.0.1') {
  const normChannel = channel.toLowerCase();
  let taskKey = null;
  if (normChannel === 'tg' || normChannel === 'telegram') taskKey = 'telegram';
  else if (normChannel === 'ig' || normChannel === 'instagram') taskKey = 'instagram';
  else if (normChannel === 'fb' || normChannel === 'facebook') taskKey = 'facebook';
  else if (normChannel === 'community' || normChannel === 'affiliate' || normChannel === 'join') taskKey = 'community';

  const targetUrl = TARGET_URLS[normChannel] || TARGET_URLS.tg;
  if (!taskKey) return { success: false, targetUrl };

  const data = readCompetitionData();
  const participant = data.participants.find((p) => p.userId === userId);

  if (!participant) {
    return { success: true, targetUrl };
  }

  const now = new Date();
  const nowIso = now.toISOString();

  // Deduplicate rapid clicks from the exact same IP within 1 hour
  const recentClick = data.clicks.find(
    (c) =>
      c.userId === userId &&
      c.channel === taskKey &&
      c.ip === clientIp &&
      new Date(c.timestamp).getTime() > now.getTime() - 60 * 60 * 1000
  );

  if (!recentClick) {
    data.clicks.push({
      id: `clk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      channel: taskKey,
      ip: clientIp,
      timestamp: nowIso,
    });

    const task = participant.tasks[taskKey];
    if (task) {
      task.current = (task.current || 0) + 1;
      if (task.current >= task.required) {
        task.completed = true;
      }
      if (taskKey === 'community') {
        task.shared = true;
      }
    }

    // Check overall qualification
    const allCompleted =
      Boolean(participant.tasks.telegram?.completed) &&
      Boolean(participant.tasks.instagram?.completed) &&
      Boolean(participant.tasks.facebook?.completed) &&
      Boolean(participant.tasks.community?.completed);

    if (allCompleted || participant.manualApproval) {
      participant.isQualified = true;
      if (!participant.qualifiedAt) {
        participant.qualifiedAt = nowIso;
      }
    }

    participant.updatedAt = nowIso;
    writeCompetitionData(data);
  }

  return { success: true, targetUrl, participant };
}

/**
 * Confirm community task completion (joined & shared)
 */
export function confirmCommunityTask(userId, { joined = true, shared = true } = {}) {
  const data = readCompetitionData();
  const participant = data.participants.find((p) => p.userId === userId);
  if (!participant) return null;

  const nowIso = new Date().toISOString();
  const comm = participant.tasks.community;
  if (comm) {
    comm.joined = Boolean(joined);
    comm.shared = Boolean(shared);
    comm.current = Math.max(comm.current || 0, 1);
    comm.completed = comm.joined && comm.shared;
  }

  // Check overall qualification
  const allCompleted =
    Boolean(participant.tasks.telegram?.completed) &&
    Boolean(participant.tasks.instagram?.completed) &&
    Boolean(participant.tasks.facebook?.completed) &&
    Boolean(participant.tasks.community?.completed);

  if (allCompleted || participant.manualApproval) {
    participant.isQualified = true;
    if (!participant.qualifiedAt) participant.qualifiedAt = nowIso;
  }

  participant.updatedAt = nowIso;
  writeCompetitionData(data);
  return participant;
}

/**
 * Admin override: manual approval or reset
 */
export function adminOverrideParticipant(userId, { approve, reset }) {
  const data = readCompetitionData();
  const participant = data.participants.find((p) => p.userId === userId);
  if (!participant) return null;

  const nowIso = new Date().toISOString();

  if (approve) {
    participant.manualApproval = true;
    participant.isQualified = true;
    participant.qualifiedAt = nowIso;
    Object.values(participant.tasks).forEach((t) => {
      t.completed = true;
      t.current = t.required;
    });
  } else if (reset) {
    participant.manualApproval = false;
    participant.isQualified = false;
    participant.qualifiedAt = null;
    Object.values(participant.tasks).forEach((t) => {
      t.completed = false;
      t.current = 0;
      if (t.joined) t.joined = false;
      if (t.shared) t.shared = false;
    });
    // Remove recorded clicks for this user
    data.clicks = data.clicks.filter((c) => c.userId !== userId);
  }

  participant.updatedAt = nowIso;
  writeCompetitionData(data);
  return participant;
}
