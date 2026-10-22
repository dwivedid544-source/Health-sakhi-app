import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Briefcase, Sparkles, Play, Award, ArrowRight, Share2, DollarSign, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translate } from '../utils/i18n';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';

export default function PartnerSakhiTabScreen({ navigation }) {
  const { user, switchRole } = useAuth();
  const { langCode } = useLanguage();

  const userName = (user?.name && user.name.toLowerCase() !== 'member')
    ? user.name
    : user?.fullName || (user?.email ? user.email.split('@')[0] : 'Sakhi');

  const handlePlayVideo = () => {
    Alert.alert(
      langCode === 'hi' ? 'साझेदार प्रशिक्षण वीडियो 🎬' : (langCode === 'mr' ? 'भागीदार प्रशिक्षण व्हिडिओ 🎬' : 'Partner Training Video 🎬'),
      langCode === 'hi' 
        ? '▶️ पार्टनर सखी प्रशिक्षण वीडियो चलाना: "रेफरल कोड कैसे साझा करें और 15% कमीशन कमाएं"'
        : (langCode === 'mr' 
          ? '▶️ भागीदार सखी प्रशिक्षण व्हिडिओ चालवणे: "रेफरल कोड कसा शेअर करावा आणि १५% कमिशन कसे मिळवावे"' 
          : '▶️ Playing Partner Sakhi Training Video: "How to share referral code & earn 15% commissions"')
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Congratulatory Hero Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Sparkles size={14} color="#EC4899" style={{ marginRight: 4 }} />
            <Text style={styles.heroBadgeText}>{translate('congratulations', langCode)} {userName.toUpperCase()}!</Text>
          </View>

          <Text style={styles.heroTitle}>
            {translate('officialPartner', langCode)}
          </Text>

          <Text style={styles.heroSub}>
            {translate('partnerSub', langCode)}
          </Text>
        </View>


        {/* Full Partner Training Video Card */}
        <View style={styles.videoCard}>
          <View style={styles.videoHeader}>
            <View style={styles.videoBadge}>
              <Text style={styles.videoBadgeText}>{translate('trainingVideo', langCode)}</Text>
            </View>
            <Text style={styles.videoTitle}>{translate('howToEarn', langCode)}</Text>
            <Text style={styles.videoSub}>
              {translate('videoSub', langCode)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.videoThumbnail}
            onPress={handlePlayVideo}
            activeOpacity={0.88}
          >
            <View style={styles.playCircle}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
            <View style={styles.videoDurationBadge}>
              <Text style={styles.videoDurationText}>
                {langCode === 'en' ? '3:24 mins • HD Training' : (langCode === 'hi' ? '3:24 मिनट • एचडी ट्रेनिंग' : '3:24 मिनिटे • एचडी ट्रेनिंग')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.watchVideoBtn} onPress={handlePlayVideo}>
            <Play size={16} color={COLORS.white} style={{ marginRight: 6 }} />
            <Text style={styles.watchVideoBtnText}>{translate('watchVideoNow', langCode)}</Text>
          </TouchableOpacity>
        </View>


        {/* Partner Benefits & Features List */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>{translate('whyBecomePartner', langCode)}</Text>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIconBg}>
              <DollarSign size={18} color={COLORS.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitItemTitle}>{translate('commission15', langCode)}</Text>
              <Text style={styles.benefitItemSub}>{translate('commission15Sub', langCode)}</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIconBg}>
              <Share2 size={18} color={COLORS.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitItemTitle}>{translate('customReferral', langCode)}</Text>
              <Text style={styles.benefitItemSub}>{translate('customReferralSub', langCode)}</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIconBg}>
              <Award size={18} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitItemTitle}>
                {langCode === 'hi' ? 'सिस्टरहुड वित्तीय स्वतंत्रता' : (langCode === 'mr' ? 'आर्थिक स्वातंत्र्य' : 'Sisterhood Financial Freedom')}
              </Text>
              <Text style={styles.benefitItemSub}>
                {langCode === 'hi' ? 'अन्य सखियों की मदद करते हुए खुद को सशक्त बनाएं।' : (langCode === 'mr' ? 'इतर सखींना मदत करताना स्वतःला सक्षम करा.' : 'Empower yourself while helping other sakhis.')}
              </Text>
            </View>
          </View>
        </View>


        {/* Direct Partner Login / Dashboard Button (Moved from Profile) */}
        <View style={styles.partnerLoginSection}>
          <Text style={styles.partnerLoginPrompt}>{translate('readyViewStats', langCode)}</Text>

          <TouchableOpacity
            style={styles.openDashboardBtn}
            onPress={() => switchRole('partner')}
            activeOpacity={0.88}
          >
            <Briefcase size={20} color={COLORS.white} style={{ marginRight: 10 }} />
            <Text style={styles.openDashboardBtnText}>{translate('loginPartnerDashboard', langCode)}</Text>
            <ArrowRight size={18} color={COLORS.white} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
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
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 22,
    ...SHADOWS.medium,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#EC4899',
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
    fontWeight: '600',
  },
  // Video Card Styles
  videoCard: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FAF5FF',
    ...SHADOWS.medium,
  },
  videoHeader: {
    marginBottom: 14,
  },
  videoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  videoBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  videoSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
    fontWeight: '600',
    lineHeight: 16,
  },
  videoThumbnail: {
    height: 165,
    backgroundColor: '#1E1B4B',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 12,
  },
  playCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  playIcon: {
    color: COLORS.white,
    fontSize: 20,
    marginLeft: 4,
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  videoDurationText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
  },
  watchVideoBtn: {
    flexDirection: 'row',
    backgroundColor: '#EC4899',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchVideoBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // Benefits List Card
  benefitsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    ...SHADOWS.light,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 14,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  benefitIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  benefitItemSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
    fontWeight: '600',
  },
  // Partner Login Section
  partnerLoginSection: {
    backgroundColor: '#FAF5FF',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    alignItems: 'center',
  },
  partnerLoginPrompt: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 14,
    textAlign: 'center',
  },
  openDashboardBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...SHADOWS.medium,
  },
  openDashboardBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
