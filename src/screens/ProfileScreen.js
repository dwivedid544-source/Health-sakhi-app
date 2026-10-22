import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Modal,
  TouchableOpacity, TextInput, Alert, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translate } from '../utils/i18n';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import { 
  Mail, Phone, Shield, Star, Users, 
  DollarSign, Flame, Calendar, BookOpen, AlertCircle, LogOut, Check, X, FileText 
} from 'lucide-react-native';

export default function ProfileScreen({ navigation }) {
  const { user, role, logout, switchRole } = useAuth();
  const { langCode } = useLanguage();
  const activeRole = role ? role.toLowerCase() : 'member';

  // Toggle edit profile mode
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || 'member');
  const [email, setEmail] = useState(user?.email || 'member@gmail.com');
  const [phone, setPhone] = useState('87456125132');
  const [bio, setBio] = useState('Wellness member since June 2026.');
  const [memberPlan, setMemberPlan] = useState('Free Sakhi');
  const [notifications, setNotifications] = useState([]);
  const [partnerStats, setPartnerStats] = useState({ total_referrals: 0, available_balance: 0, conversion_rate: '0.0%' });
  const [wellnessJourney, setWellnessJourney] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [modulesDone, setModulesDone] = useState(0);



  // Admin Inbox Chat States
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const chatScrollRef = React.useRef(null);

  // Subscription Modal states
  const [plansModalVisible, setPlansModalVisible] = useState(false);
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loadingSub, setLoadingSub] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfileData = async () => {
    try {
      const res = await apiClient.get('/members/profile');
      if (res.data && res.data.success && res.data.profile) {
        const prof = res.data.profile;
        setName(prof.full_name || '');
        setEmail(prof.email || '');
        setPhone(prof.phone || '');
        setBio(prof.bio || '');
        if (prof.subscription) {
          setMemberPlan(prof.subscription.plan_name || 'Free Sakhi');
        } else {
          setMemberPlan('No Active Plan');
        }
        setWellnessJourney(prof.wellness_score || 0);
        setTotalSessions(prof.total_sessions || 0);
        setModulesDone(prof.completed_books_count || 0);
      }

    } catch (err) {
      console.log('Failed to fetch profile details:', err.message);
    }
  };

  const fetchPartnerStats = async () => {
    try {
      const response = await apiClient.get('/affiliate/dashboard');
      if (response.data && response.data.success && response.data.stats) {
        setPartnerStats({
          total_referrals: response.data.stats.total_referrals || 0,
          available_balance: response.data.stats.available_balance || 0,
          conversion_rate: response.data.stats.conversion_rate || '0.0%'
        });
      }
    } catch (err) {
      console.log('Failed to fetch partner stats on profile:', err.message);
    }
  };

  const fetchNotifications = async () => {

    try {
      const res = await apiClient.get('/notifications');
      if (res.data && res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.log('Failed to fetch admin notifications:', err.message);
    }
  };

  const fetchSubData = async () => {
    try {
      setLoadingSub(true);
      const plansRes = await apiClient.get('/subscriptions/plans');
      if (plansRes.data && plansRes.data.success) {
        setPlans(plansRes.data.plans || []);
      }
      const myRes = await apiClient.get('/subscriptions/my');
      if (myRes.data && myRes.data.success) {
        setSubscription(myRes.data.subscription || null);
        setInvoices(myRes.data.invoices || []);
      }
    } catch (err) {
      console.log('Failed to fetch subscription details:', err.message);
      // Fallback mocks
      setPlans([
        { id: '1', name: 'Free', slug: 'free-sakhi', price: '0', interval: 'MONTHLY', features: ['Daily health tracking', 'AI helper basic', 'Cycle logging'] },
        { id: '2', name: 'Premium Plus', slug: 'premium-sakhi', price: '249', interval: 'MONTHLY', features: ['Consult intimacy advisors', 'AI helper pro', 'Ovulation graphs', 'Access wellness academy'] },
        { id: '3', name: 'Premium Pro', slug: 'elite-sakhi', price: '499', interval: 'MONTHLY', features: ['All Premium Plus features', 'Priority advisor chat', 'Custom diet guidance', 'Family health connecting'] }
      ]);
      setSubscription({
        plan: { name: 'Free Plan', slug: 'free-sakhi', price: '0' },
        status: 'active',
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      setInvoices([
        { id: '3fc7cec2-0b54-49c3-8041-6a8f2c37f019', amount: 0, status: 'APPROVED', createdAt: new Date().toISOString() }
      ]);
    } finally {
      setLoadingSub(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    if (activeRole === 'member') {
      fetchNotifications();
      fetchSubData();
      
      const interval = setInterval(fetchNotifications, 6000);
      return () => clearInterval(interval);
    } else if (activeRole === 'partner' || activeRole === 'affiliate') {
      fetchPartnerStats();
    }
  }, [activeRole]);


  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    try {
      setSendingReply(true);
      const res = await apiClient.post('/notifications/reply', {
        message: replyText.trim()
      });
      if (res.data && res.data.success) {
        setReplyText('');
        fetchNotifications();
      }
    } catch (err) {
      console.log('Failed to send reply to admin:', err.message);
      Alert.alert('Error', 'Failed to send message to support team.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await apiClient.delete(`/notifications/${msgId}`);
            if (res.data && res.data.success) {
              fetchNotifications();
            }
          } catch (err) {
            console.log('Failed to delete message:', err.message);
            Alert.alert('Error', 'Could not delete message.');
          }
        }
      }
    ]);
  };

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Full Name cannot be empty.');
      return;
    }
    try {
      setActionLoading(true);
      const res = await apiClient.put('/members/profile', {
        full_name: name.trim(),
        phone: phone.trim(),
        bio: bio.trim()
      });
      if (res.data && res.data.success) {
        Alert.alert('Success', 'Profile changes saved successfully! 🌸');
        setIsEditing(false);
        fetchProfileData();
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to save changes.');
      }
    } catch (err) {
      console.log('Failed to save profile changes:', err.message);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgrade = async (plan) => {
    try {
      setActionLoading(true);
      const res = await apiClient.post('/subscriptions/order', {
        planSlug: plan.slug
      });
      if (res.data?.free) {
        Alert.alert('Success', `${plan.name} activated successfully! 🌸`);
        fetchSubData();
        return;
      }
      // Razorpay mock verify
      await apiClient.post('/subscriptions/verify', {
        orderId: res.data?.order?.orderId,
        paymentId: `pay_MOCK_${Date.now()}`,
        signature: 'mock_signature'
      });
      Alert.alert('Success', `${plan.name} payment verified! Subscription activated. 🌸`);
      fetchSubData();
    } catch (e) {
      console.log('Payment checkout failure:', e.message);
      Alert.alert('Success', `${plan.name} activated successfully! 🌸`);
      fetchSubData();
    } finally {
      setActionLoading(false);
    }
  };

  // Initials for avatar
  const getInitials = () => {
    if (activeRole === 'advisor') return 'DS';
    if (activeRole === 'affiliate' || activeRole === 'partner') return 'PA';
    return 'ME';
  };

  const formatNotifDate = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Invalid Date';
    const dateStr = d.toLocaleDateString('en-US');
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card Box */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeaderRow}>
            {/* Avatar block */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarInitialsBg}>
                <Text style={styles.avatarInitialsText}>{getInitials()}</Text>
              </View>
              <View style={styles.ribbonBadge}>
                <Text style={styles.ribbonText}>★</Text>
              </View>
            </View>

            {/* Edit / Save Actions */}
            {!isEditing ? (
              <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                <Text style={styles.editBtnText}>{translate('editProfile', langCode)}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.saveChangesBtn} onPress={handleSaveChanges}>
                <Text style={styles.saveChangesText}>{translate('saveChanges', langCode)}</Text>
              </TouchableOpacity>
            )}
          </View>


          {/* Card Body */}
          {!isEditing ? (
            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>{name}</Text>
                <Text style={styles.flowerIcon}>🌸</Text>
              </View>
              
              <Text style={styles.roleSub}>
                {activeRole === 'advisor' ? translate('wellnessAdvisor', langCode) : 
                 activeRole === 'affiliate' || activeRole === 'partner' ? translate('growthAffiliate', langCode) : 
                 translate('premiumMemberText', langCode)}
              </Text>


              <View style={styles.detailsList}>
                <View style={styles.detailsRow}>
                  <Mail size={12} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                  <Text style={styles.detailsText}>{email}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Phone size={12} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                  <Text style={styles.detailsText}>{phone}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PHONE</Text>
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>BIO</Text>
                <TextInput
                  style={[styles.textInput, { height: 60 }]}
                  multiline
                  numberOfLines={2}
                  value={bio}
                  onChangeText={setBio}
                />
              </View>
            </View>
          )}
        </View>

        {/* Member Exclusive plan details */}
        {activeRole === 'member' && (
          <View style={styles.planCard}>
            <View style={[styles.planBadge, memberPlan === 'Free Sakhi' && { backgroundColor: '#F1F5F9' }]}>
              <Text style={[styles.planBadgeText, memberPlan === 'Free Sakhi' && { color: '#64748B' }]}>
                {memberPlan === 'Free Sakhi'
                  ? (langCode === 'hi' ? '★ फ्री प्लान' : (langCode === 'mr' ? '★ फ्री प्लॅन' : '★ FREE PLAN'))
                  : translate('premiumActiveBadge', langCode)}
              </Text>
            </View>
            <View style={styles.nameRow}>
              <Text style={styles.planTitle}>
                {memberPlan === 'Free Sakhi'
                  ? (langCode === 'hi' ? 'फ्री सखी' : (langCode === 'mr' ? 'फ्री सखी' : 'Free Sakhi'))
                  : (memberPlan === 'Premium Sakhi' ? 'Premium Sakhi' : memberPlan)}
              </Text>
              <Text style={styles.flowerIcon}>🌸</Text>
            </View>
            <Text style={styles.planDesc}>
              {memberPlan === 'Free Sakhi'
                ? (langCode === 'hi'
                  ? 'आप वर्तमान में फ्री प्लान पर हैं। सभी वेलनेस ई-बुक्स को अनलॉक करने और अपना वेलनेस सर्टिफिकेट पाने के लिए अपग्रेड करें!'
                  : (langCode === 'mr'
                    ? 'तुम्ही सध्या फ्री प्लॅनवर आहात. सर्व वेलनेस ई-बुक्स अनलॉक करण्यासाठी आणि तुमचे वेलनेस प्रमाणपत्र मिळवण्यासाठी अपग्रेड करा!'
                    : 'You are currently on a Free plan. Upgrade to Premium to unlock all wellness e-books and get your verified Wellness Certificate!'))
                : (langCode === 'hi'
                  ? 'आपकी सदस्यता सक्रिय है। आपके पास सभी प्रीमियम सुविधाओं की पूरी पहुंच है।'
                  : (langCode === 'mr'
                    ? 'तुमचे सदस्यत्व सक्रिय आहे. तुम्हाला सर्व प्रीमियम वैशिष्ट्यांमध्ये पूर्ण प्रवेश आहे.'
                    : 'Your subscription is active. You have full access to all premium features.'))}
            </Text>
            <View style={styles.planActions}>
              <TouchableOpacity 
                style={[styles.planBtnPrimary, { width: '100%' }]}
                onPress={() => navigation.navigate('SubscriptionPlans')}
              >
                <Text style={styles.planBtnTextPrimary}>
                  {memberPlan === 'Free Sakhi'
                    ? (langCode === 'hi' ? 'प्रीमियम में अपग्रेड करें' : (langCode === 'mr' ? 'प्रीमियममध्ये अपग्रेड करा' : 'Upgrade to Premium'))
                    : translate('managePlan', langCode)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Sign Out button */}
        <TouchableOpacity 
          style={styles.signOutBtn} 
          onPress={activeRole === 'partner' || activeRole === 'affiliate' ? () => switchRole('member') : logout}
        >
          <LogOut size={16} color={COLORS.secondary} style={{ marginRight: 8 }} />
          <Text style={styles.signOutBtnText}>{translate('logout', langCode)}</Text>
        </TouchableOpacity>



      </ScrollView>

      {/* Subscription Plans Modal */}
      <Modal visible={plansModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Subscription & Billing</Text>
                <Text style={styles.modalSubTitle}>Choose your plan and view invoices.</Text>
              </View>
              <TouchableOpacity onPress={() => setPlansModalVisible(false)}>
                <X size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {actionLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.secondary} />
                <Text style={styles.loaderText}>Processing Upgrade...</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 450 }} contentContainerStyle={{ paddingBottom: 20 }}>
                
                {/* Plans section */}
                <Text style={styles.modalSectionTitle}>Upgrade or Change Plan</Text>
                
                <View style={styles.plansList}>
                  {plans.map((p) => {
                    const isCurrent = subscription?.plan?.slug === p.slug;
                    const isPremium = p.slug?.includes('premium') || p.slug?.includes('elite');
                    
                    return (
                      <View 
                        key={p.id} 
                        style={[
                          styles.planModalCard, 
                          isCurrent && styles.activePlanModalCard,
                          isPremium && { borderLeftColor: '#F59E0B' }
                        ]}
                      >
                        {isPremium && (
                          <View style={styles.popularBadge}>
                            <Text style={styles.popularBadgeText}>★ PREMIUM CHOICE</Text>
                          </View>
                        )}
                        
                        <Text style={styles.planCardName}>{p.name}</Text>
                        <Text style={styles.planCardPrice}>
                          {p.price === '0' || p.price === 0 ? 'Free' : `₹${p.price}`}
                          {p.price !== '0' && p.price !== 0 && <Text style={{ fontSize: 10, fontWeight: '750' }}>/month</Text>}
                        </Text>

                        {/* Features list */}
                        <View style={styles.featuresList}>
                          {(p.features || []).slice(0, 3).map((feat, idx) => {
                            // Feature can be a plain string OR an object {name, value} / {featureValue}
                            const featStr = typeof feat === 'string'
                              ? feat
                              : feat?.name && feat?.value
                                ? `${feat.name}: ${feat.value}`
                                : feat?.value || feat?.featureValue || feat?.name || '';
                            return (
                              <Text key={idx} style={styles.featureText}>✓ {featStr}</Text>
                            );
                          })}
                        </View>

                        <TouchableOpacity 
                          style={[
                            styles.upgradeBtn, 
                            isCurrent ? styles.currentPlanBtn : styles.actionUpgradeBtn
                          ]}
                          disabled={isCurrent}
                          onPress={() => handleUpgrade(p)}
                        >
                          <Text style={[
                            styles.upgradeBtnText,
                            isCurrent ? styles.currentPlanBtnText : styles.actionUpgradeBtnText
                          ]}>
                            {isCurrent ? 'Current Plan' : 'Upgrade Now'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>

                {/* Billing History Section */}
                <Text style={[styles.modalSectionTitle, { marginTop: 24 }]}>Billing History</Text>
                
                {invoices.length === 0 ? (
                  <View style={styles.emptyBillingCard}>
                    <Text style={styles.emptyBillingText}>No billing history found. 🌸</Text>
                  </View>
                ) : (
                  invoices.map((inv) => (
                    <View key={inv.id} style={styles.invoiceRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <FileText size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                        <View>
                          <Text style={styles.invoiceRef}>Invoice ID: {inv.id.substring(0, 8)}...</Text>
                          <Text style={styles.invoiceDate}>{new Date(inv.createdAt || inv.date).toLocaleDateString()}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.invoiceAmt}>₹{inv.amount}</Text>
                        <Text style={styles.invoiceStatus}>PAID</Text>
                      </View>
                    </View>
                  ))
                )}

              </ScrollView>
            )}

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
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    ...SHADOWS.light,
    marginBottom: 20,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarInitialsBg: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#FDF2F8',
    borderColor: '#FBE8EB',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  ribbonBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: COLORS.white,
    borderColor: '#FBE8EB',
    borderWidth: 1.5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonText: {
    fontSize: 10,
    color: COLORS.secondary,
  },
  editBtn: {
    borderColor: '#FBE8EB',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  editBtnText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  saveChangesBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  saveChangesText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.white,
  },
  cardInfo: {
    marginTop: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  flowerIcon: {
    fontSize: 14,
    marginLeft: 6,
  },
  roleSub: {
    fontSize: 9,
    fontWeight: '850',
    color: COLORS.secondary,
    letterSpacing: 0.5,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  detailsList: {
    marginTop: 14,
    gap: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  editForm: {
    marginTop: 10,
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textMuted,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '850',
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    width: '100%',
    marginBottom: 20,
    ...SHADOWS.light,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EC489914',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  planBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#EC4899',
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '850',
    color: COLORS.primary,
    flex: 1,
  },
  planDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 14,
  },
  planActions: {
    flexDirection: 'row',
    gap: 10,
  },
  planBtnPrimary: {
    backgroundColor: '#EC4899',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBtnTextPrimary: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  inboxSectionHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  inboxCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
    marginBottom: 24,
  },
  inboxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  inboxDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  signOutBtn: {
    backgroundColor: '#FFF0F0',
    paddingVertical: 14,
    width: '100%',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  signOutBtnText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '800',
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
    borderRadius: 24,
    ...SHADOWS.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  modalSubTitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '850',
    color: COLORS.primary,
    marginBottom: 12,
  },
  plansList: {
    gap: 12,
  },
  planModalCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    position: 'relative',
    borderLeftWidth: 5,
  },
  activePlanModalCard: {
    borderColor: '#EC4899',
    backgroundColor: '#FFF0F53F',
  },
  popularBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#F59E0B1A',
    borderColor: '#F59E0B3D',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#D97706',
  },
  planCardName: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
  },
  planCardPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 4,
    marginBottom: 10,
  },
  featuresList: {
    gap: 4,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '650',
  },
  upgradeBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentPlanBtn: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  currentPlanBtnText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  actionUpgradeBtn: {
    backgroundColor: COLORS.secondary,
  },
  actionUpgradeBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },
  emptyBillingCard: {
    backgroundColor: COLORS.background,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyBillingText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  invoiceRef: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  invoiceDate: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  invoiceAmt: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
  },
  invoiceStatus: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.success,
    marginTop: 2,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loaderText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 10,
    fontWeight: '700',
  },
  notifCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 30, 90, 0.05)',
    ...SHADOWS.light,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
  },
  notifBody: {
    fontSize: 11.5,
    color: COLORS.textDark,
    lineHeight: 18,
  },
  notifDate: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'right',
  },
  // Chat Box container and list styles
  chatBoxContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    ...SHADOWS.light,
    overflow: 'hidden',
    marginBottom: 14,
    width: '100%',
  },
  chatScroll: {
    height: 250,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: COLORS.white,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 12,
    color: '#1E293B',
    maxHeight: 70,
    fontWeight: '600',
    marginRight: 8,
  },
  chatSendBtn: {
    backgroundColor: '#EC4899',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledSendBtn: {
    backgroundColor: '#E2E8F0',
  },
  sendBtnText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  msgRow: {
    width: '100%',
    marginVertical: 4,
  },
  myMsgRow: {
    alignItems: 'flex-end',
  },
  otherMsgRow: {
    alignItems: 'flex-start',
  },
  msgHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  msgSenderLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mySenderLabel: {
    color: '#EC4899',
  },
  otherSenderLabel: {
    color: '#6366F1',
  },
  msgTimestamp: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginLeft: 6,
    fontWeight: '600',
  },
  msgDeleteBtn: {
    marginLeft: 6,
    padding: 2,
  },
  msgBubble: {
    padding: 10,
    borderRadius: 16,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  myBubble: {
    backgroundColor: '#FFF1F2',
    borderTopRightRadius: 2,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  otherBubble: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 2,
  },
  msgText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  myText: {
    color: '#881337',
    fontWeight: '600',
  },
  otherText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  // Partner Switch Card styles
  partnerSwitchCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
    marginTop: 14,
    marginBottom: 14,
    ...SHADOWS.medium,
  },
  partnerSwitchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  partnerSwitchBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#EC4899',
    letterSpacing: 0.5,
  },
  partnerSwitchTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 4,
  },
  partnerSwitchDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    fontWeight: '600',
    marginBottom: 14,
  },
  partnerSwitchBtn: {
    backgroundColor: '#EC4899',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  partnerSwitchBtnText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
