import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  TouchableOpacity, ActivityIndicator, Image, Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen } from 'lucide-react-native';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';

export default function WellnessScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [books, setBooks] = useState([]);

  const fetchData = async () => {
    try {
      const res = await apiClient.get('/content/books');
      setBooks(res.data.books || []);
    } catch (err) {
      console.error('Failed to fetch books', err);
      // Fallback mocks
      setBooks([
        { id: '1', title: 'Hormonal Harmony Guide', description: 'Understand your monthly cycles and balance naturally.', author: 'Dr. Aditi Sharma' },
        { id: '2', title: 'Home Nutrition for Families', description: 'Simple recipes packed with local Indian superfoods.', author: 'Nutritionist Ritu' },
        { id: '3', title: 'PCOS Management Manual', description: 'A step-by-step workbook for reversing symptoms.', author: 'Expert Sakhi Team' },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleReadBook = (title) => {
    Alert.alert('Read Book', `Opening ebook reader for: "${title}" 📚`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.secondary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Content Feed — Books Only */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleReadBook(item.title)}
              activeOpacity={0.8}
            >
              <View style={styles.bookIconBg}>
                <Text style={{ fontSize: 32 }}>📖</Text>
              </View>
              <View style={styles.cardDetails}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.cardFooter}>By {item.author || 'Sakhi Expert'}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTabBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  activeTabText: {
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(75, 30, 90, 0.05)',
    ...SHADOWS.light,
  },
  bookIconBg: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDetails: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  cardFooter: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.grayMuted,
    marginTop: 2,
  },
});
