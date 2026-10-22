import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image,
  RefreshControl, ActivityIndicator, TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Flame, Award, Users, BookOpen, Sparkles, BookMarked, Bot, Gift, Crown, HelpCircle, Receipt, PieChart } from 'lucide-react-native';
import FloatingAIBtn from '../components/FloatingAIBtn';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translate } from '../utils/i18n';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';

const WEB_HOST = 'https://healthsakhis.kiaansoftware.com';

const FEATURED_BOOKS = [
  {
    id: '1',
    title: 'Life After Shaadi',
    image: `${WEB_HOST}/Images/HS%20LIFE%20AFTRE%20SHAADI%20COVER.png`,
  },
  {
    id: '2',
    title: 'Men-O-Pause',
    image: `${WEB_HOST}/Images/HS%20MENOPAUSE.png`,
  },
  {
    id: '3',
    title: 'Beauty Without Parlour',
    image: `${WEB_HOST}/Images/final%20cover%20beauty%20without%20parlour.png`,
  },
  {
    id: '4',
    title: 'How to Read Your Husband',
    image: `${WEB_HOST}/Images/HS%20HOW%20TO%20READ%20HUSBAND%20COVE%20R.png`,
  },
  {
    id: '5',
    title: 'How to Read Woman Like a Poem',
    image: `${WEB_HOST}/Images/HOW%20TO%20READ%20WOMAN%20LIKE%20A%20POEM.png`,
  },
  {
    id: '6',
    title: '100 Operations',
    image: `${WEB_HOST}/Images/100%20operations.png`,
  },
  {
    id: '7',
    title: 'Heart to Heart',
    image: `${WEB_HOST}/Images/heart%20to%20heart.png`,
  },
  {
    id: '8',
    title: 'Fountain of Family',
    image: `${WEB_HOST}/Images/final%20cover%20fountain%20of%20family.png`,
  },
  {
    id: '9',
    title: 'PCOD Management',
    image: `${WEB_HOST}/Images/final%20pcod%20book%20cover.png`,
  },
  {
    id: '10',
    title: 'Weight Loss Guide',
    image: `${WEB_HOST}/Images/final%20wt%20loss%20book%20cover.png`,
  },
];

