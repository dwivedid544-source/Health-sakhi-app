import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, TextInput, ActivityIndicator, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Quote, Sparkles, Sun, Moon, Library, Anchor, Globe, Flower2, Heart, HelpCircle, Send } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import FloatingAIBtn from '../components/FloatingAIBtn';

const SCRIPTURES = ['All', 'Bhagavad Gita', 'Quran', 'Bible', 'Sikhism', 'Jainism', 'Buddhism'];

const CATEGORIES = {
  'Wealth': { icon: '💰', subcategories: ['Saving Money', 'Earning Ethically', 'Financial Discipline', 'Greed vs Contentment', 'Charity & Donation'] },
  'Health': { icon: '💪', subcategories: ['Mind-Body Connection', 'Healing Energy', 'Wholesome Food', 'Sacred Sleep', 'Vitality', 'Inner Strength'] },
  'Mind': { icon: '🧠', subcategories: ['Control of Senses', 'Conquering Ego', 'Overcoming Anger', 'Anxiety & Worry', 'Clarity of Thought'] },
  'Success': { icon: '🚀', subcategories: ['Noble Ambition', 'Handling Failure', 'Strategic Planning', 'Honest Hardwork'] },
  'Relations': { icon: '❤️', subcategories: ['Parents & Family', 'Noble Friendship', 'Divine Love', 'Trust', 'Forgiveness'] },
  'Spirituality': { icon: '🧘', subcategories: ['Self Realization', 'Path of Devotion', 'Meditation'] }
};

const STATIC_QUOTES = {
  'Bhagavad Gita': [
    { quote: "Work is thy duty, reward is not thy concern.", reference: "Gita 2:47", insight: "Focus on process, not just chasing results.", takeaway: "Process over result." },
    { quote: "He whose food and sleep are balanced attains peace.", reference: "Gita 6:17", insight: "Moderation is foundation.", takeaway: "Balance is key." },
  ],
  'Quran': [
    { quote: "True wealth is a soul that is satisfied.", reference: "Hadith", insight: "Contentment is the greatest treasure.", takeaway: "Satisfaction exceeds accumulation." },
    { quote: "With hardship comes ease.", reference: "Quran 94:6", insight: "Every phase has an exit.", takeaway: "Hope over worry." },
  ],
  'Bible': [
    { quote: "He who is greedy for gain troubles his own house.", reference: "Proverbs 15:27", insight: "Excessive greed leads to internal and external chaos.", takeaway: "Balance gain with peace." },
    { quote: "Do not be anxious about tomorrow.", reference: "Matthew 6:34", insight: "Worry empties today of strength.", takeaway: "Live in the now." },
  ]
};

