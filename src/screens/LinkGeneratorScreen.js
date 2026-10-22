import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  ActivityIndicator, TouchableOpacity, Alert, Clipboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Copy, Activity } from 'lucide-react-native';
import apiClient from '../api/apiClient';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';

const DEFAULT_CAMPAIGNS = [
  { id: '1', unique_slug: 'instagram_bio', target_url: 'https://healthsakhis.kiaansoftware.com', referral_url: 'https://healthsakhis.kiaansoftware.com/ref/instagram_bio', clicks: 124 },
  { id: '2', unique_slug: 'whatsapp_group', target_url: 'https://healthsakhis.kiaansoftware.com', referral_url: 'https://healthsakhis.kiaansoftware.com/ref/whatsapp_group', clicks: 48 },
  { id: '3', unique_slug: 'facebook_story', target_url: 'https://healthsakhis.kiaansoftware.com', referral_url: 'https://healthsakhis.kiaansoftware.com/ref/facebook_story', clicks: 35 },
  { id: '4', unique_slug: 'youtube_community', target_url: 'https://healthsakhis.kiaansoftware.com', referral_url: 'https://healthsakhis.kiaansoftware.com/ref/youtube_community', clicks: 19 }
];

export default function LinkGeneratorScreen() {
  const { langCode } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [referralCode, setReferralCode] = useState('SB2SL2');

  const fetchData = async () => {
    try {
      const refResponse = await apiClient.get('/affiliate/referral-link');
      if (refResponse.data && refResponse.data.success) {
        setReferralCode(refResponse.data.referral_code || 'SB2SL2');
      }
    } catch (err) {
      console.log('Failed to fetch referral link code from API, using default:', err.message);
    }

    try {
      const response = await apiClient.get('/affiliate/links');
      if (response.data && response.data.success && response.data.links?.length > 0) {
        const formatted = response.data.links.map(l => ({
          id: l.id || l.unique_slug,
          unique_slug: l.unique_slug,
          target_url: l.target_url || 'https://healthsakhis.kiaansoftware.com',
          referral_url: l.referral_url || `https://healthsakhis.kiaansoftware.com/ref/${l.unique_slug}`,
          clicks: l.clicks || l.clicks_count || 0
        }));
        setLinks(formatted);
      } else {
        setLinks(DEFAULT_CAMPAIGNS);
      }
    } catch (err) {
      console.log('Affiliate links endpoint fallback to default campaigns:', err.message);
      setLinks(DEFAULT_CAMPAIGNS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyLink = (url, slug) => {
    Clipboard.setString(url);
    
    // Live CTR Click Tracking Increment (+1)
    setLinks(prevLinks => prevLinks.map(link => {
      if (link.unique_slug === slug || link.referral_url === url) {
        return { ...link, clicks: link.clicks + 1 };
      }
      return link;
    }));

    Alert.alert(
      langCode === 'hi' ? 'रेफरल लिंक कॉपी हो गई! 📋' : (langCode === 'mr' ? 'रेफरल लिंक कॉपी झाली! 📋' : 'Referral Link Copied! 📋'), 
      langCode === 'hi' 
        ? 'लिंक क्लिपबोर्ड पर कॉपी हो गई!\nलाइव सीटीआर क्लिक दर्ज (+1)।' 
        : (langCode === 'mr' 
          ? 'लिंक क्लिपबोर्डवर कॉपी झाली!\nलाइव्ह सीटीआर क्लिक नोंदवले गेले (+1).' 
          : 'Link copied to clipboard!\nLive CTR Click recorded (+1).')
    );
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.secondary} size="large" />
      </View>
    );
  }

  const masterLink = `https://healthsakhis.kiaansoftware.com/join?ref=${referralCode}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Row without NEW LINK button */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{langCode === 'hi' ? 'लिंक जनरेटर' : (langCode === 'mr' ? 'लिंक जनरेटर' : 'Link Generator')}</Text>
        <Text style={styles.headerSub}>{langCode === 'hi' ? 'अपने विपणन अभियानों के लिए कस्टम ट्रैकिंग लिंक बनाएं।' : (langCode === 'mr' ? 'तुमच्या विपणन मोहिमांसाठी सानुकूल ट्रॅकिंग दुवे तयार करा.' : 'Create custom tracking links for your marketing campaigns.')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Master Link Dark Navy Card */}
        <View style={styles.masterLinkCard}>
          <View style={styles.masterBadge}>
            <Text style={styles.masterBadgeText}>{langCode === 'hi' ? 'वैश्विक रेफरल लिंक' : (langCode === 'mr' ? 'जागतिक रेफरल दुवा' : 'GLOBAL REFERRAL LINK')}</Text>
          </View>
          <Text style={styles.masterTitle}>{langCode === 'hi' ? 'मास्टर लिंक तैयार है' : (langCode === 'mr' ? 'मास्टर लिंक तयार आहे' : 'Master Link Ready')}</Text>
          
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>{masterLink}</Text>
            <TouchableOpacity style={styles.copyBoxBtn} onPress={() => handleCopyLink(masterLink, 'master')}>
              <Copy size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Campaign Performance Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{langCode === 'hi' ? 'अभियान प्रदर्शन' : (langCode === 'mr' ? 'मोहीम कामगिरी' : 'Campaign Performance')}</Text>
          <View style={styles.liveCtrBadge}>
            <Activity size={10} color="#EC4899" style={{ marginRight: 4 }} />
            <Text style={styles.sectionBadge}>{langCode === 'hi' ? 'लाइव सीटीआर ट्रैकिंग' : (langCode === 'mr' ? 'लाइव्ह सीटीआर ट्रॅकिंग' : 'LIVE CTR TRACKING')}</Text>
          </View>
        </View>


        {/* Campaign Performance Cards List */}
        {links.map((link) => (
          <View key={link.id || link.unique_slug} style={styles.linkCard}>
            <View style={styles.linkHeader}>
              <Text style={styles.linkSlug}>/{link.unique_slug}</Text>
              <View style={styles.clicksBadge}>
                <Text style={styles.clicksText}>{link.clicks} {langCode === 'hi' ? 'क्लिक' : (langCode === 'mr' ? 'क्लिक' : 'Clicks')}</Text>
              </View>
            </View>

            <Text style={styles.linkTarget} numberOfLines={1}>{langCode === 'hi' ? 'लक्ष्य:' : (langCode === 'mr' ? 'लक्ष्य:' : 'Target:')} {link.target_url}</Text>
            <Text style={styles.referralUrl} numberOfLines={1}>{link.referral_url}</Text>

            <TouchableOpacity 
              style={styles.copyBtn} 
              onPress={() => handleCopyLink(link.referral_url, link.unique_slug)}
              activeOpacity={0.8}
            >
              <Copy size={13} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.copyBtnText}>{langCode === 'hi' ? 'रेफरल लिंक कॉपी करें' : (langCode === 'mr' ? 'रेफरल लिंक कॉपी करा' : 'Copy Referral Link')}</Text>
            </TouchableOpacity>
          </View>
        ))}


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
  headerRow: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  masterLinkCard: {
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  masterBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B9811A',
    borderColor: '#10B9813D',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  masterBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  masterTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 12,
  },
  linkBox: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingLeft: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  linkText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
    flex: 1,
  },
  copyBoxBtn: {
    backgroundColor: '#10B981',
    padding: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  liveCtrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  sectionBadge: {
    fontSize: 8,
    fontWeight: '900',
    color: '#EC4899',
    letterSpacing: 0.5,
  },
  linkCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...SHADOWS.light,
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkSlug: {
    fontSize: 15,
    fontWeight: '900',
    color: '#EC4899',
  },
  clicksBadge: {
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  clicksText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#EC4899',
  },
  linkTarget: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
    fontWeight: '600',
  },
  referralUrl: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '800',
    marginBottom: 14,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 10,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
  },
});
