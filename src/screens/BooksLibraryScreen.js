import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, TextInput, ActivityIndicator, Image, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Search, Star, Play, ChevronRight, Check, Globe } from 'lucide-react-native';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { translate } from '../utils/i18n';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import FloatingAIBtn from '../components/FloatingAIBtn';
import HeaderMenu from '../components/HeaderMenu';
import { storage } from '../utils/storage';
import { parseContentAssetMetadata } from '../utils/assetParser';

const BASELINE_BOOKS = [
  { id: '1', title: 'Heart to Heart', category: 'Heart Care', description: 'A warm, compassionate conversation on emotional & physical burdens.', coverUrl: 'https://health-sakhi-production.up.railway.app/uploads/heart-to-heart.png' },
  { id: '2', title: 'Secret Mind Game', category: 'Mental Healing', description: '100 Letters for the Woman Ready to Heal.', coverUrl: 'https://health-sakhi-production.up.railway.app/uploads/wt-loss.png' },
  { id: '3', title: 'Fountain of Family', category: 'Relationships', description: 'The great skill every woman must know for a harmonious home.', coverUrl: 'https://health-sakhi-production.up.railway.app/uploads/fountain.png' },
  { id: '4', title: 'Life After Shaadi', category: 'Relationships', description: 'Stories of real marriage, real women, real feelings, and real growth.', coverUrl: 'https://health-sakhi-production.up.railway.app/uploads/shaadi.png' },
  { id: '5', title: 'Men-O-Pause', category: 'Women Health', description: 'Comprehensive clinical & emotional guide for navigating menopause gracefully.', coverUrl: 'https://health-sakhi-production.up.railway.app/uploads/menopause.png' },
  { id: '6', title: 'Beauty Without Parlour', category: 'Women Health', description: 'Natural Ayurvedic wellness & holistic self-care secrets.', coverUrl: 'https://health-sakhi-production.up.railway.app/uploads/beauty.png' },
  { id: '7', title: 'How to Read Your Husband', category: 'Relationships', description: 'Understanding male psychology, communication, and deepening intimacy.', coverUrl: 'https://health-sakhi-production.up.railway.app/uploads/husband.png' },
  { id: '8', title: 'How to Read Woman Like a Poem', category: 'Relationships', description: 'Decoding emotional signals, empathy, and female wellness.', coverUrl: 'https://health-sakhi-production.up.railway.app/uploads/woman.png' },
  { id: '9', title: '100 Operations', category: 'Women Health', description: 'What every patient must know, ask, and do before & after surgical procedures.', coverUrl: 'https://health-sakhi-production.up.railway.app/uploads/operations.png' },
  { id: '10', title: 'PCOD Management', category: 'Women Health', description: 'Hormonal balance, diet, and lifestyle protocols for PCOD healing.', coverUrl: 'https://health-sakhi-production.up.railway.app/uploads/pcod.png' },
];

const CATEGORIES = ['All', 'Women Health', 'Relationships', 'Mental Healing', 'Heart Care'];

