import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Crown,
  Check,
  Shield,
  ArrowLeft,
  RefreshCw,
  CreditCard,
  Sparkles,
  X,
  Tag,
  ChevronRight,
  AlertCircle,
  FileText,
  Calendar,
  Clock,
  Zap,
  Users,
  Heart,
  Star,
  ArrowRight,
  CheckCircle,
  XCircle,
  Download,
  Gift,
  Lock
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { translate } from '../utils/i18n';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import memberApi from '../api/memberApi';

const { width } = Dimensions.get('window');

export default function SubscriptionPlansScreen({ navigation }) {
  const { langCode } = useLanguage();
  const [plans, setPlans] = useState([]);
  const [subscription, setSub] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [step, setStep] = useState('plans'); // plans | checkout | processing | success | failure

  // Checkout states
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [useRewardCoins, setUseRewardCoins] = useState(true);
  const [paymentOrder, setPaymentOrder] = useState(null);

  // Invoice modal
  const [viewInvoice, setViewInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Load subscriptions, plans, invoices, and rewards
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, subRes, rewardsRes] = await Promise.all([
        memberApi.getPlans(),
        memberApi.getSubscription(),
        memberApi.getRewards()
      ]);

      setPlans(plansRes?.plans || plansRes?.data?.plans || []);
      setSub(subRes?.subscription || subRes?.data?.subscription || null);
      setInvoices(subRes?.invoices || subRes?.data?.invoices || []);
      setRewardPoints(rewardsRes?.points ?? rewardsRes?.data?.points ?? 0);
    } catch (e) {
      console.error('Subscription load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply Coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponResult(null);
    try {
      const res = await memberApi.validateCoupon({
        code: couponCode.trim().toUpperCase(),
        planSlug: selectedPlan.slug,
        amount: selectedPlan.price
      });
      if (res?.coupon) {
        setCouponResult(res.coupon);
      } else {
        setCouponError(translate('invalidCoupon', langCode) || 'Invalid coupon code.');
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || translate('invalidCoupon', langCode) || 'Invalid coupon code.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponResult(null);
    setCouponError('');
  };

  // Open Checkout Step
  const handleProceedToCheckout = (plan) => {
    setSelectedPlan(plan);
    removeCoupon();
    setUseRewardCoins(true);
    setStep('checkout');
  };

  // Helper values for checkout calculations
  const rewardDiscountRupees = Math.floor(rewardPoints / 20);
  
  const getBaseAmount = () => {
    if (!selectedPlan) return 0;
    return couponResult ? couponResult.finalAmount : selectedPlan.price;
  };

  const getCoinsDiscount = () => {
    return useRewardCoins && rewardDiscountRupees > 0 ? rewardDiscountRupees : 0;
  };

  const getTaxableAmount = () => {
    return Math.max(0, getBaseAmount() - getCoinsDiscount());
  };

  const getGstAmount = () => {
    return getTaxableAmount() * 0.18;
  };

  const getTotalPayable = () => {
    return getTaxableAmount() * 1.18;
  };

  // Payment Confirmation Flow
  const handlePayNow = async () => {
    if (!selectedPlan) return;
    setActionLoading(true);
    try {
      // Step 1: Create order on backend
      const res = await memberApi.createOrder({
        planSlug: selectedPlan.slug,
        couponCode: couponResult ? couponCode.trim().toUpperCase() : undefined
      });

      // Free plan - immediately success
      if (res?.free) {
        setStep('success');
        Alert.alert('Success 🎉', translate('freePlanActivated', langCode) || 'Free plan activated successfully!');
        loadData();
        setActionLoading(false);
        return;
      }

      const order = res?.order;
      if (!order) {
        throw new Error('Could not create payment order');
      }

      setPaymentOrder(order);
      setStep('processing');
      setActionLoading(false);

      // Step 2: Simulate Payment processing & verify backend
      setTimeout(async () => {
        try {
          await memberApi.verifyPayment({
            orderId: order.orderId,
            paymentId: `pay_MOCK_${Date.now()}`,
            signature: 'mock_signature'
          });
          setStep('success');
          loadData();
        } catch (verifyErr) {
          console.error('Payment verification failed:', verifyErr);
          try {
            await memberApi.recordFailure({
              orderId: order.orderId,
              reason: 'Payment verification failed'
            });
          } catch (_) {}
          setStep('failure');
        }
      }, 1500);

    } catch (err) {
      console.error('Create order failed:', err);
      Alert.alert('Error', err.response?.data?.message || translate('paymentFailed', langCode) || 'Something went wrong. Please try again.');
      setStep('failure');
      setActionLoading(false);
    }
  };

  // Cancel Subscription
  const handleCancel = () => {
    Alert.alert(
      translate('cancel', langCode) || 'Cancel',
      'Are you sure you want to cancel your subscription? You will be downgraded to the Free plan.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await memberApi.cancelSubscription();
              Alert.alert('Success', 'Subscription cancelled. Free plan activated.');
              loadData();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel subscription.');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  // Renew Subscription
  const handleRenew = async () => {
    setActionLoading(true);
    try {
      await memberApi.renewSubscription();
      Alert.alert('Success 🎉', translate('paymentSuccessful', langCode) || 'Subscription renewed successfully!');
      loadData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to renew.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Invoice details
  const handleViewInvoice = async (invoiceId) => {
    setInvoiceLoading(true);
    try {
      const res = await memberApi.getInvoice(invoiceId);
      if (res?.invoice) {
        setViewInvoice(res.invoice);
      } else {
        Alert.alert('Error', 'Invoice details not found.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to retrieve invoice details.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const isCurrentPlan = (planSlug) => {
    if (!subscription) return planSlug === 'free-sakhi' || planSlug === 'free';
    return subscription.plan?.slug === planSlug;
  };

  const sortFeatures = (features) => {
    if (!features) return [];
    
    const filtered = features.filter(f => {
      const name = (typeof f === 'string' ? f : f.name || '').toLowerCase();
      return name !== 'duration' && name !== 'short description' && name !== 'highlight tag' && name !== 'price subtext';
    });

    const getFeatureDetails = (f) => {
      let featStr = typeof f === 'string'
        ? f
        : f?.name && f?.value
          ? `${f.name}: ${f.value}`
          : f?.value || f?.featureValue || f?.name || '';

      const isLocked = featStr.toLowerCase().includes('locked') || featStr.includes('Locked');
      
      let index = 99;
      const match = featStr.match(/^feature\s*(\d+)\s*:?/i);
      if (match) {
        index = parseInt(match[1], 10);
      }
      
      let displayStr = featStr.replace(/^feature\s*\d+\s*:\s*/i, '').trim();
      displayStr = displayStr.replace(/^feature\s*\d+/i, '').trim();
      if (displayStr.startsWith(':')) {
        displayStr = displayStr.slice(1).trim();
      }
      
      return { item: f, featStr, displayStr, isLocked, index };
    };

    const mapped = filtered.map(getFeatureDetails);
    const available = mapped.filter(item => !item.isLocked);
    const locked = mapped.filter(item => item.isLocked);
    
    available.sort((a, b) => a.index - b.index);
    locked.sort((a, b) => a.index - b.index);
    
    return [...available, ...locked];
  };

  // Plan icon mapping
  const getPlanIcon = (slug) => {
    if (slug?.includes('free')) return <Heart size={22} color="#10B981" />;
    if (slug?.includes('premium')) return <Crown size={22} color="#F59E0B" />;
    if (slug?.includes('basic')) return <Zap size={22} color={COLORS.secondary} />;
    return <Users size={22} color="#8B5CF6" />;
  };

  // Feature Comparison config
  const comparisonFeatures = [
    { name: '🏠 Home Dashboard', free: 'Available', basic: 'Available', premium: 'Available', isAvailable: [true, true, true] },
    { name: '📚 Books Access', free: '5 only', basic: 'All ∞', premium: 'All ∞', isAvailable: ['limited', true, true] },
    { name: '👭 Community Sakhis', free: 'Available', basic: 'Available', premium: 'Available', isAvailable: [true, true, true] },
    { name: '🤖 AI Chat Bot', free: 'Locked', basic: 'Unlocked', premium: 'Unlocked', isAvailable: [false, true, true] },
    { name: '🏆 Wellness Certificate', free: 'Locked', basic: 'Unlocked', premium: 'Unlocked', isAvailable: [false, true, true] },
    { name: '💰 Partner Sakhi', free: 'Locked', basic: 'Locked', premium: 'Unlocked', isAvailable: [false, false, true] },
    { name: '❓ FAQ & Help', free: 'Available', basic: 'Available', premium: 'Available', isAvailable: [true, true, true] },
    { name: '💬 Ask Health Sakhi', free: 'Locked', basic: 'Locked', premium: 'Unlocked', isAvailable: [false, false, true] },
    { name: '🪙 Rewards & Balance', free: 'Available', basic: 'Available', premium: 'Available', isAvailable: [true, true, true] },
    { name: '✅ To-Do List', free: 'Available', basic: 'Available', premium: 'Available', isAvailable: [true, true, true] },
    { name: '💸 Home Budget Sakhi', free: 'Available', basic: 'Available', premium: 'Available', isAvailable: [true, true, true] },
    { name: '🧠 Mental Health', free: 'Available', basic: 'Available', premium: 'Available', isAvailable: [true, true, true] },
    { name: '🌸 Period Tracker', free: 'Available', basic: 'Available', premium: 'Available', isAvailable: [true, true, true] }
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: PROCESSING STATE
  // ═══════════════════════════════════════════════════════════════════════
  if (step === 'processing') {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <View style={styles.statusBox}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
          <Text style={styles.statusTitle}>Verifying Payment</Text>
          <Text style={styles.statusSub}>Confirming your payment and activating your subscription...</Text>
          {paymentOrder && (
            <View style={styles.processingOrderCard}>
              <Text style={styles.orderLabel}>Order ID: <Text style={styles.orderValue}>{paymentOrder.orderId}</Text></Text>
              <Text style={styles.orderLabel}>Amount: <Text style={styles.orderValue}>₹{paymentOrder.finalAmount}</Text></Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: SUCCESS STATE
  // ═══════════════════════════════════════════════════════════════════════
  if (step === 'success') {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <View style={styles.statusBox}>
          <View style={[styles.statusIconBg, { backgroundColor: '#ECFDF5' }]}>
            <CheckCircle size={48} color="#10B981" />
          </View>
          <Text style={[styles.statusTitle, { color: '#10B981' }]}>Payment Successful!</Text>
          <Text style={styles.statusSub}>Your subscription has been activated. Enjoy all premium features!</Text>
          
          <TouchableOpacity
            style={styles.actionButtonFull}
            onPress={() => {
              setStep('plans');
              loadData();
            }}
          >
            <Text style={styles.actionButtonText}>View My Subscription</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: FAILURE STATE
  // ═══════════════════════════════════════════════════════════════════════
  if (step === 'failure') {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <View style={styles.statusBox}>
          <View style={[styles.statusIconBg, { backgroundColor: '#FEF2F2' }]}>
            <XCircle size={48} color="#EF4444" />
          </View>
          <Text style={[styles.statusTitle, { color: '#EF4444' }]}>{translate('paymentFailed', langCode) || 'Payment Failed'}</Text>
          <Text style={styles.statusSub}>Your payment could not be processed. No amount has been deducted.</Text>
          
          <TouchableOpacity
            style={[styles.actionButtonFull, { backgroundColor: COLORS.secondary }]}
            onPress={() => setStep('checkout')}
          >
            <Text style={styles.actionButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButtonFull, { backgroundColor: '#F3F4F6', marginTop: 10 }]}
            onPress={() => setStep('plans')}
          >
            <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>Back to Plans</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: CHECKOUT STATE
  // ═══════════════════════════════════════════════════════════════════════
  if (step === 'checkout' && selectedPlan) {
    const finalPayable = getTotalPayable();
    const isMockMode = true; // Always mock payments in mobile app due to no razorpay library
    
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Checkout Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('plans')} style={styles.backBtn}>
            <ArrowLeft size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translate('paymentSummary', langCode) || 'Payment Summary'}</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Selected Plan Summary */}
          <View style={styles.card}>
            <View style={styles.checkoutPlanRow}>
              <View style={styles.checkoutPlanLeft}>
                <View style={styles.planIconBg}>
                  {getPlanIcon(selectedPlan.slug)}
                </View>
                <View>
                  <Text style={styles.checkoutPlanName}>{selectedPlan.name}</Text>
                  <Text style={styles.checkoutPlanInterval}>
                    {selectedPlan.interval === 'YEARLY' ? translate('yearlyPlan', langCode) : translate('monthlyPlan', langCode)}
                  </Text>
                </View>
              </View>
              <Text style={styles.checkoutPlanPrice}>₹{selectedPlan.price}</Text>
            </View>
          </View>

          {/* Test notice */}
          {isMockMode && (
            <View style={styles.testNoticeBox}>
              <View style={styles.testNoticeHeader}>
                <AlertCircle size={16} color="#B45309" />
                <Text style={styles.testNoticeTitle}>{translate('testModeActive', langCode)}</Text>
              </View>
              <Text style={styles.testNoticeDesc}>{translate('noRealMoneyCharged', langCode)}</Text>
              
              {/* Test coupons chips */}
              <View style={styles.couponChipsRow}>
                {['WELCOME50', 'FLAT100', 'PREMIUM20'].map((code) => (
                  <TouchableOpacity
                    key={code}
                    style={styles.couponChip}
                    onPress={() => setCouponCode(code)}
                  >
                    <Text style={styles.couponChipText}>{code}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Coupon Input */}
          <View style={styles.card}>
            <View style={styles.couponHeader}>
              <Tag size={16} color={COLORS.secondary} />
              <Text style={styles.couponTitle}>{translate('applyCoupon', langCode) || 'Apply Coupon'}</Text>
            </View>

            {couponResult ? (
              <View style={styles.couponAppliedContainer}>
                <View style={styles.couponAppliedInfo}>
                  <CheckCircle size={16} color="#10B981" />
                  <View>
                    <Text style={styles.couponAppliedCode}>{couponResult.code} Applied</Text>
                    <Text style={styles.couponAppliedSavings}>
                      Saved ₹{couponResult.discountAmount} ({couponResult.discountType === 'PERCENTAGE' ? `${couponResult.discountValue}% off` : `₹${couponResult.discountValue} off`})
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={removeCoupon} style={styles.removeCouponBtn}>
                  <X size={16} color="#888888" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.couponInputRow}>
                <TextInput
                  value={couponCode}
                  onChangeText={(val) => setCouponCode(val.toUpperCase())}
                  placeholder="WELCOME50"
                  autoCapitalize="characters"
                  style={styles.couponInput}
                />
                <TouchableOpacity
                  onPress={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  style={[styles.couponApplyBtn, !couponCode.trim() && { opacity: 0.5 }]}
                >
                  {couponLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.couponApplyBtnText}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            {couponError ? <Text style={styles.couponErrorText}>{couponError}</Text> : null}
          </View>

          {/* Reward coins section */}
          {rewardPoints > 0 && (
            <View style={[styles.card, styles.rewardsCard]}>
              <View style={styles.rewardsHeader}>
                <Gift size={20} color="#CA8A04" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rewardsTitle}>Redeem Coins ({rewardPoints} Coins)</Text>
                  <Text style={styles.rewardsSubtitle}>Save ₹{rewardDiscountRupees} on your plan (20 Coins = ₹1 OFF)</Text>
                </View>
                <TouchableOpacity
                  style={[styles.coinsCheckbox, useRewardCoins && styles.coinsCheckboxChecked]}
                  onPress={() => setUseRewardCoins(!useRewardCoins)}
                >
                  {useRewardCoins && <Check size={12} color={COLORS.white} />}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Order Summary */}
          <View style={styles.card}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{selectedPlan.name}</Text>
              <Text style={styles.summaryValue}>₹{selectedPlan.price}</Text>
            </View>

            {couponResult ? (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#10B981' }]}>Coupon Discount</Text>
                <Text style={[styles.summaryValue, { color: '#10B981' }]}>- ₹{couponResult.discountAmount}</Text>
              </View>
            ) : null}

            {useRewardCoins && rewardDiscountRupees > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#CA8A04' }]}>Coins Discount</Text>
                <Text style={[styles.summaryValue, { color: '#CA8A04' }]}>- ₹{rewardDiscountRupees}</Text>
              </View>
            ) : null}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST (18%)</Text>
              <Text style={styles.summaryValue}>₹{getGstAmount().toFixed(2)}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total Payable</Text>
              <Text style={styles.summaryTotalValue}>₹{finalPayable.toFixed(2)}</Text>
            </View>
          </View>

          {/* Checkout action button */}
          <TouchableOpacity
            style={styles.payBtn}
            disabled={actionLoading}
            onPress={handlePayNow}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <CreditCard size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                <Text style={styles.payBtnText}>
                  Confirm & Pay ₹{finalPayable.toFixed(2)}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: PLANS LIST SCREEN
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Crown size={20} color={COLORS.gold || '#C69214'} />
          <Text style={styles.headerTitle}>
            {translate('subscriptionBilling', langCode) || 'Subscription & Billing'}
          </Text>
        </View>
        <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
          <RefreshCw size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* Subtitle */}
          <Text style={styles.screenSubtitle}>
            {translate('choosePlanSubtitle', langCode) || 'Choose your plan, manage billing, and view invoices.'}
          </Text>

          {/* ── SECTION 1: ACTIVE SUBSCRIPTION ── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              {translate('activeSubscription', langCode) || 'Active Subscription'}
            </Text>
          </View>

          {subscription ? (
            <View style={styles.activeSubscriptionCard}>
              <View style={styles.activeSubTopRow}>
                <View style={styles.activeSubIconBox}>
                  <Crown size={24} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.activeSubPlanName}>{subscription.plan?.name}</Text>
                  <View style={styles.activeSubBadge}>
                    <Text style={styles.activeSubBadgeText}>
                      {subscription.status || 'ACTIVE'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.activeSubGrid}>
                <View style={styles.activeSubGridItem}>
                  <Text style={styles.gridItemLabel}>{translate('planLabel', langCode) || 'Plan'}</Text>
                  <Text style={styles.gridItemValue}>{subscription.plan?.name}</Text>
                </View>
                <View style={styles.activeSubGridItem}>
                  <Text style={styles.gridItemLabel}>{translate('priceLabel', langCode) || 'Price'}</Text>
                  <Text style={styles.gridItemValue}>
                    ₹{subscription.plan?.price}/{subscription.plan?.interval === 'YEARLY' ? 'yr' : 'mo'}
                  </Text>
                </View>
                <View style={styles.activeSubGridItem}>
                  <Text style={styles.gridItemLabel}>{translate('startedLabel', langCode) || 'Started'}</Text>
                  <Text style={styles.gridItemValue}>
                    {new Date(subscription.startsAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.activeSubGridItem}>
                  <Text style={styles.gridItemLabel}>{translate('expiresLabel', langCode) || 'Expires'}</Text>
                  <Text style={styles.gridItemValue}>
                    {new Date(subscription.endsAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {subscription.plan?.slug !== 'free-sakhi' && subscription.plan?.slug !== 'free' && (
                <View style={styles.activeSubActions}>
                  <TouchableOpacity
                    style={styles.renewBtn}
                    disabled={actionLoading}
                    onPress={handleRenew}
                  >
                    <RefreshCw size={14} color={COLORS.white} style={{ marginRight: 6 }} />
                    <Text style={styles.renewBtnText}>
                      {translate('renewBtn', langCode) || 'Renew Subscription'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelBtn}
                    disabled={actionLoading}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelBtnText}>
                      {translate('cancelBtn', langCode) || 'Cancel'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No active subscription found.</Text>
            </View>
          )}

          {/* ── SECTION 2: PLANS CARDS ── */}
          <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>
              {translate('upgradeChangePlan', langCode) || 'Upgrade / Change Plan'}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {plans.length} {translate('plansAvailable', langCode) || 'Plans Available'}
              </Text>
            </View>
          </View>

          {plans.map((plan) => {
            const active = isCurrentPlan(plan.slug);
            const isPremium = plan.slug?.includes('premium') || plan.slug?.includes('elite');

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  active && styles.planCardActive,
                  isPremium && styles.planCardPremium
                ]}
              >
                {isPremium && (
                  <View style={styles.popularTag}>
                    <Text style={styles.popularTagText}>
                      {translate('mostPopular', langCode) || 'Most Popular 🔥'}
                    </Text>
                  </View>
                )}

                <View style={styles.planCardHeader}>
                  <View style={styles.planTitleContainer}>
                    <View style={[styles.planIconWrapper, isPremium ? { backgroundColor: '#FEF3C7' } : { backgroundColor: '#D1FAE5' }]}>
                      {getPlanIcon(plan.slug)}
                    </View>
                    <View>
                      <Text style={styles.planCardName}>{plan.name}</Text>
                      <Text style={styles.planCardInterval}>
                        {plan.interval === 'YEARLY' ? translate('yearlyPlan', langCode) : translate('monthlyPlan', langCode)}
                      </Text>
                    </View>
                  </View>
                  <View>
                    <Text style={styles.planCardPrice}>
                      {plan.price === 0 || plan.price === '0' ? translate('freePrice', langCode) : `₹${plan.price}`}
                    </Text>
                    {plan.price > 0 && (
                      <Text style={styles.planCardPriceSub}>
                        /{plan.interval === 'YEARLY' ? 'year' : 'month'}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.planDivider} />

                {/* Features List */}
                <View style={styles.planFeatures}>
                  {sortFeatures(plan.features)
                    .map((featObj, idx) => {
                      const { displayStr, isLocked } = featObj;
                      return (
                        <View key={idx} style={styles.featureRow}>
                          {isLocked ? (
                            <Lock size={12} color="#EF4444" style={{ marginRight: 6 }} />
                          ) : (
                            <Check size={12} color="#10B981" style={{ marginRight: 6 }} />
                          )}
                          <Text style={[styles.featureText, isLocked && { color: '#9CA3AF', textDecorationLine: 'line-through' }]}>
                            {displayStr}
                          </Text>
                        </View>
                      );
                    })}
                </View>

                {/* CTA Button */}
                <TouchableOpacity
                  style={[
                    styles.planCtaBtn,
                    active && styles.planCtaBtnActive,
                    isPremium && !active && styles.planCtaBtnPremium
                  ]}
                  disabled={active}
                  onPress={() => handleProceedToCheckout(plan)}
                >
                  <Text style={[
                    styles.planCtaBtnText,
                    active && styles.planCtaBtnTextActive,
                    isPremium && !active && { color: COLORS.white }
                  ]}>
                    {active
                      ? `✓ ${translate('currentPlan', langCode) || 'Current Plan'}`
                      : plan.price === 0
                        ? translate('activateFree', langCode) || 'Activate Free Plan'
                        : translate('subscribeNow', langCode) || 'Subscribe Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* ── SECTION 3: BILLING HISTORY ── */}
          <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>
              {translate('billingHistory', langCode) || 'Billing History'}
            </Text>
          </View>

          {invoices.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No billing records found.</Text>
            </View>
          ) : (
            invoices.map((inv) => (
              <View key={inv.id} style={styles.invoiceCard}>
                <View style={styles.invoiceTopRow}>
                  <View style={styles.invoiceLeft}>
                    <Text style={styles.invoiceNumber}>{inv.invoiceNumber}</Text>
                    <Text style={styles.invoiceDate}>
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusIndicator,
                    inv.status === 'PAID' ? { backgroundColor: '#E6F4EA' } : { backgroundColor: '#FEF3C7' }
                  ]}>
                    <Text style={[
                      styles.statusIndicatorText,
                      inv.status === 'PAID' ? { color: '#137333' } : { color: '#B45309' }
                    ]}>
                      {inv.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.invoiceBottomRow}>
                  <View>
                    <Text style={styles.invoicePriceLabel}>{translate('amountLabel', langCode) || 'Amount'}</Text>
                    <Text style={styles.invoicePrice}>₹{inv.amount}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.invoiceViewBtn}
                    disabled={invoiceLoading}
                    onPress={() => handleViewInvoice(inv.id)}
                  >
                    <Text style={styles.invoiceViewBtnText}>
                      {translate('viewBtn', langCode) || 'View'}
                    </Text>
                    <ChevronRight size={12} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {/* ── SECTION 4: FEATURE COMPARISON ── */}
          <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>
              {translate('featureComparison', langCode) || 'Feature Comparison'}
            </Text>
          </View>

          <View style={styles.card}>
            {comparisonFeatures.map((feat, i) => (
              <View key={i} style={[styles.comparisonCard, i === comparisonFeatures.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.comparisonFeatureName}>{feat.name}</Text>
                
                <View style={styles.comparisonTiersRow}>
                  <View style={styles.comparisonTierCol}>
                    <Text style={styles.comparisonTierLabel}>Free Sakhi</Text>
                    {feat.isAvailable[0] === true ? (
                      <Check size={14} color="#10B981" />
                    ) : feat.isAvailable[0] === false ? (
                      <Lock size={12} color="#EF4444" />
                    ) : (
                      <Text style={styles.comparisonTierText}>{feat.free}</Text>
                    )}
                  </View>

                  <View style={styles.comparisonTierCol}>
                    <Text style={[styles.comparisonTierLabel, { color: COLORS.secondary }]}>Basic Sakhi</Text>
                    {feat.isAvailable[1] === true ? (
                      <Check size={14} color="#10B981" />
                    ) : feat.isAvailable[1] === false ? (
                      <Lock size={12} color="#EF4444" />
                    ) : (
                      <Text style={[styles.comparisonTierText, { color: COLORS.secondary }]}>{feat.basic}</Text>
                    )}
                  </View>

                  <View style={styles.comparisonTierCol}>
                    <Text style={[styles.comparisonTierLabel, { color: '#CA8A04' }]}>Premium Sakhi</Text>
                    {feat.isAvailable[2] === true ? (
                      <Check size={14} color="#10B981" />
                    ) : feat.isAvailable[2] === false ? (
                      <Lock size={12} color="#EF4444" />
                    ) : (
                      <Text style={[styles.comparisonTierText, { color: '#CA8A04' }]}>{feat.premium}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Security Notice Footer */}
          <View style={styles.securityFooter}>
            <Shield size={16} color={COLORS.secondary} style={{ marginRight: 6 }} />
            <Text style={styles.securityText}>
              256-bit SSL Encrypted Payments · Powered by Razorpay test environment
            </Text>
          </View>

        </ScrollView>
      )}

      {/* Invoice Details Modal */}
      <Modal
        visible={!!viewInvoice}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewInvoice(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalLabel}>{translate('invoiceLabel', langCode) || 'Invoice'}</Text>
                <Text style={styles.modalHeading}>{viewInvoice?.invoiceNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setViewInvoice(null)} style={styles.modalCloseBtn}>
                <X size={18} color="#888" />
              </TouchableOpacity>
            </View>

            {viewInvoice && (
              <ScrollView style={styles.modalDetailsContainer}>
                {[
                  { label: 'Customer', value: viewInvoice.user?.name || 'N/A' },
                  { label: 'Email', value: viewInvoice.user?.email || 'N/A' },
                  { label: 'Plan', value: viewInvoice.plan?.name || 'N/A' },
                  { label: 'Amount', value: `₹${viewInvoice.amount}` },
                  { label: 'Discount', value: viewInvoice.discountAmount > 0 ? `-₹${viewInvoice.discountAmount}` : 'None' },
                  { label: 'Tax (GST 18%)', value: `₹${viewInvoice.tax}` },
                  { label: 'Total Payable', value: `₹${(viewInvoice.totalPayable ?? (Number(viewInvoice.amount) - Number(viewInvoice.discountAmount || 0) + Number(viewInvoice.tax))).toFixed(2)}` },
                  { label: 'Status', value: viewInvoice.status },
                  { label: 'Paid On', value: viewInvoice.paidAt ? new Date(viewInvoice.paidAt).toLocaleDateString() : 'N/A' }
                ].map((row, index) => (
                  <View key={index} style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>{row.label}</Text>
                    <Text style={styles.modalDetailValue}>{row.value}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => setViewInvoice(null)}
            >
              <Text style={styles.modalActionBtnText}>Close Invoice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  backBtn: {
    padding: 4
  },
  refreshBtn: {
    padding: 4
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary
  },
  screenSubtitle: {
    fontSize: 13,
    color: COLORS.grayMuted,
    marginHorizontal: SPACING.md,
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 18
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl
  },
  scroll: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 40
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary
  },
  countBadge: {
    backgroundColor: COLORS.softPink,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.grayMuted,
    fontSize: 13,
    paddingVertical: 12
  },

  // Active subscription card
  activeSubscriptionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium
  },
  activeSubTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16
  },
  activeSubIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeSubPlanName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary
  },
  activeSubBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4
  },
  activeSubBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#137333',
    letterSpacing: 0.5
  },
  activeSubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    gap: 10
  },
  activeSubGridItem: {
    width: (width - 70) / 2,
    padding: 6
  },
  gridItemLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2
  },
  gridItemValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary
  },
  activeSubActions: {
    flexDirection: 'row',
    gap: 10
  },
  renewBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 12,
    ...SHADOWS.light
  },
  renewBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2'
  },
  cancelBtnText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 12
  },

  // Plan Cards
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    ...SHADOWS.light
  },
  planCardActive: {
    borderColor: COLORS.secondary,
    borderWidth: 2
  },
  planCardPremium: {
    backgroundColor: '#FFFDF9',
    borderColor: '#FEF3C7'
  },
  popularTag: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    ...SHADOWS.light
  },
  popularTagText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900'
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6
  },
  planTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  planIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  planCardName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary
  },
  planCardInterval: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
    marginTop: 2
  },
  planCardPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'right'
  },
  planCardPriceSub: {
    fontSize: 10,
    color: COLORS.grayMuted,
    textAlign: 'right',
    fontWeight: '600'
  },
  planDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14
  },
  planFeatures: {
    gap: 8,
    marginBottom: 16
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  featureText: {
    fontSize: 12.5,
    color: COLORS.primary,
    fontWeight: '600'
  },
  planCtaBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light
  },
  planCtaBtnActive: {
    backgroundColor: COLORS.softPink,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    shadowOpacity: 0,
    elevation: 0
  },
  planCtaBtnPremium: {
    backgroundColor: '#F59E0B'
  },
  planCtaBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5
  },
  planCtaBtnTextActive: {
    color: COLORS.secondary
  },

  // Feature Comparison Card List
  comparisonCard: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 14
  },
  comparisonFeatureName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 10
  },
  comparisonTiersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  comparisonTierCol: {
    width: (width - 80) / 3,
    alignItems: 'center',
    gap: 4
  },
  comparisonTierLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.grayMuted,
    textTransform: 'uppercase'
  },
  comparisonTierText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary
  },

  // Billing History
  invoiceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light
  },
  invoiceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  invoiceLeft: {
    gap: 2
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary
  },
  invoiceDate: {
    fontSize: 11,
    color: COLORS.grayMuted,
    fontWeight: '600'
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  statusIndicatorText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  invoiceBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  invoicePriceLabel: {
    fontSize: 9,
    color: COLORS.grayMuted,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  invoicePrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.secondary
  },
  invoiceViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  invoiceViewBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900'
  },

  // Security notice
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 12,
    opacity: 0.8
  },
  securityText: {
    fontSize: 10.5,
    color: COLORS.grayMuted,
    textAlign: 'center',
    fontWeight: '600'
  },

  // Status screens (success, failure, processing)
  statusBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium
  },
  statusIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center'
  },
  statusSub: {
    fontSize: 13,
    color: COLORS.grayMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24
  },
  actionButtonFull: {
    width: '100%',
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: '850',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  processingOrderCard: {
    width: '100%',
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    padding: 14,
    gap: 4
  },
  orderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary
  },
  orderValue: {
    fontWeight: '900',
    color: COLORS.secondary
  },

  // Checkout style
  checkoutPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  checkoutPlanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  planIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.softPink,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkoutPlanName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary
  },
  checkoutPlanInterval: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 2
  },
  checkoutPlanPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary
  },
  testNoticeBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 14,
    marginBottom: 16
  },
  testNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  testNoticeTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#B45309'
  },
  testNoticeDesc: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
    lineHeight: 15,
    marginBottom: 10
  },
  couponChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  couponChip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  couponChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706'
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  couponTitle: {
    fontSize: 11,
    fontWeight: '905',
    textTransform: 'uppercase',
    color: COLORS.grayMuted,
    letterSpacing: 0.5
  },
  couponAppliedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    borderRadius: 12
  },
  couponAppliedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  couponAppliedCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46'
  },
  couponAppliedSavings: {
    fontSize: 10,
    color: '#047857',
    fontWeight: '600'
  },
  removeCouponBtn: {
    padding: 4
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8
  },
  couponInput: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary
  },
  couponApplyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12
  },
  couponApplyBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900'
  },
  couponErrorText: {
    color: '#EF4444',
    fontSize: 10.5,
    fontWeight: '800',
    marginTop: 6
  },
  rewardsCard: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A'
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  rewardsTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#854D0E'
  },
  rewardsSubtitle: {
    fontSize: 10.5,
    color: '#A16207',
    fontWeight: '600',
    marginTop: 2
  },
  coinsCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#CA8A04',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white
  },
  coinsCheckboxChecked: {
    backgroundColor: '#CA8A04'
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '905',
    textTransform: 'uppercase',
    color: COLORS.grayMuted,
    letterSpacing: 0.5,
    marginBottom: 12
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563'
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '950',
    color: COLORS.secondary
  },
  payBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...SHADOWS.medium
  },
  payBtnText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 13
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
    marginBottom: 12
  },
  modalLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  modalHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary
  },
  modalCloseBtn: {
    padding: 4
  },
  modalDetailsContainer: {
    marginBottom: 16
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5'
  },
  modalDetailLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.grayMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  modalDetailValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary
  },
  modalActionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalActionBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  }
});
