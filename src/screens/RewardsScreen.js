import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Share, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Trophy, Star, Zap, Gift, Award, ArrowLeft, RefreshCw,
  CheckCircle2, Lock, Crown, Copy, Flame, Users, BookOpen
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { translate } from '../utils/i18n';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import memberApi from '../api/memberApi';
import { storage } from '../utils/storage';

// ─── Certificate Stages (matches frontend RewardsScreen.jsx exactly) ─────────
const CERTIFICATE_STAGES = [
  {
    id: 1,
    name: 'Basic Certificate',
    stageLabel: 'Stage 1',
    Icon: Award,
    color: '#ff69b4',
    reqBooks: 5,
    reqDays: 15,
    reqReferrals: 0,
    description: 'Complete 5 Books & 15 Active Days',
  },
  {
    id: 2,
    name: 'Advance Certificate',
    stageLabel: 'Stage 2',
    Icon: Trophy,
    color: '#8b5cf6',
    reqBooks: 15,
    reqDays: 30,
    reqReferrals: 0,
    description: 'Complete 15 Books & 30 Active Days',
  },
  {
    id: 3,
    name: 'Gold Ambassador',
    stageLabel: 'Stage 3',
    Icon: Star,
    color: '#f59e0b',
    reqBooks: 25,
    reqDays: 30,
    reqReferrals: 10,
    description: 'Complete 25 Books & 10 Referrals',
  },
  {
    id: 4,
    name: 'Platinum Leader',
    stageLabel: 'Stage 4',
    Icon: Crown,
    color: '#0ea5e9',
    reqBooks: 40,
    reqDays: 60,
    reqReferrals: 25,
    description: 'Complete 40 Books & 25 Referrals',
  },
];

// ─── Rank Calculation (matches frontend logic) ────────────────────────────────
function calcRank(booksCompleted, activeDays, referrals) {
  if (booksCompleted >= 40 && referrals >= 25) return { name: 'Platinum Leader', next: null, level: 4 };
  if (booksCompleted >= 25 && referrals >= 10) return { name: 'Gold Ambassador', next: 'Platinum Leader', level: 3 };
  if (booksCompleted >= 15 && activeDays >= 30) return { name: 'Wellness Master', next: 'Gold Ambassador', level: 2 };
  if (booksCompleted >= 5 && activeDays >= 15) return { name: 'Wellness Learner', next: 'Wellness Master', level: 1 };
  return { name: 'Basic Member', next: 'Wellness Learner', level: 0 };
}