export default function DashboardScreen({ navigation }) {
  const { user, switchRole, setMemberProgress } = useAuth();
  const { langCode } = useLanguage();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const marqueeRef = useRef(null);
  const scrollX = useRef(0);

  useEffect(() => {
    // Automatic scrolling loop for books on dashboard
    const timer = setInterval(() => {
      if (marqueeRef.current) {
        scrollX.current += 0.8;
        const itemWidth = 117; // 105 width + 12 gap
        const limit = FEATURED_BOOKS.length * itemWidth;
        if (scrollX.current >= limit) {
          scrollX.current = 0;
        }
        marqueeRef.current.scrollTo({ x: scrollX.current, animated: false });
      }
    }, 25);

    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [response, profileRes] = await Promise.all([
        apiClient.get('/members/dashboard'),
        apiClient.get('/members/profile').catch(() => null)
      ]);
      if (response?.data && response.data.success) {
        const dashboardData = response.data.dashboard;
        const profileSub = profileRes?.data?.profile?.subscription;
        if (profileSub?.plan_name && profileSub.plan_name.toLowerCase() !== 'free sakhi' && !profileSub.is_trial_expired) {
          dashboardData.subscription_badge = profileSub.badge || profileSub.plan_name;
        } else if (profileSub?.badge && !profileSub.badge.toLowerCase().includes('free')) {
          dashboardData.subscription_badge = profileSub.badge;
        } else if (user?.plan && !user.plan.toLowerCase().includes('free')) {
          dashboardData.subscription_badge = user.plan;
        }
        setData(dashboardData);
        setMemberProgress(prev => ({
          ...prev,
          dashboard: dashboardData
        }));
      }
    } catch (err) {
      console.log('Error fetching dashboard:', err.message);
      // Fallback mock data
      setData({
        streak_count: 12,
        wellness_score: 84,
        subscription_badge: user?.plan || 'Free',
        daily_affirmation: 'Believe in yourself, Sakhi. You are stronger than you think.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.secondary} size="large" />
      </View>
    );
  }

  const streak = data?.streak_count ?? 12;
  const wellnessScore = data?.wellness_score ?? 84;
  const affirmation = translate('dailyAffirmationText', langCode) || data?.daily_affirmation || 'Dear Sister, you are human, learning, and growing every single day. Forgive yourself for past mistakes and embrace today anew. With lots of love and affection, Your HealthSakhi ❤️';

  const userName = (user?.name && user.name.toLowerCase() !== 'member') 
    ? user.name 
    : user?.fullName || (user?.email ? user.email.split('@')[0] : 'Sakhi');

  const isPremiumPlan = data?.subscription_badge && !data.subscription_badge.toLowerCase().includes('free');
  const displayBadge = isPremiumPlan 
    ? (data.subscription_badge.toLowerCase().includes('sakhi') ? data.subscription_badge : `${data.subscription_badge} Sakhi`)
    : (data?.subscription_badge || 'Free Sakhi');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 34) }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.welcomeText}>{translate('hello', langCode)}, {userName} 👋</Text>
            <Text style={styles.subtext}>{translate('commandCenter', langCode)}</Text>
          </View>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SubscriptionPlans')}
            style={[
              styles.badge, 
              isPremiumPlan ? styles.badgePremium : { backgroundColor: COLORS.softPink }
            ]}
          >
            <Award size={14} color={isPremiumPlan ? '#BE185D' : COLORS.secondary} />
            <Text style={[styles.badgeText, isPremiumPlan && styles.badgeTextPremium]}>
              {displayBadge}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Missed Days Alert Banner */}
        {data?.missed_days > 0 && (
          <View style={styles.missedDaysBanner}>
            <Text style={styles.missedDaysText}>🔥 Sakhi, you missed {data.missed_days} {data.missed_days === 1 ? 'day' : 'days'}! Keep your streak alive today.</Text>
          </View>
        )}

        {/* 1. Daily Affirmation Card */}
        <View style={styles.affirmationCard}>
          <Text style={styles.affirmationHeader}>🌸 {translate('dailyAffirmation', langCode)}</Text>
          <Text style={styles.affirmationText}>"{affirmation}"</Text>
        </View>

        {/* 2. Top Summary Cards (Streak, Badges & Master Status) */}
        <View style={styles.gridRow3}>
          {/* Active Streak */}
          <View style={styles.gridCard3}>
            <View style={[styles.iconBgSmall, { backgroundColor: '#FEF3C7' }]}>
              <Flame size={16} color="#F59E0B" />
            </View>
            <Text style={styles.cardVal3}>{streak} {langCode === 'en' ? 'Days' : (langCode === 'hi' ? 'दिन' : 'दिवस')} 🔥</Text>
            <Text style={styles.cardLabel3}>{translate('streak', langCode)}</Text>
          </View>

          {/* Badges */}
          <View style={styles.gridCard3}>
            <View style={[styles.iconBgSmall, { backgroundColor: '#F3E8FF' }]}>
              <Award size={16} color="#9333EA" />
            </View>
            <Text style={styles.cardVal3}>{data?.badges?.formatted || '02 / 4'}</Text>
            <Text style={styles.cardLabel3}>{translate('badges', langCode)}</Text>
          </View>

          {/* Master Status */}
          <View style={[styles.gridCard3, { backgroundColor: '#15192c' }]}>
            <View style={[styles.iconBgSmall, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Sparkles size={16} color="#FCD34D" />
            </View>
            <Text style={[styles.cardVal3, { color: '#FFFFFF', fontSize: 13 }]}>
              {langCode === 'hi' ? `स्तर ${data?.badges?.unlocked || 0}` : (langCode === 'mr' ? `पातळी ${data?.badges?.unlocked || 0}` : `Level ${data?.badges?.unlocked || 0}`)}
            </Text>
            <Text style={[styles.cardLabel3, { color: '#E9D5FF', fontWeight: 'bold' }]}>
              {langCode === 'hi' ? `मास्टर: ${data?.badges?.unlocked || 0} / 4` : (langCode === 'mr' ? `मास्टर: ${data?.badges?.unlocked || 0} / 4` : `Master: ${data?.badges?.unlocked || 0} / 4`)}
            </Text>
          </View>
        </View>

        {/* 3. Featured Scrolling Book Cover Cards (Placed directly below Top Summary Cards) */}
        <View style={styles.booksSectionCard}>
          <View style={styles.booksSectionHeader}>
            <View style={[styles.iconBg, { backgroundColor: '#FAF5FF' }]}>
              <BookOpen size={18} color="#7B1FA2" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.booksSectionTitle}>{translate('wellnessBooksLibrary', langCode)}</Text>
              <Text style={styles.booksSectionSub}>{translate('booksLibraryDesc', langCode)}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Books')} style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>{translate('explore', langCode)} →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={marqueeRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={true}
            contentContainerStyle={styles.booksScrollContent}
          >
            {[...FEATURED_BOOKS, ...FEATURED_BOOKS, ...FEATURED_BOOKS].map((book, i) => (
              <TouchableOpacity
                key={`${book.id}-${i}`}
                style={styles.bookCardItem}
                onPress={() => navigation.navigate('Books')}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: book.image }}
                  style={styles.bookCoverImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 4. 3x3 Grid of 9 Compact Equal-Sized Quick Access Cards */}
        {/* Row 1: FAQ | Books | Community */}
        <View style={styles.gridRow3}>
          <TouchableOpacity 
            style={styles.compactCard}
            onPress={() => navigation.navigate('FAQ')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBgSmall, { backgroundColor: '#F0FDF4' }]}>
              <HelpCircle size={18} color="#16A34A" />
            </View>
            <Text style={styles.compactTitle}>{translate('faq', langCode) || 'FAQ'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.compactCard}
            onPress={() => navigation.navigate('Books')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBgSmall, { backgroundColor: '#FDF2F8' }]}>
              <BookOpen size={18} color={COLORS.secondary} />
            </View>
            <Text style={styles.compactTitle}>{translate('books', langCode)}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.compactCard}
            onPress={() => navigation.navigate('CommunitySakhi')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBgSmall, { backgroundColor: '#FAF5FF' }]}>
              <Users size={18} color="#7B1FA2" />
            </View>
            <Text style={styles.compactTitle}>{translate('community', langCode)}</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Sakhi Diary | Home Budget Sakhi | Ask Health Sakhi */}
        <View style={styles.gridRow3}>
          <TouchableOpacity 
            style={styles.compactCard}
            onPress={() => navigation.navigate('SakhiDiary')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBgSmall, { backgroundColor: '#FFF7ED' }]}>
              <BookMarked size={18} color="#EA580C" />
            </View>
            <Text style={styles.compactTitle}>{translate('sakhiDiary', langCode) || 'Sakhi Diary'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.compactCard}
            onPress={() => navigation.navigate('HomeBudget')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBgSmall, { backgroundColor: '#ECFDF5' }]}>
              <PieChart size={18} color="#059669" />
            </View>
            <Text style={styles.compactTitle}>{translate('homeBudget', langCode) || 'Home Budget'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.compactCard}
            onPress={() => navigation.navigate('AskHealthSakhi')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBgSmall, { backgroundColor: '#EFF6FF' }]}>
              <Bot size={18} color="#2563EB" />
            </View>
            <Text style={styles.compactTitle}>{translate('askSakhi', langCode) || 'Ask Sakhi'}</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3: Wellness Certificate | Rewards | Plans */}
        <View style={styles.gridRow3}>
          <TouchableOpacity 
            style={styles.compactCard}
            onPress={() => navigation.navigate('Certificate')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBgSmall, { backgroundColor: '#F3E8FF' }]}>
              <Award size={18} color="#9333EA" />
            </View>
            <Text style={styles.compactTitle}>{translate('certificate', langCode)}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.compactCard}
            onPress={() => navigation.navigate('Rewards')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBgSmall, { backgroundColor: '#FEFCE8' }]}>
              <Gift size={18} color="#CA8A04" />
            </View>
            <Text style={styles.compactTitle}>{translate('rewards', langCode) || 'Rewards'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.compactCard}
            onPress={() => navigation.navigate('SubscriptionPlans')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBgSmall, { backgroundColor: '#F0FDF4' }]}>
              <Crown size={18} color="#16A34A" />
            </View>
            <Text style={styles.compactTitle}>{translate('plans', langCode) || 'Plans'}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Draggable Pink AI Floating FAB */}
      <FloatingAIBtn navigation={navigation} />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  subtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  badgePremium: {
    backgroundColor: '#FDF2F8',
    borderColor: '#F472B6',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
    textTransform: 'uppercase',
  },
  badgeTextPremium: {
    color: '#BE185D',
  },
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAccessCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  quickAccessTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
  },
  quickAccessSub: {
    fontSize: 9,
    color: COLORS.textMuted,
    lineHeight: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  gridRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  gridCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(75, 30, 90, 0.05)',
    ...SHADOWS.light,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.success,
  },
  cardVal: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  affirmationCard: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 24,
    ...SHADOWS.medium,
  },
  affirmationHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  affirmationText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 22,
  },
  // Wellness Books Section Card
  booksSectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 30, 90, 0.05)',
    ...SHADOWS.light,
    overflow: 'hidden',
  },
  booksSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 14,
  },
  booksSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
  },
  booksSectionSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  viewAllBtn: {
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  booksScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  bookCardItem: {
    width: 105,
    height: 155,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  bookCoverImage: {
    width: '100%',
    height: '100%',
  },
  // Partner Hub Card Styles
  partnerHubCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
    ...SHADOWS.medium,
  },
  partnerHubHeader: {
    marginBottom: 14,
  },
  partnerHubBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  partnerHubBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#EC4899',
    letterSpacing: 0.5,
  },
  partnerHubTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 4,
  },
  partnerHubSub: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    fontWeight: '600',
  },
  partnerStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 14,
  },
  partnerStatCol: {
    alignItems: 'center',
  },
  partnerStatVal: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.white,
  },
  partnerStatLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  partnerStatDivider: {
    width: 1,
    height: 25,
    backgroundColor: '#334155',
  },
  partnerHubActions: {
    flexDirection: 'row',
    gap: 10,
  },
  trainingVideoBtn: {
    flex: 1.2,
    backgroundColor: '#EC4899',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  trainingVideoText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
  openDashboardBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  openDashboardText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
  missedDaysBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 4,
  },
  missedDaysText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78350F',
    textAlign: 'center',
  },
  gridRow3: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCard3: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(75, 30, 90, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  iconBgSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cardVal3: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'center',
  },
  cardLabel3: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  compactCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(75, 30, 90, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  compactTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 2,
  },
});
