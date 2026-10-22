import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  TouchableOpacity, ActivityIndicator, Alert, TextInput,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DollarSign, Trash2, Plus, TrendingUp, TrendingDown } from 'lucide-react-native';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import FloatingAIBtn from '../components/FloatingAIBtn';

export default function HomeBudgetScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  
  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense'); // 'income' | 'expense'
  const [category, setCategory] = useState('Food');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      const response = await apiClient.get('/members/finance');
      if (response.data && response.data.success) {
        setTransactions(response.data.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      // Fallback mock transactions on API fail
      setTransactions([
        { id: '1', amount: 15000, type: 'income', category: 'Salary', notes: 'Monthly income', transactionDate: new Date().toISOString() },
        { id: '2', amount: 3500, type: 'expense', category: 'Rent', notes: 'Room rent share', transactionDate: new Date().toISOString() },
        { id: '3', amount: 1200, type: 'expense', category: 'Food', notes: 'Groceries & Veggies', transactionDate: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const handleAddTransaction = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid positive amount.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiClient.post('/members/finance', {
        amount: parseFloat(amount),
        type,
        category_name: category,
        description: notes.trim() || undefined,
        transaction_date: new Date().toISOString()
      });

      if (response.data && response.data.success) {
        Alert.alert('Success', 'Transaction added successfully!');
        setShowAddModal(false);
        setAmount('');
        setNotes('');
        fetchTransactions();
      }
    } catch (err) {
      console.error('Failed to create transaction:', err);
      Alert.alert('Error', 'Failed to save transaction.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiClient.delete(`/members/finance/${id}`);
              if (res.data && res.data.success) {
                Alert.alert('Deleted', 'Transaction removed successfully.');
                fetchTransactions();
              }
            } catch (err) {
              console.error('Failed to delete transaction', err);
              Alert.alert('Error', 'Failed to delete transaction.');
            }
          }
        }
      ]
    );
  };

  // Compute month calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpense;

  const categories = {
    income: ['Salary', 'Business', 'Gift', 'Investment', 'Other'],
    expense: ['Food', 'Rent', 'Utilities', 'Education', 'Health', 'Shopping', 'Travel', 'Other']
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
      {/* 1. Header Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Monthly Balance</Text>
        <Text style={[styles.netBalanceText, netBalance < 0 && { color: COLORS.rose }]}>
          ₹{netBalance}
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCol}>
            <View style={styles.indicatorRow}>
              <TrendingUp size={16} color={COLORS.success} />
              <Text style={styles.summaryVal}>₹{totalIncome}</Text>
            </View>
            <Text style={styles.summaryLabel}>Total Income</Text>
          </View>
          <View style={styles.dividerCol} />
          <View style={styles.summaryCol}>
            <View style={styles.indicatorRow}>
              <TrendingDown size={16} color={COLORS.rose} />
              <Text style={styles.summaryVal}>₹{totalExpense}</Text>
            </View>
            <Text style={styles.summaryLabel}>Total Expense</Text>
          </View>
        </View>
      </View>

      {/* 2. FlatList Transactions */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionHeader}>Recent Transactions</Text>
        
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />
          }
          renderItem={({ item }) => (
            <View style={styles.transactionItem}>
              <View style={styles.leftCol}>
                <View style={[styles.typeBadge, { backgroundColor: item.type === 'income' ? '#EAF7EA' : '#FFF0F0' }]}>
                  <Text style={{ fontSize: 14 }}>{item.type === 'income' ? '💰' : '💸'}</Text>
                </View>
                <View style={styles.details}>
                  <Text style={styles.category}>{item.category}</Text>
                  {(item.description || item.notes) ? <Text style={styles.notes}>{item.description || item.notes}</Text> : null}
                  <Text style={styles.date}>{new Date(item.date || item.transactionDate).toLocaleDateString()}</Text>
                </View>
              </View>

              <View style={styles.rightCol}>
                <Text style={[styles.amount, { color: item.type === 'income' ? COLORS.success : COLORS.rose }]}>
                  {item.type === 'income' ? '+' : '-'}₹{item.amount}
                </Text>
                <TouchableOpacity onPress={() => handleDeleteTransaction(item.id)} style={styles.deleteBtn}>
                  <Trash2 size={16} color={COLORS.grayMuted} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No transactions logged this month yet. 🌸</Text>
          }
        />
      </View>

      {/* 3. Floating Action Button to Add Transaction */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => {
          setCategory(type === 'income' ? 'Salary' : 'Food');
          setShowAddModal(true);
        }}
        activeOpacity={0.8}
      >
        <Plus size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* 4. Modal Overlay for Add Transaction Form */}
      {showAddModal ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Transaction</Text>
            
            {/* Toggle Income/Expense */}
            <View style={styles.typeToggle}>
              <TouchableOpacity 
                style={[styles.toggleBtn, type === 'expense' && styles.activeExpenseToggle]}
                onPress={() => {
                  setType('expense');
                  setCategory('Food');
                }}
              >
                <Text style={[styles.toggleText, type === 'expense' && styles.activeToggleText]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, type === 'income' && styles.activeIncomeToggle]}
                onPress={() => {
                  setType('income');
                  setCategory('Salary');
                }}
              >
                <Text style={[styles.toggleText, type === 'income' && styles.activeToggleText]}>Income</Text>
              </TouchableOpacity>
            </View>

            {/* Amount input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (₹)</Text>
              <TextInput 
                style={styles.modalInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="e.g. 500"
                placeholderTextColor={COLORS.grayMuted}
                keyboardType="numeric"
              />
            </View>

            {/* Category selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.catGrid}>
                {categories[type].map(c => (
                  <TouchableOpacity 
                    key={c}
                    style={[styles.catBtn, category === c && styles.activeCatBtn]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.catBtnText, category === c && styles.activeCatBtnText]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput 
                style={styles.modalInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Vegetables, salary bonus"
                placeholderTextColor={COLORS.grayMuted}
              />
            </View>

            {/* Modal actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddTransaction} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      <FloatingAIBtn navigation={navigation} />

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
  summaryCard: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(75, 30, 90, 0.05)',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  netBalanceText: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.success,
    marginVertical: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  dividerCol: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  listContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    ...SHADOWS.medium,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  typeBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    gap: 2,
  },
  category: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  notes: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  date: {
    fontSize: 9,
    color: COLORS.grayMuted,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amount: {
    fontSize: 14,
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    width: '90%',
    maxWidth: 320,
    ...SHADOWS.medium,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.grayLight,
    borderRadius: 14,
    padding: 4,
    marginBottom: SPACING.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeExpenseToggle: {
    backgroundColor: COLORS.rose,
  },
  activeIncomeToggle: {
    backgroundColor: COLORS.success,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  activeToggleText: {
    color: COLORS.white,
  },
  inputGroup: {
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.textDark,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catBtn: {
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeCatBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catBtnText: {
    fontSize: 10,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  activeCatBtnText: {
    color: COLORS.white,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
});
