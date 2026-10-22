import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Receipt, Download, ArrowLeft, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { translate } from '../utils/i18n';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import memberApi from '../api/memberApi';

export default function ReceiptsScreen({ navigation }) {
  const { langCode } = useLanguage();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInvoices = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await memberApi.getSubscription();
      setInvoices(res?.invoices || res?.data?.invoices || []);
    } catch (e) {
      console.error('Invoices load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const handleDownload = (item) => {
    Alert.alert(
      translate('receiptDetails', langCode) || 'Receipt Details',
      `Invoice #: ${item.invoiceNumber || item.id}\nAmount: ₹${item.amount}\nStatus: ${item.status}\nDate: ${new Date(item.paidAt || item.createdAt).toLocaleDateString()}`,
      [{ text: 'OK' }]
    );
  };

  const statusBadge = (status) => {
    if (status === 'PAID') {
      return (
        <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
          <CheckCircle size={10} color="#2E7D32" />
          <Text style={[styles.badgeText, { color: '#2E7D32' }]}>PAID</Text>
        </View>
      );
    } else if (status === 'PENDING') {
      return (
        <View style={[styles.badge, { backgroundColor: '#FFF8E1' }]}>
          <Clock size={10} color="#F57F17" />
          <Text style={[styles.badgeText, { color: '#F57F17' }]}>PENDING</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, { backgroundColor: '#FFEBEE' }]}>
        <XCircle size={10} color="#C62828" />
        <Text style={[styles.badgeText, { color: '#C62828' }]}>{status}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Receipt size={20} color={COLORS.secondary} />
          <Text style={styles.headerTitle}>{translate('receipts', langCode) || 'Payment Receipts'}</Text>
        </View>
        <TouchableOpacity onPress={() => loadInvoices(true)} style={styles.refreshBtn}>
          <RefreshCw size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      ) : invoices.length === 0 ? (
        <View style={styles.center}>
          <Receipt size={48} color={COLORS.border} />
          <Text style={styles.emptyTitle}>{translate('noReceipts', langCode) || 'No receipts yet'}</Text>
          <Text style={styles.emptySub}>{translate('receiptsDesc', langCode) || 'Receipts will appear here after subscription transactions.'}</Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => String(item.id)}
          onRefresh={() => loadInvoices(true)}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.iconBg}>
                  <Receipt size={20} color={COLORS.secondary} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.invNumber}>{item.invoiceNumber || `INV-${item.id}`}</Text>
                  <View style={styles.rowMeta}>
                    {statusBadge(item.status)}
                    <Text style={styles.dateText}>
                      {new Date(item.paidAt || item.createdAt).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                  <Text style={styles.amountText}>₹{item.amount}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload(item)}>
                <Download size={14} color={COLORS.white} />
                <Text style={styles.downloadText}>View</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  refreshBtn: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginTop: 14 },
  emptySub: { fontSize: 12, color: COLORS.grayMuted, marginTop: 4, textAlign: 'center' },
  list: { padding: SPACING.md, paddingBottom: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginBottom: 12,
    ...SHADOWS.light,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  iconBg: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.softPink,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  info: { flex: 1 },
  invNumber: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  dateText: { fontSize: 11, color: COLORS.grayMuted },
  amountText: { fontSize: 14, fontWeight: '800', color: COLORS.secondary, marginTop: 4 },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.secondary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  downloadText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
});