export default function BooksLibraryScreen({ navigation }) {
  const { langCode, setLanguage, LANGUAGES } = useLanguage();
  const { user, memberProgress, setMemberProgress } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [dashboardProgress, setDashboardProgress] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [completedBooks, setCompletedBooks] = useState([]);
  const [bookRewards, setBookRewards] = useState([]);

  const fetchBooksAndProgress = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }
      const res = await apiClient.get('/content-assets', {
        params: { type: 'Book', status: 'Published' }
      });
      let fetchedBooks = [];
      if (res.data && res.data.success && res.data.data?.length > 0) {
        const rawAssets = res.data.data;
        const normalizeKey = (str) => {
          if (!str) return '';
          return str.toLowerCase().trim().replace(/[^\w\s-]+/g, '').replace(/[\s_]+/g, '-');
        };

        // Group assets by groupKey to eliminate duplicate cards for multi-language versions
        const groups = {};
        rawAssets.forEach(b => {
          const key = (b.groupKey && b.groupKey.trim() !== '') ? b.groupKey.trim() : normalizeKey(b.title);
          if (!groups[key]) groups[key] = [];
          groups[key].push(b);
        });

        // Pick 1 best representative variant per groupKey matching langCode & collect all available languages
        const uniqueAssets = Object.values(groups).map(groupVariants => {
          const matchedLang = groupVariants.find(v => {
            const assetLangCode = (v.languageCode || '').toLowerCase().trim();
            const targetLangCode = (langCode || '').toLowerCase().trim();
            
            if (assetLangCode && targetLangCode && assetLangCode === targetLangCode) {
              return true;
            }
            
            if (v.language && targetLangCode) {
              const assetLangName = v.language.toLowerCase();
              if (targetLangCode === 'hi') {
                return assetLangName.includes('hindi') || assetLangName.includes('हिन्दी');
              } else if (targetLangCode === 'mr') {
                return assetLangName.includes('marathi') || assetLangName.includes('मराठी');
              } else if (targetLangCode === 'en') {
                return assetLangName.includes('english');
              } else {
                return assetLangName.includes(targetLangCode);
              }
            }
            return false;
          });
          const englishLang = groupVariants.find(v => 
            (v.languageCode || '').toLowerCase() === 'en' || (v.language && v.language.toLowerCase().includes('english'))
          );

          const langSet = new Set();
          groupVariants.forEach(v => {
            if (v.language) {
              v.language.split(',').forEach(l => {
                const trimmed = l.trim();
                if (trimmed) langSet.add(trimmed);
              });
            }
            if (v.languageCode) {
              if (v.languageCode.toLowerCase() === 'en') langSet.add('English');
              else if (v.languageCode.toLowerCase() === 'hi') langSet.add('Hindi');
              else if (v.languageCode.toLowerCase() === 'mr') langSet.add('Marathi');
            }
          });

          const rep = matchedLang || englishLang || groupVariants[0];
          return {
            ...rep,
            availableLangs: Array.from(langSet)
          };
        });

        fetchedBooks = uniqueAssets.map(b => {
          const parsed = parseContentAssetMetadata(b.description);
          return {
            id: String(b.id),
            title: b.title,
            category: b.category || 'Women Health',
            description: parsed.description || 'A handpicked health guide by HealthSakhi.',
            coverUrl: parsed.coverUrl || b.coverUrl || b.image,
            mediaUrl: b.mediaUrl,
            availableLangs: b.availableLangs || [b.language || 'English']
          };
        });
      }

      setBooks(fetchedBooks);

      // Load storage variables matching frontend localStorage
      const storedCompletedBooks = JSON.parse(await storage.getItem('completedBooks').catch(() => '[]') || '[]');
      setCompletedBooks(storedCompletedBooks);

      const storedBookRewards = JSON.parse(await storage.getItem('hs_book_rewards').catch(() => '[]') || '[]');
      setBookRewards(storedBookRewards);

      // Fetch member dashboard progress & profile
      const dashRes = await apiClient.get('/members/dashboard').catch(() => null);
      if (dashRes?.data?.success && dashRes.data.dashboard) {
        setDashboardProgress(dashRes.data.dashboard.user_book_progress || []);
        setMemberProgress(prev => ({
          ...prev,
          dashboard: dashRes.data.dashboard
        }));
      }

      const profRes = await apiClient.get('/members/profile').catch(() => null);
      if (profRes?.data?.success && profRes.data.profile) {
        setUserProfile(profRes.data.profile);
        setMemberProgress(prev => ({
          ...prev,
          profile: profRes.data.profile
        }));
      }
    } catch (err) {
      console.log('Failed to load books from API:', err.message);
      setBooks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBooksAndProgress(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchBooksAndProgress(true);

    const unsubscribe = navigation.addListener('focus', () => {
      fetchBooksAndProgress(false);
    });

    return unsubscribe;
  }, [navigation, langCode]);

  const userBooksCompleted = userProfile?.booksCompleted || 0;
  const rewardCompletedIds = bookRewards.map(r => String(r.bookId));
  const completedFromBackend = dashboardProgress.filter(p => p.completed).map(p => String(p.content_id));
  const allCompletedIds = Array.from(new Set([...completedBooks.map(String), ...completedFromBackend, ...rewardCompletedIds]));

  const completedCount = Math.max(userBooksCompleted, allCompletedIds.length);
  const readCount = Math.max(userBooksCompleted, completedCount, dashboardProgress.filter(p => p.position > 0).length);
  const totalVolumes = books.length;

  let academyRank = 'Seeker';
  if (completedCount >= 15) academyRank = 'Master Sakhi';
  else if (completedCount >= 5) academyRank = 'Wellness Warrior';
  else if (completedCount >= 1) academyRank = 'Seeker';

  const localizedRank = langCode === 'hi'
    ? (academyRank === 'Master Sakhi' ? 'मास्टर सखी' : (academyRank === 'Wellness Warrior' ? 'कल्याण योद्धा' : 'खोजी'))
    : (langCode === 'mr'
      ? (academyRank === 'Master Sakhi' ? 'मास्टर सखी' : (academyRank === 'Wellness Warrior' ? 'वेलनेस वॉरियर' : 'शोधक'))
      : academyRank);

  const isTrialExpired = userProfile?.subscription?.is_trial_expired;

  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'All' || b.category === activeCategory;
    return matchesSearch && matchesCat;
  });

