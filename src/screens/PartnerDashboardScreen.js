import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  RefreshControl, ActivityIndicator, TouchableOpacity, Share, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, DollarSign, Award, Link, Share2, ArrowUpRight } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';

export default function PartnerDashboardScreen() {
  const { user } = useAuth();
  const { langCode } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/affiliate/dashboard');
      if (response.data && response.data.success) {
        setData(response.data);
      }
    } catch (err) {
      console.log('Error fetching partner dashboard, using fallbacks:', err.message);
      // Fallback mocks
      setData({
        profile: {
          referral_code: 'SB2SL2',
          website_url: 'https://mysakhiguide.com',
        },
        stats: {
          total_referrals: 3,
          converted_referrals: 2,
          total_earned: 2,
          available_balance: 2,
          total_paid: 0,
          conversion_rate: '66.7%'
        },
        referrals: [
          { id: '1', signupDate: '2026-06-18T10:00:00Z', fullName: 'Referred Tester', conversionStatus: 'PAID' },
          { id: '2', signupDate: '2026-06-18T12:00:00Z', fullName: 'Referred Tester', conversionStatus: 'PAID' }
        ]
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

  const handleShareCode = async () => {
    const code = data?.profile?.referral_code || 'SB2SL2';
    const msg = langCode === 'hi' 
      ? `अंतरंग स्वास्थ्य सलाहकारों और ट्रैकर्स को अनलॉक करने के लिए मेरे रेफरल कोड: "${code}" का उपयोग करके हेल्थसखी पर पंजीकरण करें! 🌸` 
      : (langCode === 'mr' 
        ? `अंतरंग आरोग्य सल्लागार आणि ट्रॅकर्स अनलॉक करण्यासाठी माझ्या रेफरल कोड: "${code}" चा वापर करून हेल्थसखी वर नोंदणी करा! 🌸` 
        : `Register on HealthSakhi using my referral code: "${code}" to unlock intimate health advisors and trackers! 🌸`);
    try {
      await Share.share({ message: msg });
    } catch (e) {

      console.error(e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.secondary} size="large" />
      </View>
    );
  }

  const stats = data?.stats || {};
  const referrals = data?.referrals || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />
        }
      >
        {/* Dark Blue Hero Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{langCode === 'hi' ? 'आधिकारिक साझेदार सखी' : (langCode === 'mr' ? 'अधिकृत भागीदार सखी' : 'OFFICIAL PARTNER SAKHI')}</Text>
          </View>
          <Text style={styles.heroTitle}>
            {langCode === 'hi' ? 'आपका प्रभाव ' : (langCode === 'mr' ? 'तुमचा प्रभाव ' : 'Your impact is ')}
            <Text style={styles.heroHighlight}>{langCode === 'hi' ? 'बढ़ रहा है।' : (langCode === 'mr' ? 'वाढत आहे.' : 'Growing.')}</Text>
          </Text>
          <Text style={styles.heroSub}>
            {langCode === 'hi' 
              ? 'आप पार्टनर सखी बन गए हैं! अपनी बहनों के साथ हेल्थसखी साझा करें और कमीशन कमाएं।' 
              : (langCode === 'mr' 
                ? 'तुम्ही भागीदार सखी बनला आहात! आपल्या भगिनींसोबत हेल्थसखी शेअर करा आणि कमिशन मिळवा.' 
                : 'Aap Partner Sakhi ban gaye hain! Share HealthSakhi with our sisters and earn commissions.')}
          </Text>
          
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroBtnPrimary} onPress={handleShareCode}>
              <Text style={styles.heroBtnTextPrimary}>{langCode === 'hi' ? 'रेफरल कोड प्राप्त करें' : (langCode === 'mr' ? 'रेफरल कोड मिळवा' : 'GET REFERRAL CODE')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroBtnSecondary} onPress={() => Alert.alert(
              langCode === 'hi' ? 'साझेदार कमाई' : (langCode === 'mr' ? 'भागीदार कमाई' : 'Partner Earnings'), 
              langCode === 'hi' ? 'सभी सदस्यता रेफरल पर 15% त्वरित कमीशन कमाएं!' : (langCode === 'mr' ? 'सर्व सदस्यत्व रेफरल्सवर १५% त्वरित कमिशन मिळवा!' : 'Earn 15% instant commission on all subscription referrals!')
            )}>
              <Text style={styles.heroBtnTextSecondary}>{langCode === 'hi' ? 'कमीशन नियम' : (langCode === 'mr' ? 'कमिशन नियम' : 'COMMISSION RULES')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Compact Partner Training Video Button */}
        <TouchableOpacity 
          style={styles.videoCompactBtn}
          onPress={() => Alert.alert(
            langCode === 'hi' ? 'साझेदार प्रशिक्षण वीडियो 🎬' : (langCode === 'mr' ? 'भागीदार प्रशिक्षण व्हिडिओ 🎬' : 'Partner Training Video 🎬'),
            langCode === 'hi' 
              ? '▶️ पार्टनर सखी प्रशिक्षण वीडियो चलाना: "रेफरल कोड कैसे साझा करें और 15% कमीशन कमाएं"'
              : (langCode === 'mr' 
                ? '▶️ भागीदार सखी प्रशिक्षण व्हिडिओ चालवणे: "रेफरल कोड कसा शेअर करावा आणि १५% कमिशन कसे मिळवावे"' 
                : '▶️ Playing Partner Sakhi Training Video: "How to share referral code & earn 15% commissions"')
          )}
          activeOpacity={0.85}
        >
          <Text style={styles.videoCompactText}>
            {langCode === 'hi' ? '▶ पार्टनर ट्रेनिंग वीडियो देखें (3 मिनट) 🎬' : (langCode === 'mr' ? '▶ भागीदार प्रशिक्षण व्हिडिओ पहा (3 मिनिटे) 🎬' : '▶ WATCH PARTNER TRAINING VIDEO (3 MINS) 🎬')}
          </Text>
        </TouchableOpacity>


        {/* 2x2 Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Total Earnings */}
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{langCode === 'hi' ? 'कुल कमाई' : (langCode === 'mr' ? 'एकूण कमाई' : 'TOTAL EARNINGS')}</Text>
            <Text style={styles.statValue}>₹{stats.total_earned || 0}</Text>
            <Text style={styles.statSub}>{langCode === 'hi' ? '+₹0 आज' : (langCode === 'mr' ? '+₹0 आज' : '+₹0 today')}</Text>
          </View>
          
          {/* Total Referrals */}
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{langCode === 'hi' ? 'कुल रेफरल्स' : (langCode === 'mr' ? 'एकूण रेफरल्स' : 'TOTAL REFERRALS')}</Text>
            <Text style={styles.statValue}>{stats.total_referrals || 0}</Text>
            <Text style={styles.statSub}>{langCode === 'hi' ? '+0 आज' : (langCode === 'mr' ? '+0 आज' : '+0 today')}</Text>
          </View>

          {/* Wallet Balance */}
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{langCode === 'hi' ? 'वॉलेट बैलेंस' : (langCode === 'mr' ? 'वॉलेट शिल्लक' : 'WALLET BALANCE')}</Text>
            <Text style={styles.statValue}>₹{stats.available_balance || 0}</Text>
            <Text style={styles.statSub}>{langCode === 'hi' ? 'आज उपलब्ध' : (langCode === 'mr' ? 'आज उपलब्ध' : 'Available today')}</Text>
          </View>

          {/* Conversion Rate */}
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{langCode === 'hi' ? 'रूपांतरण दर' : (langCode === 'mr' ? 'रूपांतरण दर' : 'CONVERSION RATE')}</Text>
            <Text style={styles.statValue}>{stats.conversion_rate || '0.0%'}</Text>
            <Text style={styles.statSub}>{langCode === 'hi' ? 'भुगतान किया / कुल आज' : (langCode === 'mr' ? 'भरलेले / एकूण आज' : 'Paid / Total today')}</Text>
          </View>
        </View>


        {/* Recent Conversions & Assets Row */}
        <Text style={styles.sectionHeader}>{langCode === 'hi' ? 'हालिया रूपांतरण' : (langCode === 'mr' ? 'अलीकडील रूपांतरणे' : 'Recent Conversions')}</Text>
        {referrals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {langCode === 'hi' ? 'अभी तक कोई रेफर्ड साइनअप लॉग नहीं हुआ है। 🌸' : (langCode === 'mr' ? 'अद्याप कोणतेही संदर्भित साइनअप लॉग केलेले नाहीत. 🌸' : 'No referred signups logged yet. 🌸')}
            </Text>
          </View>
        ) : (
          referrals.map((item) => {
            const isPaid = (item.conversionStatus || '').toUpperCase() === 'PAID';
            return (
              <View key={item.id} style={styles.conversionCard}>
                <View style={styles.conversionInfo}>
                  <View style={styles.conversionAvatar}>
                    <Text style={styles.avatarText}>RE</Text>
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.conversionName}>{item.fullName || 'Referred Tester'}</Text>
                    <Text style={styles.conversionStatusText}>
                      {langCode === 'hi' ? 'कमीशन स्वीकृत' : (langCode === 'mr' ? 'कमिशन मंजूर' : 'COMMISSION APPROVED')} - {new Date(item.signupDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.conversionMeta}>
                  <Text style={styles.conversionValue}>₹1.00</Text>
                  <Text style={[styles.statusText, isPaid ? styles.statusPaid : styles.statusPending]}>
                    {isPaid 
                      ? (langCode === 'hi' ? 'स्वीकृत' : (langCode === 'mr' ? 'मंजूर' : 'APPROVED')) 
                      : (langCode === 'hi' ? 'लंबित' : (langCode === 'mr' ? 'प्रलंबित' : 'PENDING'))}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        {/* Top Performing Assets */}
        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>{langCode === 'hi' ? 'शीर्ष प्रदर्शन करने वाली संपत्तियां' : (langCode === 'mr' ? 'उत्कृष्ट कामगिरी करणारी मालमत्ता' : 'Top Performing Assets')}</Text>
        <View style={styles.assetsCard}>
          {/* Asset 1 */}
          <View style={styles.assetRow}>
            <View style={styles.assetHeader}>
              <Text style={styles.assetLabel}>{langCode === 'hi' ? 'बैनर - महिला स्वास्थ्य' : (langCode === 'mr' ? 'बॅनर - महिला आरोग्य' : 'Banner - Women Health')}</Text>
              <Text style={styles.assetVal}>48%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '48%', backgroundColor: COLORS.secondary }]} />
            </View>
          </View>

          {/* Asset 2 */}
          <View style={styles.assetRow}>
            <View style={styles.assetHeader}>
              <Text style={styles.assetLabel}>{langCode === 'hi' ? 'वीडियो - पीसीओडी परिचय' : (langCode === 'mr' ? 'व्हिडिओ - पीसीओडी परिचय' : 'Video - PCOD Intro')}</Text>
              <Text style={styles.assetVal}>32%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '32%', backgroundColor: COLORS.secondary }]} />
            </View>
          </View>

          {/* Asset 3 */}
          <View style={styles.assetRow}>
            <View style={styles.assetHeader}>
              <Text style={styles.assetLabel}>{langCode === 'hi' ? 'कूपन - सखी20' : (langCode === 'mr' ? 'कूपन - सखी20' : 'Coupon - SAKHI20')}</Text>
              <Text style={styles.assetVal}>20%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '20%', backgroundColor: COLORS.secondary }]} />
            </View>
          </View>
        </View>


      </ScrollView>
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
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    backgroundColor: '#0F172A',
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F43F5E1E',
    borderColor: '#F43F5E3D',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 16,
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#F43F5E',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
    lineHeight: 28,
  },
  heroHighlight: {
    color: '#EC4899',
  },
  heroSub: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 20,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroBtnPrimary: {
    backgroundColor: '#EC4899',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  heroBtnTextPrimary: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  heroBtnSecondary: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  heroBtnTextSecondary: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 18,
    width: '48%',
    ...SHADOWS.light,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  statSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 12,
  },
  conversionCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    ...SHADOWS.light,
  },
  conversionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
  },
  conversionName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  conversionStatusText: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginTop: 2,
  },
  conversionMeta: {
    alignItems: 'flex-end',
  },
  conversionValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    marginTop: 2,
  },
  statusPaid: {
    color: COLORS.success,
  },
  statusPending: {
    color: '#D97706',
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  assetsCard: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 20,
    ...SHADOWS.light,
  },
  assetRow: {
    marginBottom: 14,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  assetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  assetVal: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Compact Video Training Button styles
  videoCompactBtn: {
    backgroundColor: '#EC4899',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  videoCompactText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
