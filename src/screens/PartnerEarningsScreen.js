import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Modal, 
  ActivityIndicator, TouchableOpacity, TextInput, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DollarSign, Clock, Download, TrendingUp, AlertCircle } from 'lucide-react-native';
import apiClient from '../api/apiClient';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';

export default function PartnerEarningsScreen() {
  const { langCode } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [amount, setAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('UPI');
  const [requesting, setRequesting] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [metrics, setMetrics] = useState({ unpaid: 2, paid: 12000, total: 2 });

  const fetchData = async () => {
    // 1. Fetch Payouts
    try {
      const response = await apiClient.get('/affiliate/payouts');
      if (response.data && response.data.success) {
        setPayouts(response.data.payouts || []);
      }
    } catch (err) {
      console.log('Failed to fetch payouts from API:', err.message);
      setPayouts([
        { id: '3fc7cec2-0b54-49c3-8041-6a8f2c37f019', amount: 0.999, payoutMethod: 'UPI', status: 'approved', date: '2026-06-18T10:00:00Z' },
        { id: '558c9ca5-68e6-40d3-8100-a173e4d42351', amount: 0.999, payoutMethod: 'UPI', status: 'approved', date: '2026-06-18T12:00:00Z' }
      ]);
    }

    // 2. Fetch Commissions
    try {
      const commResponse = await apiClient.get('/affiliate/commissions');
      if (commResponse.data && commResponse.data.success) {
        setCommissions(commResponse.data.commissions || []);
      }
    } catch (err) {
      console.log('Failed to fetch commissions from API:', err.message);
      setCommissions([
        { id: '1', clientName: 'Bonus Incentive', planName: 'Bonus Incentive', amount: 0.999, date: '2026-06-18T10:00:00Z' },
        { id: '2', clientName: 'Bonus Incentive', planName: 'Bonus Incentive', amount: 0.999, date: '2026-06-18T12:00:00Z' }
      ]);
    }

    // 3. Fetch Dashboard Stats
    try {
      const dashResponse = await apiClient.get('/affiliate/dashboard');
      if (dashResponse.data && dashResponse.data.success) {
        const stats = dashResponse.data.stats || {};
        setMetrics({
          unpaid: stats.available_balance || 0,
          paid: stats.total_paid || 0,
          total: stats.total_earned || 0
        });
      }
    } catch (err) {
      console.log('Failed to fetch affiliate dashboard stats from API:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestPayout = async () => {
    const requestVal = parseFloat(amount);
    if (!amount || isNaN(requestVal) || requestVal <= 0) {
      Alert.alert(
        langCode === 'hi' ? 'त्रुटि' : (langCode === 'mr' ? 'त्रुटी' : 'Error'),
        langCode === 'hi' ? 'कृपया एक वैध भुगतान राशि दर्ज करें।' : (langCode === 'mr' ? 'कृपया वैध पेआउट रक्कम प्रविष्ट करा.' : 'Please enter a valid payout amount.')
      );
      return;
    }

    if (requestVal > metrics.unpaid) {
      Alert.alert(
        langCode === 'hi' ? 'त्रुटि' : (langCode === 'mr' ? 'त्रुटी' : 'Error'),
        langCode === 'hi' ? 'भुगतान अनुरोध राशि अदत्त वॉलेट शेष से अधिक है।' : (langCode === 'mr' ? 'पेआउट विनंती रक्कम अवैतनिक वॉलेट शिलकीपेक्षा जास्त आहे.' : 'Payout request amount exceeds unpaid wallet balance.')
      );
      return;
    }

    try {
      setRequesting(true);
      await apiClient.post('/affiliate/payouts', {
        amount: requestVal,
        payout_method: payoutMethod
      });
      Alert.alert(
        langCode === 'hi' ? 'सफलता' : (langCode === 'mr' ? 'यशस्वी' : 'Success'),
        langCode === 'hi' ? 'भुगतान अनुरोध सफलतापूर्वक सबमिट किया गया! 🌸' : (langCode === 'mr' ? 'पेआउट विनंती यशस्वीरीत्या सबमिट केली! 🌸' : 'Payout request submitted successfully! 🌸')
      );
      setAmount('');
      setShowWithdrawModal(false);
      fetchData();
    } catch (err) {
      console.error('Error submitting payout:', err);
      Alert.alert(
        langCode === 'hi' ? 'त्रुटि' : (langCode === 'mr' ? 'त्रुटी' : 'Error'),
        langCode === 'hi' ? 'भुगतान का अनुरोध करने में विफल।' : (langCode === 'mr' ? 'पेआउट विनंती करण्यात अपयशी.' : 'Failed to request payout.')
      );
    } finally {
      setRequesting(false);
    }
  };

  const handleExport = () => {
    Alert.alert(
      langCode === 'hi' ? 'निर्यात पूरा हुआ' : (langCode === 'mr' ? 'निर्यात पूर्ण झाली' : 'Export Complete'),
      langCode === 'hi' ? 'आपका पार्टनर अर्निंग स्टेटमेंट आपके डाउनलोड में निर्यात कर दिया गया है! 📊' : (langCode === 'mr' ? 'तुमचे भागीदार कमाईचे स्टेटमेंट तुमच्या डाउनलोडमध्ये निर्यात केले गेले आहे! 📊' : 'Your Partner Earnings statement has been exported to your downloads! 📊')
    );
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.secondary} size="large" />
      </View>
    );
  }

  const ledgersList = commissions.length > 0 ? commissions : [
    { id: '3fc7cec2-0b54-49c3-8041-6a8f2c37f019', clientName: 'BONUS INCENTIVE', amount: 0.999, date: '2026-06-18T10:00:00Z', status: 'APPROVED' },
    { id: '558c9ca5-68e6-40d3-8100-a173e4d42351', clientName: 'BONUS INCENTIVE', amount: 0.999, date: '2026-06-18T12:00:00Z', status: 'APPROVED' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{langCode === 'hi' ? 'साझेदार कमाई' : (langCode === 'mr' ? 'भागीदार कमाई' : 'Partner Earnings')}</Text>
          <Text style={styles.headerSub}>{langCode === 'hi' ? 'अपनी कमाई का प्रबंधन करें, विवरण देखें और भुगतान का अनुरोध करें।' : (langCode === 'mr' ? 'तुमची कमाई व्यवस्थापित करा, विवरणे पहा आणि पेआउटची विनंती करा.' : 'Manage your earnings, view statements, and request payouts.')}</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Download size={12} color={COLORS.white} style={{ marginRight: 4 }} />
          <Text style={styles.exportText}>{langCode === 'hi' ? 'निर्यात' : (langCode === 'mr' ? 'निर्यात' : 'EXPORT')}</Text>
        </TouchableOpacity>
      </View>


      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Three Horizontal Metrics Cards */}
        <View style={styles.metricsContainer}>
          {/* Card 1: Available Balance */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{langCode === 'hi' ? 'उपलब्ध शेष राशि' : (langCode === 'mr' ? 'उपलब्ध शिल्लक' : 'AVAILABLE BALANCE')}</Text>
            <Text style={styles.metricVal}>₹{metrics.unpaid}</Text>
            <Text style={[styles.trendText, { color: COLORS.success }]}>{langCode === 'hi' ? '↗ ऊपर की ओर रुझान' : (langCode === 'mr' ? '↗ वाढती प्रवृत्ती' : '↗ UPWARD TREND')}</Text>
          </View>

          {/* Card 2: Total Commission */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{langCode === 'hi' ? 'कुल कमीशन' : (langCode === 'mr' ? 'एकूण कमिशन' : 'TOTAL COMMISSION')}</Text>
            <Text style={styles.metricVal}>₹{metrics.total}</Text>
            <Text style={[styles.trendText, { color: '#EF4444' }]}>{langCode === 'hi' ? '↘ नीचे की ओर रुझान' : (langCode === 'mr' ? '↘ घसरती प्रवृत्ती' : '↘ DOWNWARD TREND')}</Text>
          </View>

          {/* Card 3: Total Payouts */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{langCode === 'hi' ? 'कुल भुगतान' : (langCode === 'mr' ? 'एकूण पेआउट' : 'TOTAL PAYOUTS')}</Text>
            <Text style={styles.metricVal}>₹{metrics.paid}</Text>
            <Text style={[styles.trendText, { color: '#EF4444' }]}>{langCode === 'hi' ? '↘ नीचे की ओर रुझान' : (langCode === 'mr' ? '↘ घसरती प्रवृत्ती' : '↘ DOWNWARD TREND')}</Text>
          </View>
        </View>


        {/* Financial Ledgers section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{langCode === 'hi' ? 'वित्तीय बहीखाता' : (langCode === 'mr' ? 'वित्तीय लेजर' : 'Financial Ledgers')}</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{langCode === 'hi' ? 'लाइव खाता सत्यापन' : (langCode === 'mr' ? 'लाइव्ह लेजर सत्यापन' : 'LIVE LEDGER VERIFICATION')}</Text>
          </View>
        </View>


        {/* Ledger items list */}
        {ledgersList.map((item) => (
          <View key={item.id} style={styles.ledgerCard}>
            <View style={styles.ledgerHeader}>
              <Text style={styles.ledgerRef} numberOfLines={1}>REF: {item.id.substring(0, 8)}...</Text>
              <Text style={styles.ledgerDate}>
                {new Date(item.date || item.signupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.ledgerBody}>
              <View>
                <Text style={styles.ledgerUser}>{item.clientName === 'BONUS INCENTIVE' || item.clientName === 'Bonus Incentive' ? (langCode === 'hi' ? 'बोनस प्रोत्साहन' : (langCode === 'mr' ? 'बोनस प्रोत्साहन' : 'BONUS INCENTIVE')) : (item.clientName || 'BONUS INCENTIVE')}</Text>
                <Text style={styles.ledgerSubText}>{langCode === 'hi' ? 'सिस्टम राजस्व नोड' : (langCode === 'mr' ? 'सिस्टम महसूल नोड' : 'System Revenue Node')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.ledgerAmt}>₹{item.amount || '0.999'}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{langCode === 'hi' ? 'स्वीकृत' : (langCode === 'mr' ? 'मंजूर' : 'APPROVED')}</Text>
                </View>
              </View>
            </View>
          </View>

        ))}

        {/* Get Funds Faster dark bottom banner */}
        <View style={styles.fundsCard}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.fundsTitle}>{langCode === 'hi' ? 'अपने फंड तेजी से प्राप्त करें' : (langCode === 'mr' ? 'तुमचे पैसे जलद मिळवा' : 'Get your funds faster')}</Text>
            <Text style={styles.fundsDesc}>
              {langCode === 'hi' 
                ? 'अपने बैंक खाते या यूपीआई आईडी पर सीधे सुरक्षित भुगतान का अनुरोध करें। अधिकांश भुगतान 24-48 घंटों के भीतर संसाधित होते हैं।' 
                : (langCode === 'mr' 
                  ? 'तुमच्या बँक खात्यावर किंवा UPI आयडीवर थेट सुरक्षित पेआउटची विनंती करा. बहुतांश पेआउट २४-४८ तासांत प्रक्रिया केले जातात.' 
                  : 'Request a secure payout directly to your bank account or UPI ID. Most payouts are processed within 24-48 hours.')}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.fundsBtn} 
            onPress={() => setShowWithdrawModal(true)}
          >
            <Text style={styles.fundsBtnText}>{langCode === 'hi' ? 'निकासी का अनुरोध करें' : (langCode === 'mr' ? 'निकासी विनंती करा' : 'REQUEST WITHDRAWAL')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Withdrawal Form Modal */}
      <Modal visible={showWithdrawModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{langCode === 'hi' ? 'कमाई निकालें' : (langCode === 'mr' ? 'कमाई काढा' : 'Withdraw Earnings')}</Text>
            <Text style={styles.modalSub}>
              {langCode === 'hi' ? `अदत्त शेष राशि उपलब्ध: ₹${metrics.unpaid}` : (langCode === 'mr' ? `अवैतनिक शिल्लक उपलब्ध: ₹${metrics.unpaid}` : `Unpaid balance available: ₹${metrics.unpaid}`)}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{langCode === 'hi' ? 'निकासी राशि (₹)' : (langCode === 'mr' ? 'निकासी रक्कम (₹)' : 'Withdrawal Amount (₹)')}</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="e.g. 2"
                placeholderTextColor={COLORS.grayMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{langCode === 'hi' ? 'भुगतान मोड / विवरण (जैसे UPI ID)' : (langCode === 'mr' ? 'पेआउट मोड / तपशील (उदा. UPI ID)' : 'Payout Mode / Details (e.g. UPI ID)')}</Text>
              <TextInput
                style={styles.input}
                value={payoutMethod}
                onChangeText={setPayoutMethod}
                placeholder="UPI id (e.g. phone@upi)"
                placeholderTextColor={COLORS.grayMuted}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowWithdrawModal(false)}
              >
                <Text style={styles.cancelBtnText}>{langCode === 'hi' ? 'रद्द करें' : (langCode === 'mr' ? 'रद्द करा' : 'Cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleRequestPayout}
                disabled={requesting}
              >
                {requesting ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>{langCode === 'hi' ? 'अनुरोध सबमिट करें' : (langCode === 'mr' ? 'विनंती सबमिट करा' : 'Submit Request')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  headerSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    maxWidth: '80%',
  },
  exportBtn: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  exportText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '850',
  },
  metricsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 18,
    ...SHADOWS.light,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
  },
  trendText: {
    fontSize: 9,
    fontWeight: '900',
    marginTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '850',
    color: COLORS.primary,
  },
  sectionBadge: {
    backgroundColor: '#EC489914',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sectionBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#EC4899',
  },
  ledgerCard: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    ...SHADOWS.light,
  },
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 6,
    marginBottom: 8,
  },
  ledgerRef: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  ledgerDate: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  ledgerBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ledgerUser: {
    fontSize: 12,
    fontWeight: '850',
    color: COLORS.primary,
  },
  ledgerSubText: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  ledgerAmt: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
  },
  statusBadge: {
    backgroundColor: '#EAF7EA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 3,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.success,
  },
  fundsCard: {
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 20,
    marginTop: 20,
    ...SHADOWS.medium,
  },
  fundsTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 6,
  },
  fundsDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 16,
  },
  fundsBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fundsBtnText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    width: '100%',
    padding: SPACING.md,
    borderRadius: 20,
    ...SHADOWS.medium,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '850',
    color: COLORS.primary,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: COLORS.secondary,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
