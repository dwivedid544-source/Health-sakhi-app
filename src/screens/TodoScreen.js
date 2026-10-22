import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, ActivityIndicator, Alert, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Circle, Plus, Trash2, ListTodo, Tag, Search, RefreshCw } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { translate } from '../utils/i18n';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import FloatingAIBtn from '../components/FloatingAIBtn';

const CATEGORIES = ['General', 'Health', 'Learning', 'Finance', 'Mindset'];

export default function TodoScreen({ navigation }) {
  const { langCode } = useLanguage();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [selectedCat, setSelectedCat] = useState('General');
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchTodos = async () => {
    try {
      setError(null);
      const res = await apiClient.get('/members/todo');
      if (res.data && res.data.success && Array.isArray(res.data.todos)) {
        setTodos(res.data.todos);
      } else if (Array.isArray(res.data)) {
        setTodos(res.data);
      } else {
        setTodos([]);
      }
    } catch (err) {
      console.log('Error fetching todos:', err.message);
      setError('Unable to load tasks from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTodos();
  };

  const handleAddTodo = async () => {
    if (!newTitle.trim()) {
      Alert.alert(translate('todoAlertTitle', langCode) || 'Empty Title', translate('todoAlertMsg', langCode) || 'Please enter a task title first! ✨');
      return;
    }
    try {
      setAdding(true);
      let backendCategory = 'Personal';
      if (selectedCat === 'Health') backendCategory = 'Health';
      else if (selectedCat === 'Learning' || selectedCat === 'Finance') backendCategory = 'Work';

      const payload = {
        title: newTitle.trim(),
        category: backendCategory,
        due_date: new Date().toISOString(),
        due_time: '10:00'
      };

      const res = await apiClient.post('/members/todo', payload);
      if (res.data && (res.data.success || res.data.task)) {
        setNewTitle('');
        fetchTodos();
      } else {
        fetchTodos();
        setNewTitle('');
      }
    } catch (err) {
      console.log('Failed to add todo:', err.message);
      Alert.alert('Error', 'Failed to save task to server.');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    const nextStatus = !currentStatus;
    setTodos(prev => prev.map(t => t.id === id ? { ...t, is_completed: nextStatus } : t));
    try {
      await apiClient.put(`/members/todo/${id}`, { is_completed: nextStatus });
    } catch (err) {
      console.log('Failed to toggle todo:', err.message);
      // Rollback on failure
      setTodos(prev => prev.map(t => t.id === id ? { ...t, is_completed: currentStatus } : t));
      Alert.alert('Error', 'Could not update task status.');
    }
  };

  const handleDelete = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return todos;
    return todos.filter(t => (t.title || '').toLowerCase().includes(searchQuery.toLowerCase().trim()));
  }, [todos, searchQuery]);

  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.is_completed).length;
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.secondary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />
        }
      >
        {/* Header Summary */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.iconBg}>
              <ListTodo size={22} color={COLORS.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{translate('todoSakhi', langCode) || 'To-Do Sakhi'}</Text>
              <Text style={styles.headerSub}>
                {completedCount} of {totalCount} tasks completed ({percentage}%)
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${percentage}%` }]} />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <Search size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={translate('searchTasks', langCode) || "Search tasks..."}
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Add New Task Form */}
        <View style={styles.addCard}>
          <Text style={styles.addTitle}>{translate('addTaskTitle', langCode) || 'Add New Task'}</Text>
          <TextInput
            style={styles.input}
            placeholder={translate('typeTaskPlaceholder', langCode) || "Type your wellness task here..."}
            placeholderTextColor={COLORS.textMuted}
            value={newTitle}
            onChangeText={setNewTitle}
          />

          {/* Category Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, selectedCat === cat && styles.activeCatChip]}
                onPress={() => setSelectedCat(cat)}
              >
                <Text style={[styles.catChipText, selectedCat === cat && styles.activeCatChipText]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleAddTodo}
            disabled={adding}
            activeOpacity={0.85}
          >
            {adding ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Plus size={16} color={COLORS.white} />
                <Text style={styles.addBtnText}>{translate('addTaskBtn', langCode) || 'Add Task'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Error / Retry Banner */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchTodos} style={styles.retryBtn}>
              <RefreshCw size={14} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tasks List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionHeading}>{translate('yourTasks', langCode) || 'Your Tasks'}</Text>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No matching tasks found.' : 'No tasks yet. Add your first task above! 🌸'}
              </Text>
            </View>
          ) : (
            filteredTasks.map(item => (
              <View key={item.id} style={[styles.taskItem, item.is_completed && styles.taskItemDone]}>
                <TouchableOpacity
                  onPress={() => handleToggle(item.id, item.is_completed)}
                  style={styles.checkBtn}
                >
                  {item.is_completed ? (
                    <CheckCircle2 size={22} color={COLORS.secondary} />
                  ) : (
                    <Circle size={22} color={COLORS.textMuted} />
                  )}
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, item.is_completed && styles.taskTitleDone]}>
                    {item.title}
                  </Text>
                  {item.category && (
                    <View style={styles.tagBadge}>
                      <Tag size={10} color={COLORS.textMuted} />
                      <Text style={styles.tagText}>{item.category}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={16} color={COLORS.rose} />
                </TouchableOpacity>
              </View>
            ))
          )}
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
    gap: SPACING.md,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 30, 90, 0.08)',
    gap: 12,
    ...SHADOWS.light,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FDF2F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  progressBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 3,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primary,
  },
  addCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 30, 90, 0.08)',
    gap: 12,
    ...SHADOWS.light,
  },
  addTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
  },
  input: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catRow: {
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  activeCatChip: {
    backgroundColor: COLORS.secondary,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  activeCatChipText: {
    color: COLORS.white,
  },
  addBtn: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: 11,
    color: '#991B1B',
    fontWeight: '700',
    flex: 1,
  },
  retryBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryBtnText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '800',
  },
  listContainer: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 4,
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  taskItem: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 30, 90, 0.05)',
    ...SHADOWS.light,
  },
  taskItemDone: {
    opacity: 0.7,
    backgroundColor: '#FAF5FF',
  },
  checkBtn: {
    padding: 2,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 6,
  },
});