function BookCoverImage({ uri, initials, style }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (error || !uri) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF5FF' }]}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.primary }}>{initials}</Text>
      </View>
    );
  }

  return (
    <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <Image
        source={{ uri, cache: 'force-cache' }}
        style={style}
        resizeMode="cover"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => setError(true)}
      />
      {loading && (
        <ActivityIndicator
          style={{ position: 'absolute' }}
          color={COLORS.secondary}
          size="small"
        />
      )}
    </View>
  );
}

  const renderBookCard = ({ item }) => {
    const initials = item.title.substring(0, 2).toUpperCase();
    const bProg = dashboardProgress.find(p => String(p.content_id) === String(item.id));
    const isCompleted = bProg?.completed || completedFromBackend.includes(String(item.id));
    const isReading = !isCompleted && bProg?.position > 0;
    const progressPercent = isCompleted ? 100 : (isReading ? Math.min(95, bProg.position) : 0);

    return (
      <TouchableOpacity
        style={[styles.bookCard, isCompleted && styles.completedCardBorder]}
        onPress={() => navigation.navigate('BookDetail', { bookId: item.id, book: item })}
        activeOpacity={0.85}
      >
        {/* Cover image or initials fallback */}
        <View style={styles.coverContainer}>
          <BookCoverImage uri={item.coverUrl} initials={initials} style={styles.coverImage} />
          {/* Category badge */}
          <View style={styles.categoryBadgeOnCover}>
            <Text style={styles.categoryBadgeText}>{(item.category || 'GENERAL').toUpperCase()}</Text>
          </View>
          {isCompleted ? (
            <View style={[styles.statusBadgeOverlay, { backgroundColor: '#10B981' }]}>
              <Text style={styles.statusBadgeText}>✓ Completed</Text>
            </View>
          ) : isReading ? (
            <View style={[styles.statusBadgeOverlay, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.statusBadgeText}>📖 {progressPercent}%</Text>
            </View>
          ) : null}
        </View>

        {/* Book meta */}
        <View style={styles.bookMeta}>
          <View style={styles.bookMetaRow}>
            <BookOpen size={10} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.readsText}>{isCompleted ? '1 READ' : 'EXPERT READ'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
              <Star size={10} color="#F59E0B" fill="#F59E0B" />
              <Star size={10} color="#F59E0B" fill="#F59E0B" />
              <Star size={10} color="#F59E0B" fill="#F59E0B" />
              <Star size={10} color="#F59E0B" fill="#F59E0B" />
              <Star size={10} color="#F59E0B" fill="#F59E0B" />
            </View>
          </View>
          <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.bookAuthor}>BY HEALTHSAKHI EXPERT</Text>
          
          {/* Multi-Language Indicator Badges */}
          {(() => {
            const rawLangs = item.availableLangs || [];
            const langSet = new Set();
            rawLangs.forEach(l => {
              const lower = l.toLowerCase();
              if (lower.includes('english') || lower === 'en') langSet.add('EN');
              else if (lower.includes('hindi') || lower.includes('हिन्दी') || lower === 'hi') langSet.add('हिन्दी');
              else if (lower.includes('marathi') || lower.includes('मराठी') || lower === 'mr') langSet.add('मराठी');
              else if (lower.includes('gujarati') || lower === 'gu') langSet.add('ગુજરાતી');
              else if (lower.includes('bengali') || lower === 'bn') langSet.add('বাংলা');
              else if (lower.includes('tamil') || lower === 'ta') langSet.add('தமிழ்');
              else if (lower.includes('telugu') || lower === 'te') langSet.add('తెలుగు');
              else if (lower.includes('kannada') || lower === 'kn') langSet.add('ಕನ್ನಡ');
              else langSet.add(l.toUpperCase());
            });
            const list = Array.from(langSet);
            if (list.length === 0) return null;
            const visible = list.slice(0, 2);
            const extra = list.length > 2 ? list.length - 2 : 0;

            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4, gap: 4 }}>
                {visible.map((lang, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#E6F4EA',
                      borderColor: '#CEEAD6',
                      borderWidth: 1,
                      borderRadius: 4,
                      paddingHorizontal: 4,
                      paddingVertical: 1,
                    }}
                  >
                    <Globe size={8} color="#137333" style={{ marginRight: 2 }} />
                    <Text style={{ fontSize: 8, fontWeight: '800', color: '#137333' }}>{lang}</Text>
                  </View>
                ))}
                {extra > 0 && (
                  <View
                    style={{
                      backgroundColor: '#F1F3F4',
                      borderColor: '#DADCE0',
                      borderWidth: 1,
                      borderRadius: 4,
                      paddingHorizontal: 4,
                      paddingVertical: 1,
                    }}
                  >
                    <Text style={{ fontSize: 8, fontWeight: '800', color: '#5F6368' }}>+{extra}</Text>
                  </View>
                )}
              </View>
            );
          })()}
          
          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: isCompleted ? '#10B981' : COLORS.secondary }]} />
          </View>
          
          <TouchableOpacity 
            style={[styles.readBtn, isCompleted && { backgroundColor: '#10B981' }]}
            onPress={() => navigation.navigate('BookDetail', { bookId: item.id, book: item })}
          >
            <Text style={styles.readBtnText}>{isCompleted ? 'READ AGAIN ›' : (isReading ? 'RESUME ›' : 'READ ›')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.langHeaderBar}>
        <Text style={styles.langHeaderTitle}>📚 Sakhi Books Library</Text>
        <HeaderMenu navigation={navigation} />
      </View>


      {/* 1-Month Free Trial Expired Lock Screen Overlay */}
      {isTrialExpired ? (
        <View style={styles.expiredLockContainer}>
          <View style={styles.expiredLockIconBg}>
            <BookOpen size={40} color={COLORS.white} />
          </View>
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredBadgeText}>1-Month Free Sakhi Plan Expired 🌸</Text>
          </View>
          <Text style={styles.expiredTitle}>Upgrade to Premium Plan 💎</Text>
          <Text style={styles.expiredDesc}>
            Your 30-day Free Sakhi trial period has ended. Please upgrade to a Premium plan to unlock unlimited Books, AI Sakhi Chat Bot, and Community Sakhis!
          </Text>
          <TouchableOpacity
            style={styles.expiredUpgradeBtn}
            onPress={() => navigation.navigate('SubscriptionPlans')}
            activeOpacity={0.88}
          >
            <Text style={styles.expiredUpgradeBtnText}>UPGRADE TO PREMIUM PLAN 💎</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={COLORS.secondary} size="large" />
        </View>
      ) : (
        <>
          {/* Top Dynamic Stats Dashboard */}
          <View style={styles.statsDashboardGrid}>
            <View style={styles.statBoxCard}>
              <Text style={styles.statBoxLabel}>{translate('totalVolumes', langCode)}</Text>
              <Text style={styles.statBoxValue}>{totalVolumes}</Text>
            </View>
            <View style={[styles.statBoxCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <Text style={[styles.statBoxLabel, { color: '#047857' }]}>{translate('completed', langCode)}</Text>
              <Text style={[styles.statBoxValue, { color: '#047857' }]}>{completedCount}</Text>
            </View>
            <View style={[styles.statBoxCard, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
              <Text style={[styles.statBoxLabel, { color: '#BE123C' }]}>{translate('booksRead', langCode)}</Text>
              <Text style={[styles.statBoxValue, { color: '#BE123C' }]}>{readCount}</Text>
            </View>
            <View style={[styles.statBoxCard, { backgroundColor: '#1E293B' }]}>
              <Text style={[styles.statBoxLabel, { color: '#94A3B8' }]}>{translate('academyRank', langCode)}</Text>
              <Text style={[styles.statBoxValue, { color: COLORS.white, fontSize: 13 }]}>{localizedRank}</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={translate('searchPlaceholder', langCode)}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.categoryScrollWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.categoryScrollContainer}
            >
              {(() => {
                const getCategoryLabel = (cat) => {
                  switch (cat) {
                    case 'All': return translate('all', langCode);
                    case 'Women Health': return translate('womenHealth', langCode);
                    case 'Relationships': return translate('relationships', langCode);
                    case 'Mental Healing': return translate('mentalHealing', langCode);
                    case 'Heart Care': return translate('heartCare', langCode);
                    default: return cat;
                  }
                };

                return CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, activeCategory === cat && styles.activeCategoryChip]}
                    onPress={() => setActiveCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.categoryChipText, activeCategory === cat && styles.activeCategoryChipText]}>
                      {getCategoryLabel(cat).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ));
              })()}
            </ScrollView>
          </View>

          <FlatList
            data={filteredBooks}
            renderItem={renderBookCard}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.booksRow}
            contentContainerStyle={styles.booksList}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <BookOpen size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Books Found</Text>
                <Text style={styles.emptyDesc}>Try a different category or search term.</Text>
              </View>
            }
          />
        </>
      )}
      <FloatingAIBtn navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  langHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FCE7F3',
  },
  langHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  langPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  langPickerBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  langDropdown: {
    position: 'absolute',
    top: 54,
    right: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.xs,
    zIndex: 100,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    ...SHADOWS.medium,
    width: 170,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  activeLangOption: {
    backgroundColor: '#FFF0F5',
  },
  langOptionText: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  activeLangOptionText: {
    color: COLORS.secondary,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    ...SHADOWS.light,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  categoryScrollWrapper: {
    height: 48,
    marginBottom: 10,
  },
  categoryScrollContainer: {
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    paddingVertical: 2,
  },
  categoryChip: {
    backgroundColor: COLORS.white,
    borderColor: '#FCE7F3',
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  activeCategoryChip: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  categoryChipText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#9A8A8E',
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  activeCategoryChipText: {
    color: COLORS.white,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '850',
    color: COLORS.primary,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  booksList: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  booksRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bookCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    overflow: 'hidden',
    ...SHADOWS.light,
  },
  coverContainer: {
    position: 'relative',
    height: 160,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverInitials: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  categoryBadgeOnCover: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(236, 72, 153, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    color: COLORS.white,
  },
  bookMeta: {
    padding: 10,
  },
  bookMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  readsText: {
    fontSize: 7,
    fontWeight: '850',
    color: COLORS.textMuted,
  },
  bookTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
    lineHeight: 16,
  },
  bookAuthor: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: 3,
    marginBottom: 6,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: '#FBE8EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 3,
  },
  readBtn: {
    alignSelf: 'flex-end',
  },
  readBtnText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  statusBadgeOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 10,
  },
  statusBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  completedCardBorder: {
    borderColor: '#10B981',
    borderWidth: 1.5,
    backgroundColor: '#ECFDF5',
  },
  statsDashboardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginVertical: 10,
    gap: 6,
  },
  statBoxCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  statBoxLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: COLORS.textMuted,
    marginBottom: 2,
    textAlign: 'center',
  },
  statBoxValue: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'center',
  },
  expiredLockContainer: {
    margin: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCE7F3',
    ...SHADOWS.medium,
  },
  expiredLockIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  expiredBadge: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  expiredBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#BE123C',
    textTransform: 'uppercase',
  },
  expiredTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  expiredDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  expiredUpgradeBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    ...SHADOWS.medium,
  },
  expiredUpgradeBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.white,
    textTransform: 'uppercase',
  },
});
