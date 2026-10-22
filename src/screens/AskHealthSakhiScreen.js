import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, Send, Trash2, ArrowLeft, RefreshCw, Sparkles, Stethoscope, Lock, Mail } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translate } from '../utils/i18n';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import memberApi from '../api/memberApi';

function isMessageOwnedByMember(message, authenticatedMemberId) {
  const senderId =
    message.senderId ??
    message.sender_id ??
    message.memberId ??
    message.member_id ??
    message.userId ??
    message.user_id;

  const senderRole = String(
    message.senderRole ??
    message.sender_role ??
    message.senderType ??
    message.sender_type ??
    ''
  ).toLowerCase();

  const adminRoles = [
    'admin',
    'doctor',
    'personal_doctor',
    'support',
    'admin_support'
  ];

  const idMatches =
    senderId != null &&
    authenticatedMemberId != null &&
    String(senderId) === String(authenticatedMemberId);

  return idMatches && !adminRoles.includes(senderRole);
}

export default function AskHealthSakhiScreen({ navigation }) {
  const { user } = useAuth();
  const { langCode } = useLanguage();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const flatRef = useRef(null);

  const planLower = (user?.plan || '').toLowerCase();
  const isLocked = planLower.length === 0 || planLower.includes('free');

  const fetchMessages = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await memberApi.getNotifications();
      if (res?.success && res?.notifications) {
        const processed = res.notifications.map(n => {
          const isMember = n.type === 'member_reply' || (n.type && n.type.startsWith('member_reply:')) || n.is_member === true;
          return {
            ...n,
            senderId: isMember ? user?.id : 'admin',
            senderRole: isMember ? 'member' : 'admin_support',
            is_member: isMember
          };
        });
        setNotifications(processed);
        if (res.notifications.some(n => !n.is_read)) {
          try { await memberApi.markAllNotificationsRead(); } catch (_) {}
        }
      }
    } catch (e) {
      console.error('Fetch messages error:', e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!replyText.trim() || sending) return;
    const text = replyText.trim();
    setReplyText('');
    setSending(true);
    try {
      await memberApi.sendNotificationReply(text);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
      fetchMessages(false);
    } catch (e) {
      setReplyText(text);
      Alert.alert('Error', translate('sendFailed', langCode) || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = (id) => {
    const msg = notifications.find(n => n.id === id);
    if (!msg || !isMessageOwnedByMember(msg, user?.id)) {
      Alert.alert('Permission Denied', 'You can only delete your own messages.');
      return;
    }
    Alert.alert(
      translate('delete', langCode) || 'Delete Message',
      translate('deleteConfirm', langCode) || 'Are you sure you want to delete this message?',
      [
        { text: translate('cancel', langCode) || 'Cancel', style: 'cancel' },
        {
          text: translate('delete', langCode) || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await memberApi.deleteNotification(id);
              setNotifications(prev => prev.filter(n => n.id !== id));
            } catch (e) {
              Alert.alert('Error', 'Failed to delete message.');
            }
          }
        }
      ]
    );
  };

  if (isLocked) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Stethoscope size={20} color={COLORS.secondary} />
            <Text style={styles.headerTitle}>{translate('askSakhi', langCode) || 'Ask Health Sakhi'}</Text>
          </View>
        </View>

        <View style={styles.lockedContainer}>
          <View style={styles.lockedBadge}>
            <Lock size={32} color={COLORS.secondary} />
          </View>
          <Text style={styles.lockedTitle}>Personal Doctor Consult Locked 🔒</Text>
          <Text style={styles.lockedDesc}>
            Send direct messages to your Personal Consultation Doctor. Get personalized health guidance and answers. Upgrade to Basic Sakhi or Premium Sakhi plan to unlock!
          </Text>
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            <Text style={styles.upgradeBtnText}>UPGRADE TO UNLOCK 🌸</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Stethoscope size={20} color={COLORS.secondary} />
          <View>
            <Text style={styles.headerTitle}>{translate('askSakhi', langCode) || 'Ask Health Sakhi'}</Text>
            <Text style={styles.headerSub}>Personal Consultation Thread</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => fetchMessages(true)} style={styles.refreshBtn}>
          <RefreshCw size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        {/* Messages List */}
        {loading && notifications.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.center}>
            <Mail size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySub}>
              Type your message below to connect with your Personal Consultation Doctor.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={[...notifications].reverse()}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isMemberReply = item.type === 'member_reply';
              const isOwnMessage = isMessageOwnedByMember(item, user?.id);
              return (
                <View style={[styles.msgWrapper, isMemberReply ? styles.msgRight : styles.msgLeft]}>
                  <View style={styles.msgHeader}>
                    <Text style={[styles.senderLabel, isMemberReply ? styles.senderMember : styles.senderDoctor]}>
                      {isMemberReply ? '🌸 YOU (MEMBER)' : '🩺 PERSONAL DOCTOR'}
                    </Text>
                    <Text style={styles.timeText}>
                      {item.created_at || item.createdAt ? new Date(item.created_at || item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                  </View>

                  <View style={[styles.bubble, isMemberReply ? styles.bubbleMember : styles.bubbleDoctor]}>
                    {item.title && !isMemberReply && (
                      <Text style={styles.msgTitle}>{item.title}</Text>
                    )}
                    <Text style={[styles.msgContent, isMemberReply ? styles.msgContentMember : styles.msgContentDoctor]}>
                      {item.message}
                    </Text>
                  </View>

                  {isOwnMessage && (
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                      <Trash2 size={12} color={COLORS.grayMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        )}

        {/* Reply Box Form */}
        <View style={styles.inputContainer}>
          {sendSuccess && (
            <Text style={styles.successBadge}>✓ Message Sent!</Text>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={replyText}
              onChangeText={setReplyText}
              placeholder={translate('sendMessagePlaceholder', langCode) || "Type your message..."}
              placeholderTextColor={COLORS.grayMuted}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!replyText.trim() || sending) && { opacity: 0.5 }]}
              onPress={handleSend}
              disabled={!replyText.trim() || sending}
            >
              {sending ? <ActivityIndicator size="small" color={COLORS.white} /> : <Send size={18} color={COLORS.white} />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  headerSub: { fontSize: 11, color: COLORS.grayMuted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginTop: 16 },
  emptySub: { fontSize: 12, color: COLORS.grayMuted, textAlign: 'center', marginTop: 4, maxWidth: 260 },
  list: { padding: SPACING.md, paddingBottom: 16 },
  msgWrapper: { marginBottom: 14, maxWidth: '85%' },
  msgLeft: { alignSelf: 'flex-start' },
  msgRight: { alignSelf: 'flex-end' },
  msgHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  senderLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  senderMember: { color: COLORS.secondary },
  senderDoctor: { color: COLORS.primary },
  timeText: { fontSize: 9, color: COLORS.grayMuted },
  bubble: { padding: 12, borderRadius: 16 },
  bubbleDoctor: { backgroundColor: '#15192c', borderTopLeftRadius: 4 },
  bubbleMember: { backgroundColor: COLORS.softPink, borderTopRightRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  msgTitle: { fontSize: 10, fontWeight: '900', color: COLORS.secondary, marginBottom: 2, textTransform: 'uppercase' },
  msgContent: { fontSize: 13, lineHeight: 19 },
  msgContentDoctor: { color: COLORS.white },
  msgContentMember: { color: COLORS.primary },
  deleteBtn: { marginTop: 4, alignSelf: 'flex-end', padding: 2 },
  inputContainer: {
    padding: 12, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  successBadge: { fontSize: 11, fontWeight: '800', color: COLORS.success, marginBottom: 6, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1, backgroundColor: COLORS.grayLight, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: COLORS.textDark,
    maxHeight: 100, borderWidth: 1, borderColor: COLORS.border,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  lockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  lockedBadge: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.softPink,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  lockedTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginBottom: 8 },
  lockedDesc: { fontSize: 13, color: COLORS.grayMuted, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  upgradeBtn: {
    backgroundColor: COLORS.secondary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 20,
  },
  upgradeBtnText: { color: COLORS.white, fontWeight: '900', fontSize: 13 },
});
