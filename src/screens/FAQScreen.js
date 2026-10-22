import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, LayoutAnimation, Platform, UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronDown, ChevronUp, HelpCircle, ArrowLeft, ThumbsUp, ThumbsDown, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';
import { translate } from '../utils/i18n';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import faqApi from '../api/faqApi';

const DEFAULT_CATEGORIES = [
  'All',
  'Account',
  'Health Tracking',
  'Consultation',
  'Payments',
  'Privacy',
  'Technical Support'
];

export default function FAQScreen({ navigation }) {
  const { langCode } = useLanguage();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [votedFaqIds, setVotedFaqIds] = useState({});

  useEffect(() => {
    loadVotedFaqs();
    fetchFaqs();
  }, [langCode]);

  const loadVotedFaqs = async () => {
    try {
      const stored = await AsyncStorage.getItem('hs_voted_faqs');
      if (stored) {
        setVotedFaqIds(JSON.parse(stored));
      }
    } catch (e) {
      console.log('Error loading voted FAQs:', e);
    }
  };

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await faqApi.getFaqs();
      const fetchedFaqs = res?.data || res?.faqs || [];
      setFaqs(fetchedFaqs);

      // Extract unique categories dynamically
      const cats = new Set(DEFAULT_CATEGORIES);
      fetchedFaqs.forEach(faq => {
        if (faq.category) {
          const trimmed = faq.category.trim();
          if (trimmed) {
            const exists = Array.from(cats).find(c => c.toLowerCase() === trimmed.toLowerCase());
            if (!exists) {
              cats.add(trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase());
            }
          }
        }
      });
      setCategories(Array.from(cats));
    } catch (e) {
      console.error('Fetch FAQs error:', e);
      // Fallback FAQs if backend empty
      const fallback = [
        { id: '1', category: 'Account', question: 'How do I change my profile information?', answer: 'Go to the Profile tab, tap "Edit Profile", update your details, and tap "Save Changes".' },
        { id: '2', category: 'Health Tracking', question: 'How is my wellness score calculated?', answer: 'Your wellness score is calculated based on your daily check-in streak, completed books, and habit logs.' },
        { id: '3', category: 'Consultation', question: 'How do I message my Personal Doctor?', answer: 'Navigate to "Ask Health Sakhi" screen to send confidential direct messages to your doctor.' },
        { id: '4', category: 'Payments', question: 'What payment methods are supported?', answer: 'We support UPI, Razorpay, Debit/Credit Cards, NetBanking, and mobile wallets.' },
        { id: '5', category: 'Privacy', question: 'Is my personal health data kept safe?', answer: 'Yes! All your health logs and personal conversations are encrypted and confidential under our Privacy Promise.' },
        { id: '6', category: 'Technical Support', question: 'What should I do if audio playback stops?', answer: 'Ensure your device internet connection is active, or tap the Refresh button to restart the session.' }
      ];
      setFaqs(fallback);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleVote = async (faqId, type) => {
    if (votedFaqIds[faqId]) return;
    try {
      const res = await faqApi.submitFeedback(faqId, type);
      if (res && res.success) {
        setFaqs(prevFaqs =>
          prevFaqs.map(faq => {
            if (faq.id === faqId) {
              return {
                ...faq,
                helpfulCount: type === 'helpful' ? (faq.helpfulCount || 0) + 1 : (faq.helpfulCount || 0),
                notHelpfulCount: type !== 'helpful' ? (faq.notHelpfulCount || 0) + 1 : (faq.notHelpfulCount || 0)
              };
            }
            return faq;
          })
        );
        const newVotes = { ...votedFaqIds, [faqId]: type };
        setVotedFaqIds(newVotes);
        await AsyncStorage.setItem('hs_voted_faqs', JSON.stringify(newVotes));
      }
    } catch (err) {
      console.error('Failed to submit FAQ feedback:', err);
    }
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'All' || faq.category?.toLowerCase() === activeCategory.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || faq.question?.toLowerCase().includes(query) || faq.answer?.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <HelpCircle size={20} color={COLORS.secondary} />
          <Text style={styles.headerTitle}>{translate('faq', langCode) || 'FAQ & Help'}</Text>
        </View>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchBoxContainer}>
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.grayMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={translate('searchFAQ', langCode) || 'Search questions and answers...'}
            placeholderTextColor={COLORS.grayMuted}
          />
        </View>
      </View>

      {/* Category Tabs Horizontal Scroll */}
      <View style={styles.categoryScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, isActive && styles.catChipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.catChipText, isActive && styles.catChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Accordion FAQs List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      ) : filteredFaqs.length === 0 ? (
        <View style={styles.center}>
          <HelpCircle size={44} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No matching questions found</Text>
          <Text style={styles.emptySub}>Try searching with different keywords or switch category.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filteredFaqs.map(faq => {
            const isExpanded = expandedId === faq.id;
            return (
              <View key={faq.id} style={styles.faqCard}>
                <TouchableOpacity style={styles.questionRow} onPress={() => toggleExpand(faq.id)} activeOpacity={0.8}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.questionText}>{faq.question}</Text>
                    {faq.category && (
                      <View style={[styles.tagBadge, { marginTop: 0 }]}>
                        <Text style={styles.tagText}>{faq.category.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={20} color={COLORS.secondary} />
                  ) : (
                    <ChevronDown size={20} color={COLORS.grayMuted} />
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.answerContainer}>
                    <Text style={styles.answerText}>{faq.answer}</Text>
                    
                    <View style={styles.feedbackRow}>
                      <Text style={styles.feedbackLabel}>WAS THIS HELPFUL?</Text>
                      {votedFaqIds[faq.id] ? (
                        <View style={styles.votedStatus}>
                          <Check size={12} color={COLORS.success} />
                          <Text style={styles.votedText}>THANK YOU!</Text>
                        </View>
                      ) : (
                        <View style={styles.voteButtons}>
                          <TouchableOpacity 
                            style={styles.voteBtn} 
                            onPress={() => handleVote(faq.id, 'helpful')}
                          >
                            <ThumbsUp size={14} color={COLORS.grayMuted} />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.voteBtn} 
                            onPress={() => handleVote(faq.id, 'not_helpful')}
                          >
                            <ThumbsDown size={14} color={COLORS.grayMuted} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.primary },
  searchBoxContainer: { paddingHorizontal: SPACING.md, paddingTop: 12, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.white, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textDark },
  categoryScrollContainer: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  categoryScroll: { paddingHorizontal: SPACING.md, gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
  },
  catChipActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  catChipText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  catChipTextActive: { color: COLORS.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginTop: 14 },
  emptySub: { fontSize: 12, color: COLORS.grayMuted, textAlign: 'center', marginTop: 4, maxWidth: 260 },
  list: { padding: SPACING.md, paddingBottom: 40 },
  faqCard: {
    backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOWS.light,
  },
  questionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, gap: 10,
  },
  questionText: { flex: 1, fontSize: 14, fontWeight: '800', color: COLORS.primary, lineHeight: 20 },
  answerContainer: {
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4,
    borderTopWidth: 1, borderTopColor: COLORS.grayLight,
  },
  answerText: { fontSize: 13, color: COLORS.textDark, lineHeight: 20 },
  tagBadge: {
    alignSelf: 'flex-start', backgroundColor: COLORS.softPink,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  tagText: { fontSize: 9, fontWeight: '900', color: COLORS.secondary, letterSpacing: 0.5 },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  feedbackLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.grayMuted,
    letterSpacing: 0.5,
  },
  votedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  votedText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.success,
  },
  voteButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voteBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
});