export default function RewardsScreen({ navigation }) {
  const { langCode } = useLanguage();
  const { user, memberProgress, setMemberProgress } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  // Data state
  const [streak, setStreak] = useState(0);
  const [coins, setCoins] = useState(0);
  const [activities, setActivities] = useState([]);
  const [profile, setProfile] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [referredUsers, setReferredUsers] = useState([]);
  const [unlockedCertificates, setUnlockedCertificates] = useState([]);
  const [bookRewards, setBookRewards] = useState([]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const loadData = useCallback(async (showSpinner = true) => {
    if (!mounted.current) return;
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      // Parallel API calls matching frontend
      const [profRes, dashRes, todosRes, transRes, moodRes, certRes] = await Promise.allSettled([
        memberApi.getProfile(),
        memberApi.getDashboard(),
        memberApi.getTodos(),
        memberApi.getTransactions(),
        memberApi.getMoodLogs(),
        memberApi.getCertificates(),
      ]);

      if (!mounted.current) return;

      const prof = profRes.status === 'fulfilled' ? (profRes.value?.profile || profRes.value?.user || profRes.value) : null;
      if (prof) {
        setProfile(prof);
        setMemberProgress(prev => ({ ...prev, profile: prof }));
      }

      const streakVal = dashRes.status === 'fulfilled'
        ? (dashRes.value?.dashboard?.streak_count || 0)
        : 0;
      setStreak(streakVal);
      if (dashRes.status === 'fulfilled' && dashRes.value?.dashboard) {
        setMemberProgress(prev => ({ ...prev, dashboard: dashRes.value.dashboard }));
      }

      const todos = todosRes.status === 'fulfilled' ? (todosRes.value?.todos || []) : [];
      const transactions = transRes.status === 'fulfilled' ? (transRes.value?.transactions || []) : [];
      const moodLogs = moodRes.status === 'fulfilled' ? (moodRes.value?.moodLogs || []) : [];
      const certs = certRes.status === 'fulfilled' ? (certRes.value?.certificates || []) : [];
      setUnlockedCertificates(certs);

      // Book rewards from storage (same as frontend localStorage approach)
      const storedBookRewards = JSON.parse(await storage.getItem('hs_book_rewards').catch(() => '[]') || '[]');
      setBookRewards(storedBookRewards);
      const bookRewardPoints = storedBookRewards.reduce((sum, r) => sum + (r.points || 0), 0);

      // Redemptions from storage
      const redemptions = JSON.parse(await storage.getItem('hs_redemptions').catch(() => '[]') || '[]');
      const spent = redemptions.reduce((sum, r) => sum + (r.points || 0), 0);

      // Streak bonus (same as frontend: +100 for 30+ day streak)
      const streakBonusPoints = streakVal >= 30 ? 100 : 0;
      const totalCoins = Math.max(0, bookRewardPoints + streakBonusPoints - spent);
      setCoins(totalCoins);

      // Store for subscriptions screen
      storage.setItem('hs_reward_balance', String(totalCoins)).catch(() => {});

      // Build activity feed (matching frontend)
      const feed = [];

      if (streakBonusPoints > 0) {
        feed.push({ id: 'streak_30_bonus', text: '🔥 30-Day Streak Milestone Reached', amount: '+100', timestamp: Date.now() });
      }

      storedBookRewards.forEach(r => {
        feed.push({
          id: `book_${r.bookId || Math.random()}`,
          text: `📖 Completed Book: ${r.bookTitle}`,
          amount: `+${r.points}`,
          timestamp: new Date(r.earnedAt).getTime()
        });
      });

      todos.filter(t => t.is_completed).forEach(t => {
        feed.push({
          id: `todo_${t.id}`,
          text: `✅ Completed Task: ${t.title}`,
          amount: '+20',
          timestamp: t.due_date ? new Date(t.due_date).getTime() : 0
        });
      });

      transactions.forEach(t => {
        feed.push({
          id: `tx_${t.id}`,
          text: `💸 Recorded Transaction: ${t.description || t.category || 'Budget Entry'}`,
          amount: '+10',
          timestamp: t.date ? new Date(t.date).getTime() : 0
        });
      });

      moodLogs.forEach(m => {
        feed.push({
          id: `mood_${m.id || Math.random()}`,
          text: `🎭 Checked In Mood: ${m.mood_type || m.moodType || 'Daily'}`,
          amount: '+10',
          timestamp: m.logged_at || m.loggedAt ? new Date(m.logged_at || m.loggedAt).getTime() : 0
        });
      });

      redemptions.forEach(r => {
        feed.push({
          id: `red_${r.id}`,
          text: `🎁 Redeemed: ${r.name}`,
          amount: `-${r.points}`,
          timestamp: new Date(r.redeemedAt).getTime()
        });
      });

      feed.sort((a, b) => b.timestamp - a.timestamp);
      setActivities(feed.slice(0, 10));

    } catch (err) {
      if (mounted.current) setError('Unable to load rewards. Please retry.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [setMemberProgress]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData(true);

    const unsubscribe = navigation.addListener('focus', () => {
      loadData(false);
    });
    return unsubscribe;
  }, [navigation, loadData]);

  // Derived metrics (matching frontend)
  const booksCompleted = profile?.booksCompleted || profile?.booksRead || bookRewards.length;
  const activeDays = streak || profile?.loginDays || 0;
  const referralCount = profile?.referralCount || referredUsers.length || 0;

  const earnedStages = CERTIFICATE_STAGES.filter(s => {
    if (s.reqReferrals > 0) return booksCompleted >= s.reqBooks && referralCount >= s.reqReferrals;
    return booksCompleted >= s.reqBooks && activeDays >= s.reqDays;
  });
  const earnedCount = earnedStages.length;

  const rankName = earnedCount === 4
    ? translate('rankPlatinumLeader', langCode) || 'Platinum Health Leader 👑'
    : earnedCount === 3
      ? translate('rankGoldAmbassador', langCode) || 'Gold Ambassador 🌟'
      : earnedCount >= 1
        ? translate('rankWellnessMaster', langCode) || 'Wellness Master 🌸'
        : translate('rankRisingSakhi', langCode) || 'Rising Sakhi 🌿';

  // Dynamic discount math matching frontend exactly
  const hasBasicCert = booksCompleted >= 5 && activeDays >= 15;
  const hasAdvanceCert = booksCompleted >= 15 && activeDays >= 30;

  const basicDiscount = hasBasicCert ? 50 : 0;
  const premiumDiscount = hasAdvanceCert ? 100 : (hasBasicCert ? 50 : 0);

  const basicPrice = 499 - basicDiscount;
  const premiumPrice = 999 - premiumDiscount;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translate('rewards', langCode) || 'Rewards'}</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
          <Text style={styles.loadingText}>Loading Rewards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translate('rewards', langCode) || 'Rewards'}</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{translate('rewards', langCode) || 'Rewards'}</Text>
        <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
          <RefreshCw size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />
        }
      >

        {/* ── 1. STATS ROW: Streak / Stages / Rank ──────────────── */}
        <View style={styles.statsRow}>
          {/* Active Streak */}
          <View style={styles.statCard}>
            <Flame size={22} color="#F97316" />
            <Text style={styles.statBig}>{activeDays}</Text>
            <Text style={styles.statLabel}>{activeDays === 1 ? 'Day' : 'Days'}</Text>
            <Text style={styles.statSub}>Active Streak</Text>
          </View>

          {/* Certificate Stages */}
          <View style={styles.statCard}>
            <Award size={22} color={COLORS.secondary} />
            <Text style={styles.statBig}>
              {String(earnedCount).padStart(2, '0')} / {CERTIFICATE_STAGES.length}
            </Text>
            <Text style={styles.statLabel}>Stages</Text>
            <Text style={styles.statSub}>Certificates</Text>
          </View>

          {/* Current Rank */}
          <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <Zap size={22} color={COLORS.white} />
            <Text style={[styles.statBig, { color: COLORS.white, fontSize: 10, textAlign: 'center' }]}>{rankName}</Text>
            <Text style={[styles.statLabel, { color: '#E0C8D0' }]}>Rank {earnedCount}</Text>
            <Text style={[styles.statSub, { color: '#C8A0B8' }]}>Master: {earnedCount} / {CERTIFICATE_STAGES.length}</Text>
          </View>
        </View>

        {/* ── 2. CERTIFICATE MILESTONE STAGES ───────────────────── */}
        <Text style={styles.sectionTitle}>CERTIFICATE MILESTONE STAGES</Text>
        {CERTIFICATE_STAGES.map((stage) => {
          const { Icon, color, reqBooks, reqDays, reqReferrals } = stage;
          const isEarned = reqReferrals > 0
            ? booksCompleted >= reqBooks && referralCount >= reqReferrals
            : booksCompleted >= reqBooks && activeDays >= reqDays;

          const bookPct = Math.min(100, Math.round((booksCompleted / reqBooks) * 100));
          const dayPct = reqDays > 0 ? Math.min(100, Math.round((activeDays / reqDays) * 100)) : 100;
          const refPct = reqReferrals > 0 ? Math.min(100, Math.round((referralCount / reqReferrals) * 100)) : 100;

          return (
            <View key={stage.id} style={[styles.stageCard, isEarned && { borderColor: color, borderWidth: 2 }]}>
              <View style={styles.stageHeader}>
                <View style={[styles.stageIconBox, { backgroundColor: `${color}20` }]}>
                  <Icon size={22} color={color} />
                </View>
                <View style={{ flex: 1, paddingLeft: 10 }}>
                  <Text style={styles.stageLabel}>{stage.stageLabel}</Text>
                  <Text style={styles.stageName}>{stage.name}</Text>
                  <Text style={styles.stageDesc}>{stage.description}</Text>
                </View>
                {isEarned ? (
                  <View style={styles.earnedBadge}>
                    <CheckCircle2 size={12} color="#10B981" />
                    <Text style={styles.earnedText}>EARNED</Text>
                  </View>
                ) : (
                  <View style={styles.lockedBadge}>
                    <Lock size={12} color={COLORS.grayMuted} />
                    <Text style={styles.lockedText}>LOCKED</Text>
                  </View>
                )}
              </View>

              {/* Progress bars */}
              <View style={styles.progressGroup}>
                <View style={styles.progRow}>
                  <BookOpen size={11} color={COLORS.grayMuted} />
                  <Text style={styles.progLabel}>Books: {booksCompleted}/{reqBooks}</Text>
                  <Text style={styles.progPct}>{bookPct}%</Text>
                </View>
                <View style={styles.progTrack}>
                  <View style={[styles.progFill, { width: `${bookPct}%`, backgroundColor: color }]} />
                </View>

                {reqDays > 0 && (
                  <View style={{ width: '100%' }}>
                    <View style={[styles.progRow, { marginTop: 6 }]}>
                      <Flame size={11} color={COLORS.grayMuted} />
                      <Text style={styles.progLabel}>Active Days: {activeDays}/{reqDays}</Text>
                      <Text style={styles.progPct}>{dayPct}%</Text>
                    </View>
                    <View style={styles.progTrack}>
                      <View style={[styles.progFill, { width: `${dayPct}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                )}

                {reqReferrals > 0 && (
                  <View style={{ width: '100%' }}>
                    <View style={[styles.progRow, { marginTop: 6 }]}>
                      <Users size={11} color={COLORS.grayMuted} />
                      <Text style={styles.progLabel}>Referrals: {referralCount}/{reqReferrals}</Text>
                      <Text style={styles.progPct}>{refPct}%</Text>
                    </View>
                    <View style={styles.progTrack}>
                      <View style={[styles.progFill, { width: `${refPct}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* ── 3. SPECIAL SUBSCRIPTION DISCOUNTS ─────────────────── */}
        <View style={styles.discountSection}>
          <Text style={styles.sectionTitle}>
            {translate('specialDiscountTitle', langCode) || 'Wellness Certificate Special Subscription Discount 🌸'}
          </Text>
          
          <View style={styles.discountHeaderSubBox}>
            <Text style={styles.discountHeaderSub}>
              {translate('specialDiscountSubtitle', langCode) || 'Complete Certificate Milestones to Unlock Exclusive Plan Discounts!'}
            </Text>
            <View style={styles.milestoneOfferBadge}>
              <Text style={styles.milestoneOfferBadgeText}>
                {translate('milestoneOffers', langCode) || 'Milestone Offers: Basic Cert = ₹50 OFF | Advance Cert = ₹100 OFF'}
              </Text>
            </View>
          </View>

          {/* Basic Sakhi Plan Card */}
          <View style={styles.planDiscountCard}>
            <View style={styles.planCardHeaderRow}>
              <View style={styles.planCardTag}>
                <Text style={styles.planCardTagText}>
                  {translate('basicPlanTitle', langCode) || 'Basic Sakhi Plan'}
                </Text>
              </View>
              {hasBasicCert && (
                <View style={styles.discountUnlockedRow}>
                  <CheckCircle2 size={14} color="#10B981" />
                  <Text style={styles.discountUnlockedLabel}> ₹50 OFF Unlocked!</Text>
                </View>
              )}
            </View>

            <Text style={styles.planCardTitle}>
              {translate('oneMonthAccess', langCode) || '1 Month Unlimited Access'}
            </Text>
            <Text style={styles.planCardDesc}>
              {translate('basicPlanDesc', langCode) || 'Unlocks AI Chat Bot 24/7, All Books Unlimited & Basic Wellness Certificate Download.'}
            </Text>

            <View style={styles.planCardPriceRow}>
              <Text style={styles.planCardPrice}>₹{basicPrice}</Text>
              {basicDiscount > 0 && (
                <Text style={styles.planCardOriginalPrice}>₹499</Text>
              )}
              <Text style={styles.planCardPriceSubtext}>/month</Text>
            </View>

            <TouchableOpacity
              style={styles.planCardCtaBtn}
              onPress={async () => {
                await storage.setItem('hs_applied_discount', JSON.stringify({ plan: 'basic', discount: basicDiscount })).catch(() => {});
                navigation.navigate('SubscriptionPlans');
              }}
            >
              <Text style={styles.planCardCtaBtnText}>
                {hasBasicCert
                  ? (translate('getBasicPlanBtn', langCode) || 'GET BASIC PLAN FOR ₹{price} ⚡').replace('{price}', String(basicPrice))
                  : (translate('upgradeBasicBtn', langCode) || 'UPGRADE BASIC FOR ₹499')
                }
              </Text>
            </TouchableOpacity>
          </View>

          {/* Premium Sakhi Plan Card */}
          <View style={[styles.planDiscountCard, styles.planDiscountCardPremium]}>
            <View style={styles.planCardHeaderRow}>
              <View style={[styles.planCardTag, { backgroundColor: '#FCE7F3', borderColor: '#F472B6' }]}>
                <Text style={[styles.planCardTagText, { color: '#DB2777' }]}>
                  {translate('premiumPlanTitle', langCode) || 'Premium Sakhi Plan 👑'}
                </Text>
              </View>
              {premiumDiscount > 0 && (
                <View style={styles.discountUnlockedRow}>
                  <CheckCircle2 size={14} color="#10B981" />
                  <Text style={styles.discountUnlockedLabel}> ₹{premiumDiscount} OFF Unlocked!</Text>
                </View>
              )}
            </View>

            <Text style={styles.planCardTitle}>
              {translate('fullYearAccess', langCode) || 'Full Unlimited Year Access'}
            </Text>
            <Text style={styles.planCardDesc}>
              {translate('premiumPlanDesc', langCode) || 'Full access to AI Sakhi Bot, Partner Sakhi, Ask Health Sakhi, and ALL Wellness Certificates!'}
            </Text>

            <View style={styles.planCardPriceRow}>
              <Text style={[styles.planCardPrice, { color: '#DB2777' }]}>₹{premiumPrice}</Text>
              {premiumDiscount > 0 && (
                <Text style={styles.planCardOriginalPrice}>₹999</Text>
              )}
              <Text style={styles.planCardPriceSubtext}>/year</Text>
            </View>

            <TouchableOpacity
              style={[styles.planCardCtaBtn, styles.planCardCtaBtnPremium]}
              onPress={async () => {
                await storage.setItem('hs_applied_discount', JSON.stringify({ plan: 'premium', discount: premiumDiscount })).catch(() => {});
                navigation.navigate('SubscriptionPlans');
              }}
            >
              <Text style={[styles.planCardCtaBtnText, { color: COLORS.white }]}>
                {premiumDiscount > 0
                  ? (translate('getPremiumPlanBtn', langCode) || 'GET PREMIUM PLAN FOR ₹{price} 👑').replace('{price}', String(premiumPrice))
                  : (translate('upgradePremiumBtn', langCode) || 'UPGRADE PREMIUM FOR ₹999')
                }
              </Text>
            </TouchableOpacity>
          </View>

          {/* Guide section */}
          <Text style={styles.howMilestoneDiscountsWorkTitle}>
            {translate('howMilestoneDiscountsWork', langCode) || 'How Certificate Milestone Discounts Work'}
          </Text>

          <View style={styles.milestoneExplanationBox}>
            <View style={styles.milestoneExplanationIconBox}>
              <Text style={{ fontSize: 18 }}>📜</Text>
            </View>
            <View style={styles.milestoneExplanationCol}>
              <Text style={styles.milestoneExplanationTitle}>
                {translate('basicMilestoneTitle', langCode) || 'Basic Wellness Certificate Milestone'}
              </Text>
              <Text style={styles.milestoneExplanationDesc}>
                {translate('basicMilestoneDesc', langCode) || 'Complete 5 Books & 15 Active Days → Get ₹50 OFF (Basic ₹449 / Premium ₹949)'}
              </Text>
            </View>
          </View>

          <View style={[styles.milestoneExplanationBox, { marginTop: 10 }]}>
            <View style={[styles.milestoneExplanationIconBox, { backgroundColor: '#E0E7FF' }]}>
              <Text style={{ fontSize: 18 }}>🎓</Text>
            </View>
            <View style={styles.milestoneExplanationCol}>
              <Text style={styles.milestoneExplanationTitle}>
                {translate('advanceMilestoneTitle', langCode) || 'Advance Wellness Certificate Milestone'}
              </Text>
              <Text style={styles.milestoneExplanationDesc}>
                {translate('advanceMilestoneDesc', langCode) || 'Complete 15 Books & 30 Active Days → Get ₹100 OFF (Premium ₹899)'}
              </Text>
            </View>
          </View>

        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7F8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  refreshBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  loadingText: { fontSize: 13, color: COLORS.secondary, fontWeight: '700', marginTop: 8 },
  errorText: { fontSize: 14, color: '#DC2626', textAlign: 'center', fontWeight: '600' },
  retryBtn: {
    backgroundColor: COLORS.secondary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14,
  },
  retryBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  scroll: { padding: SPACING.md, paddingBottom: 40 },

  // Stats Row
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 18, padding: 12,
    alignItems: 'center', gap: 2, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light,
  },
  statBig: { fontSize: 16, fontWeight: '900', color: COLORS.primary, marginTop: 4 },
  statLabel: { fontSize: 10, fontWeight: '700', color: COLORS.grayMuted },
  statSub: { fontSize: 9, color: COLORS.grayMuted, textAlign: 'center' },

  // Section titles
  sectionTitle: {
    fontSize: 11, fontWeight: '900', color: COLORS.grayMuted, letterSpacing: 0.8,
    marginBottom: 12, marginTop: 4,
  },

  // Stage cards
  stageCard: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light,
  },
  stageHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  stageIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stageLabel: { fontSize: 9, fontWeight: '900', color: COLORS.grayMuted, letterSpacing: 0.5 },
  stageName: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginTop: 1 },
  stageDesc: { fontSize: 11, color: COLORS.grayMuted, marginTop: 2 },
  earnedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D1FAE5',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  earnedText: { fontSize: 9, fontWeight: '900', color: '#065F46' },
  lockedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  lockedText: { fontSize: 9, fontWeight: '700', color: COLORS.grayMuted },
  progressGroup: { backgroundColor: '#FFF7F8', borderRadius: 12, padding: 10 },
  progRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  progLabel: { flex: 1, fontSize: 11, fontWeight: '700', color: COLORS.textDark },
  progPct: { fontSize: 11, fontWeight: '900', color: COLORS.primary },
  progTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 3 },

  // Discount section
  discountSection: { marginBottom: 20 },
  discountHeaderSubBox: { marginBottom: 14 },
  discountHeaderSub: { fontSize: 11, color: COLORS.grayMuted, lineHeight: 16 },
  milestoneOfferBadge: {
    backgroundColor: '#FFF1F5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginTop: 8,
    borderWidth: 1, borderColor: '#FFE4E6', alignSelf: 'flex-start'
  },
  milestoneOfferBadgeText: { fontSize: 9.5, fontWeight: '800', color: COLORS.secondary },
  planDiscountCard: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light,
  },
  planDiscountCardPremium: {
    borderColor: '#F472B6', borderWidth: 1.5,
    backgroundColor: '#FFFDFE', ...SHADOWS.medium
  },
  planCardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planCardTag: {
    backgroundColor: '#FEF3C7', borderColor: '#FCD34D', borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8
  },
  planCardTagText: { fontSize: 10, fontWeight: '900', color: '#D97706' },
  discountUnlockedRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  discountUnlockedLabel: { fontSize: 11, fontWeight: '800', color: '#10B981' },
  planCardTitle: { fontSize: 16, fontWeight: '900', color: COLORS.primary, marginBottom: 4 },
  planCardDesc: { fontSize: 11.5, color: COLORS.grayMuted, lineHeight: 16, marginBottom: 12 },
  planCardPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 12 },
  planCardPrice: { fontSize: 26, fontWeight: '900', color: COLORS.secondary },
  planCardOriginalPrice: { fontSize: 13, fontWeight: '700', color: COLORS.grayMuted, textDecorationLine: 'line-through' },
  planCardPriceSubtext: { fontSize: 11, color: COLORS.grayMuted, fontWeight: '700' },
  planCardCtaBtn: {
    width: '100%', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF1F5'
  },
  planCardCtaBtnPremium: {
    backgroundColor: COLORS.secondary
  },
  planCardCtaBtnText: { fontSize: 11, fontWeight: '900', color: COLORS.primary },
  howMilestoneDiscountsWorkTitle: { fontSize: 10, fontWeight: '900', color: COLORS.grayMuted, letterSpacing: 0.6, marginTop: 12, marginBottom: 10 },
  milestoneExplanationBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white,
    padding: 12, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border
  },
  milestoneExplanationIconBox: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center'
  },
  milestoneExplanationCol: { flex: 1 },
  milestoneExplanationTitle: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  milestoneExplanationDesc: { fontSize: 10, fontWeight: '700', color: COLORS.secondary, marginTop: 2 }
});

