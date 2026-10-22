import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award, Download, Lock, CheckCircle2, BookOpen, Sun, Users, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translate } from '../utils/i18n';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import memberApi from '../api/memberApi';
import { downloadAndOpenPdf } from '../utils/pdfDownloadService';

export default function WellnessCertificateScreen({ navigation }) {
  const { user, memberProgress, setMemberProgress } = useAuth();
  const { langCode } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [unlockedCertificates, setUnlockedCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [profRes, certRes, dashRes] = await Promise.all([
        memberApi.getProfile().catch(() => null),
        memberApi.getCertificates().catch(() => null),
        memberApi.getDashboard().catch(() => null)
      ]);

      if (profRes && profRes.success && profRes.profile) {
        setProfile(profRes.profile);
        setMemberProgress(prev => ({
          ...prev,
          profile: profRes.profile
        }));
      }
      if (dashRes && dashRes.success && dashRes.dashboard) {
        setDashboardData(dashRes.dashboard);
        setMemberProgress(prev => ({
          ...prev,
          dashboard: dashRes.dashboard
        }));
      }
      if (certRes?.certificates) {
        setUnlockedCertificates(certRes.certificates);
      }
    } catch (e) {
      console.error('Failed to fetch certificate data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setMemberProgress]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(false);
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData(true);

    const unsubscribe = navigation.addListener('focus', () => {
      fetchData(false);
    });
    return unsubscribe;
  }, [navigation, fetchData]);

  const currentStreak = useMemo(() => {
    return dashboardData?.streak_count || memberProgress?.dashboard?.streak_count || profile?.streak_count || 0;
  }, [dashboardData, memberProgress, profile]);

  const metrics = useMemo(() => ({
    books: profile?.booksCompleted || 0,
    logins: profile?.loginDays || 0,
    referrals: profile?.referralCount || 0
  }), [profile]);

  const currentPlan = useMemo(() => {
    const badge = (profile?.subscription?.plan_name || user?.plan || '').toLowerCase();
    if (badge.includes('premium') || badge.includes('pro')) return 'premium-sakhi';
    if (badge.includes('basic')) return 'basic-sakhi';
    return 'free-sakhi';
  }, [profile, user]);

  const handleCheckEligibility = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const res = await memberApi.checkCertificates();
      if (res?.certificates) {
        setUnlockedCertificates(res.certificates);
        Alert.alert('Eligibility Evaluated 🎉', 'Certificate evaluation complete. Any new credentials unlocked are now available!');
      } else {
        Alert.alert('Evaluated', 'No new certificates unlocked yet. Keep completing your wellness modules!');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to check certificate eligibility.');
    } finally {
      setChecking(false);
    }
  };

  const handleDownload = async (tier, unlocked) => {
    if (!unlocked) {
      Alert.alert('Locked 🔒', 'This certificate is not yet unlocked. Fulfill requirements to claim!');
      return;
    }

    const certId = unlocked.certificateId || unlocked.id || tier.level;
    if (downloadingId === certId) return;

    setDownloadingId(certId);
    try {
      const certTitle = tier.title || 'Wellness Certificate';
      const memberName = profile?.fullName || user?.name || 'Member';
      const safeTitle = certTitle.replace(/\s+/g, '_');
      const safeMember = memberName.replace(/\s+/g, '_');
      const filename = `HealthSakhi_${safeTitle}_${safeMember}.pdf`;

      const result = await downloadAndOpenPdf({
        endpoint: `/certificates/${certId}/download`,
        filename,
        dialogTitle: `Health Sakhi - ${certTitle}`
      });

      if (result && result.success) {
        Alert.alert(
          'Certificate Downloaded 🎉',
          `${certTitle} for ${memberName} downloaded and opened successfully!`
        );
      }
    } catch (e) {
      console.error('Failed to download certificate PDF:', e);
      Alert.alert(
        'Download Error ❌',
        e?.message || 'Unable to download certificate PDF. Please check your plan & connection.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const certificateTiers = [
    {
      level: 'basic',
      title: 'Basic Wellness Certificate',
      desc: 'Starter module of Health Sakhi wellness curriculum.',
      reqBooks: 5,
      reqLogins: 15,
      reqReferrals: 0,
      reqPlan: 'basic-sakhi',
      color: '#F59E0B'
    },
    {
      level: 'advance',
      title: 'Advance Wellness Certificate',
      desc: 'Consistent personal health and active habit log maintenance.',
      reqBooks: 15,
      reqLogins: 30,
      reqReferrals: 0,
      reqPlan: 'basic-sakhi',
      color: '#6366F1'
    },
    {
      level: 'gold',
      title: 'Gold Ambassador Certificate',
      desc: 'Elite wellness standards and community contribution.',
      reqBooks: 25,
      reqLogins: 30,
      reqReferrals: 10,
      reqPlan: 'premium-sakhi',
      color: '#D97706'
    },
    {
      level: 'platinum',
      title: 'Platinum Health Leader Certificate',
      desc: 'Supreme wellness execution and community mentorship.',
      reqBooks: 40,
      reqLogins: 60,
      reqReferrals: 25,
      reqPlan: 'premium-sakhi',
      color: '#9333EA'
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}><View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Award size={20} color={COLORS.secondary} />
          <Text style={styles.headerTitle}>Wellness Certificates</Text>
        </View>
        <TouchableOpacity onPress={handleCheckEligibility} disabled={checking} style={styles.evalBtn}>
          {checking ? <ActivityIndicator size="small" color={COLORS.white} /> : <RefreshCw size={14} color={COLORS.white} />}
        </TouchableOpacity>
      </View>{loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />
          }
        ><View style={styles.statsCard}>
            <View style={styles.statItem}>
              <BookOpen size={20} color={COLORS.secondary} />
              <Text style={styles.statVal}>{metrics.books}</Text>
              <Text style={styles.statLabel}>BOOKS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Sun size={20} color={COLORS.secondary} />
              <Text style={styles.statVal}>{currentStreak}</Text>
              <Text style={styles.statLabel}>STREAK</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Users size={20} color={COLORS.secondary} />
              <Text style={styles.statVal}>{metrics.referrals}</Text>
              <Text style={styles.statLabel}>REFERRALS</Text>
            </View>
          </View>{certificateTiers.map((tier) => {
            const unlocked = unlockedCertificates.find(
              c => (c.level || c.certificateId || '').toLowerCase() === tier.level
            );
            const isUnlocked = Boolean(unlocked);
            const certId = unlocked?.certificateId || unlocked?.id || tier.level;
            const isDownloadingThis = downloadingId === certId;

            const bookProgress = Math.min(100, Math.round((metrics.books / tier.reqBooks) * 100));
            const loginProgress = Math.min(100, Math.round((metrics.logins / tier.reqLogins) * 100));

            return (
              <View key={tier.level} style={[styles.card, isUnlocked && styles.cardUnlocked]}><View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: `${tier.color}15` }]}>
                    <Award size={24} color={tier.color} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{tier.title}</Text>
                    <Text style={styles.cardDesc}>{tier.desc}</Text>
                  </View>

                  {isUnlocked ? (
                    <View style={styles.badgeEarned}>
                      <CheckCircle2 size={12} color="#10B981" />
                      <Text style={styles.badgeEarnedText}>EARNED</Text>
                    </View>
                  ) : (
                    <View style={styles.badgeLocked}>
                      <Lock size={12} color={COLORS.grayMuted} />
                      <Text style={styles.badgeLockedText}>LOCKED</Text>
                    </View>
                  )}
                </View><View style={styles.progressSection}><View style={styles.progressRow}>
                    <Text style={styles.progLabel}>Books: {metrics.books}/{tier.reqBooks}</Text>
                    <Text style={styles.progPct}>{bookProgress}%</Text>
                  </View><View style={styles.progTrack}>
                    <View style={[styles.progFill, { width: `${bookProgress}%`, backgroundColor: tier.color }]} />
                  </View><View style={[styles.progressRow, { marginTop: 8 }]}><Text style={styles.progLabel}>Days: {metrics.logins}/{tier.reqLogins}</Text><Text style={styles.progPct}>{loginProgress}%</Text></View><View style={styles.progTrack}><View style={[styles.progFill, { width: `${loginProgress}%`, backgroundColor: tier.color }]} /></View></View><TouchableOpacity
                  style={[styles.downloadBtn, (!isUnlocked || isDownloadingThis) && styles.downloadBtnDisabled]}
                  onPress={() => handleDownload(tier, unlocked)}
                  disabled={!isUnlocked || isDownloadingThis}
                >
                  {isDownloadingThis ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                      {isUnlocked ? (
                        <Download size={14} color={COLORS.white} />
                      ) : (
                        <Lock size={14} color={COLORS.grayMuted} />
                      )}
                      <Text style={[styles.downloadBtnText, !isUnlocked && { color: COLORS.grayMuted }]}>
                        {isUnlocked
                          ? translate('downloadCertPdf', langCode) || 'DOWNLOAD CERTIFICATE'
                          : (bookProgress === 100 && loginProgress === 100 ? 'UPGRADE PLAN TO UNLOCK 🔒' : 'LOCKED — FULFILL REQUIREMENTS')
                        }
                      </Text>
                    </View>
                  )}
                </TouchableOpacity></View>
            );
          })}</ScrollView>
      )}</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  evalBtn: {
    backgroundColor: COLORS.secondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  scroll: { padding: SPACING.md, gap: SPACING.md },
  statsCard: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16, padding: SPACING.md,
    justifyContent: 'space-around', alignItems: 'center', ...SHADOWS.light,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statItem: { alignItems: 'center', gap: 2 },
  statVal: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  statLabel: { fontSize: 10, color: COLORS.grayMuted, fontWeight: '700' },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
  card: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: SPACING.md, gap: 14,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light,
  },
  cardUnlocked: { borderColor: COLORS.secondary, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  cardDesc: { fontSize: 12, color: COLORS.grayMuted, marginTop: 2, lineHeight: 16 },
  badgeEarned: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D1FAE5',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  badgeEarnedText: { fontSize: 10, fontWeight: '900', color: '#065F46' },
  badgeLocked: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.grayLight,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  badgeLockedText: { fontSize: 10, fontWeight: '700', color: COLORS.grayMuted },
  progressSection: { gap: 4, backgroundColor: COLORS.grayLight, padding: 12, borderRadius: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textDark },
  progPct: { fontSize: 11, fontWeight: '900', color: COLORS.primary },
  progTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 3 },
  downloadBtn: {
    backgroundColor: COLORS.secondary, borderRadius: 14, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    ...SHADOWS.light,
  },
  downloadBtnDisabled: { backgroundColor: COLORS.grayLight, elevation: 0 },
  downloadBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
});