export default function SpiritualScreen({ navigation }) {
  const { langCode } = useLanguage();
  const [selectedScripture, setSelectedScripture] = useState('All');
  const [selectedCat, setSelectedCat] = useState('Wealth');
  const [selectedSubCat, setSelectedSubCat] = useState('Saving Money');
  
  const [userQuestion, setUserQuestion] = useState('');
  const [aiQuote, setAiQuote] = useState(null);
  const [loading, setLoading] = useState(false);

  // Default display quote from static list
  const getDisplayQuote = () => {
    if (aiQuote) return aiQuote;
    const list = STATIC_QUOTES[selectedScripture === 'All' ? 'Bhagavad Gita' : selectedScripture] || STATIC_QUOTES['Bhagavad Gita'];
    return list[0];
  };

  const handleAskAI = async () => {
    setLoading(true);
    setAiQuote(null);
    
    // Map langCode to backend expectations
    const langMap = { en: 'English', hi: 'Hindi', mr: 'Marathi' };
    const targetLang = langMap[langCode] || 'English';

    try {
      const res = await apiClient.post('/ai/spiritual-quote', {
        scripture: selectedScripture,
        category: selectedCat,
        subcategory: selectedSubCat,
        language: targetLang,
        recentQuotes: []
      });

      if (res.data && res.data.quote) {
        setAiQuote({
          quote: res.data.quote,
          reference: res.data.reference || 'Teaching',
          insight: res.data.meaning || res.data.insight || 'Divine lesson of wisdom.',
          takeaway: res.data.application || res.data.takeaway || 'Action path.'
        });
      } else {
        Alert.alert('AI Note', 'Could not generate dynamic quote, showing offline wisdom. 🌸');
      }
    } catch (err) {
      console.log('Spiritual AI quote generation failed:', err.message);
      Alert.alert('Offline Mode', 'Showing static scripture wisdom. Connect to network for AI insights! 🌸');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset AI quote when selections change so static fallback is shown
    setAiQuote(null);
  }, [selectedScripture, selectedCat, selectedSubCat]);

  const activeQuote = getDisplayQuote();
  const scriptIcon = (scripture) => {
    switch(scripture) {
      case 'Bhagavad Gita': return <Sun size={14} color="#D97706" />;
      case 'Quran': return <Moon size={14} color="#6366F1" />;
      case 'Bible': return <Library size={14} color="#A855F7" />;
      default: return <Flower2 size={14} color={COLORS.secondary} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeBadge}>🪔 SPIRITUAL WELLNESS</Text>
          <Text style={styles.welcomeTitle}>Scriptural Wisdom</Text>
          <Text style={styles.welcomeDesc}>
            Seek timeless answers to modern life questions from Bhagavad Gita, Quran, Bible, and other ancient scriptures.
          </Text>
        </View>

        {/* Scripture tab selector */}
        <Text style={styles.sectionHeader}>SELECT SCRIPTURE SOURCE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scriptureScroll}>
          {SCRIPTURES.map(sc => (
            <TouchableOpacity
              key={sc}
              style={[styles.scriptureTab, selectedScripture === sc && styles.activeScriptureTab]}
              onPress={() => setSelectedScripture(sc)}
            >
              {scriptIcon(sc)}
              <Text style={[styles.scriptureTabText, selectedScripture === sc && styles.activeScriptureTabText]}>
                {sc}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Categories selector */}
        <Text style={styles.sectionHeader}>CHOOSE DIMENSION</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {Object.keys(CATEGORIES).map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catTab, selectedCat === cat && styles.activeCatTab]}
              onPress={() => {
                setSelectedCat(cat);
                setSelectedSubCat(CATEGORIES[cat].subcategories[0]);
              }}
            >
              <Text style={styles.catIcon}>{CATEGORIES[cat].icon}</Text>
              <Text style={[styles.catTabText, selectedCat === cat && styles.activeCatTabText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Subcategories selector */}
        <Text style={styles.sectionHeader}>SELECT SPECIFIC CONCERN</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subCatScroll}>
          {CATEGORIES[selectedCat].subcategories.map(sub => (
            <TouchableOpacity
              key={sub}
              style={[styles.subCatTab, selectedSubCat === sub && styles.activeSubCatTab]}
              onPress={() => setSelectedSubCat(sub)}
            >
              <Text style={[styles.subCatTabText, selectedSubCat === sub && styles.activeSubCatTabText]}>
                {sub.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Wisdom card display */}
        <View style={styles.quoteCard}>
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={COLORS.secondary} size="large" />
              <Text style={styles.loaderText}>Asking Spiritual AI...</Text>
            </View>
          ) : (
            <>
              <View style={styles.quoteHeader}>
                <Quote size={24} color="#FBE8EB" fill="#FFF0F5" />
                <Text style={styles.quoteSource}>{selectedScripture === 'All' ? 'SCRIPTURE' : selectedScripture.toUpperCase()}</Text>
              </View>
              
              <Text style={styles.quoteText}>“{activeQuote.quote}”</Text>
              <Text style={styles.quoteRef}>— {activeQuote.reference}</Text>
              
              <View style={styles.divider} />
              
              <Text style={styles.insightLabel}>INSIGHT</Text>
              <Text style={styles.insightText}>{activeQuote.insight}</Text>
              
              <Text style={styles.takeawayLabel}>PRACTICAL TAKEAWAY</Text>
              <View style={styles.takeawayBadge}>
                <Sparkles size={10} color={COLORS.secondary} style={{ marginRight: 4 }} />
                <Text style={styles.takeawayText}>{activeQuote.takeaway}</Text>
              </View>
            </>
          )}
        </View>

        {/* Ask AI Section */}
        <Text style={styles.sectionHeader}>ASK SPIRITUAL AI ANYTHING</Text>
        <View style={styles.askAiCard}>
          <Text style={styles.askAiSub}>Type any struggle, query or choice you are facing:</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.askInput}
              placeholder="e.g. How do I handle sudden financial failure?"
              placeholderTextColor={COLORS.textMuted}
              value={userQuestion}
              onChangeText={setUserQuestion}
            />
            <TouchableOpacity style={styles.askBtn} onPress={handleAskAI}>
              <Send size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.generateBtn} onPress={handleAskAI}>
            <Sparkles size={12} color={COLORS.white} style={{ marginRight: 6 }} />
            <Text style={styles.generateBtnText}>GENERATE FRESH SCRIPTURE QUOTE</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
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
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: '#311021', // Dark maroon premium spiritual theme
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  welcomeBadge: {
    fontSize: 8,
    fontWeight: '900',
    color: '#F472B6',
    letterSpacing: 1,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
  },
  welcomeDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    marginTop: 6,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 14,
  },
  scriptureScroll: {
    marginBottom: 10,
  },
  scriptureTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginRight: 8,
    gap: 4,
  },
  activeScriptureTab: {
    backgroundColor: '#FFF0F5',
    borderColor: COLORS.secondary,
  },
  scriptureTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  activeScriptureTabText: {
    color: COLORS.secondary,
    fontWeight: '900',
  },
  catScroll: {
    marginBottom: 10,
  },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginRight: 8,
    gap: 6,
  },
  activeCatTab: {
    backgroundColor: '#311021',
    borderColor: '#311021',
  },
  catIcon: {
    fontSize: 12,
  },
  catTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  activeCatTabText: {
    color: COLORS.white,
    fontWeight: '900',
  },
  subCatScroll: {
    marginBottom: 16,
  },
  subCatTab: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 6,
  },
  activeSubCatTab: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  subCatTabText: {
    fontSize: 8,
    fontWeight: '850',
    color: COLORS.textMuted,
  },
  activeSubCatTabText: {
    color: COLORS.white,
  },
  quoteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.light,
  },
  loader: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteSource: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 1,
  },
  quoteText: {
    fontSize: 15,
    fontWeight: '750',
    color: COLORS.primary,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  quoteRef: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  insightLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 12,
    color: COLORS.primary,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 14,
  },
  takeawayLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  takeawayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  takeawayText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  askAiCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    ...SHADOWS.light,
  },
  askAiSub: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  askInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  askBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#311021',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtn: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  generateBtnText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
