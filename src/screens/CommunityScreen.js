import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, MessageCircle, Send, ArrowLeft, RefreshCw, Shield, Heart, Baby, Smile, Sparkles } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { translate } from '../utils/i18n';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import communityApi from '../api/communityApi';

export default function CommunityScreen({ navigation }) {
  const { langCode } = useLanguage();
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCircle, setActiveCircle] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef(null);

  const loadCircles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await communityApi.getCircles();
      setCircles(res?.circles || res?.data || []);
    } catch (e) {
      console.error('Community circles error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCircles(); }, [loadCircles]);

  const openCircle = async (circle) => {
    setMsgLoading(true);
    setMessages([]);
    try {
      if (!circle.joined) {
        try { await communityApi.joinCircle(circle.id); } catch (_) {}
      }
      const res = await communityApi.getCircleMessages(circle.id);
      setActiveCircle(circle);
      setMessages(res?.messages || res?.data || []);
    } catch (e) {
      const errorMsg = e?.response?.data?.message || e?.message || '';
      if (
        errorMsg.toLowerCase().includes('restricted') ||
        errorMsg.toLowerCase().includes('blocked') ||
        errorMsg.toLowerCase().includes('admin')
      ) {
        Alert.alert(
          translate('restrictedTitle', langCode) || 'Access Restricted 🔒',
          translate('restrictedMsg', langCode) || 'You have been restricted from this circle by Admin.'
        );
      } else {
        try {
          const res = await communityApi.getCircleMessages(circle.id);
          setActiveCircle(circle);
          setMessages(res?.messages || res?.data || []);
        } catch (err2) {
          const err2Msg = err2?.response?.data?.message || err2?.message || '';
          Alert.alert(
            translate('restrictedTitle', langCode) || 'Access Restricted 🔒',
            err2Msg || translate('restrictedMsg', langCode) || 'You have been restricted from this circle by Admin.'
          );
        }
      }
    } finally {
      setMsgLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !activeCircle) return;
    const text = msgText.trim();
    setMsgText('');
    setSending(true);
    try {
      const res = await communityApi.sendMessage(activeCircle.id, { message: text, isAnonymous: false });
      const newMsg = res?.chatMessage || { id: Date.now(), message: text, isOwnMessage: true, createdAt: new Date().toISOString() };
      setMessages(prev => [...prev, newMsg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      setMsgText(text);
      Alert.alert('Error', translate('sendFailed', langCode) || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  // ── Chat View ──
  if (activeCircle) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveCircle(null)} style={styles.backBtn}>
            <ArrowLeft size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{activeCircle.name || activeCircle.title}</Text>
            <Text style={styles.headerSub}>
              {activeCircle.memberCount ?? activeCircle._count?.members ?? activeCircle.membersCount ?? 0} {translate('membersActive', langCode) || 'members active'}
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
        >
          {msgLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={COLORS.secondary} />
            </View>
          ) : (
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.msgList}
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.center}>
                  <MessageCircle size={40} color={COLORS.border} />
                  <Text style={styles.emptyTitle}>{translate('noMessages', langCode) || 'No messages yet'}</Text>
                  <Text style={styles.emptySubtitle}>{translate('startConversation', langCode) || 'Be the first to say something!'}</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isOwn = item.isOwnMessage || item.isMine;
                return (
                  <View style={[styles.msgBubble, isOwn && styles.msgBubbleMine]}>
                    {!isOwn && (
                      <Text style={styles.msgSender}>{item.senderName || item.authorName || item.sender?.name || 'Sakhi'}</Text>
                    )}
                    <Text style={[styles.msgText, isOwn && styles.msgTextMine]}>
                      {item.message || item.content || item.text}
                    </Text>
                    <Text style={styles.msgTime}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                  </View>
                );
              }}
            />
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.msgInput}
              value={msgText}
              onChangeText={setMsgText}
              placeholder={translate('typeMessage', langCode) || 'Type a message...'}
              placeholderTextColor={COLORS.grayMuted}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={sending || !msgText.trim()}
              style={[styles.sendBtn, (!msgText.trim() || sending) && { opacity: 0.5 }]}
            >
              {sending ? <ActivityIndicator size="small" color={COLORS.white} /> : <Send size={18} color={COLORS.white} />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Circles List View ──
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Users size={20} color={COLORS.secondary} />
          <Text style={styles.headerTitle}>{translate('community', langCode) || 'Community'}</Text>
        </View>
        <TouchableOpacity onPress={loadCircles} style={styles.refreshBtn}>
          <RefreshCw size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      ) : circles.length === 0 ? (
        <View style={styles.center}>
          <Users size={48} color={COLORS.border} />
          <Text style={styles.emptyTitle}>{translate('noCircles', langCode) || 'No circles available'}</Text>
          <Text style={styles.emptySubtitle}>{translate('checkBack', langCode) || 'Check back later'}</Text>
        </View>
      ) : (
        <FlatList
          data={circles}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.privacyCard}>
              <View style={styles.shieldBadge}>
                <Shield size={24} color={COLORS.secondary} />
              </View>
              <View style={styles.privacyTextContent}>
                <Text style={styles.privacyTitle}>{translate('privacyPromise', langCode) || 'Privacy Promise'}</Text>
                <Text style={styles.privacySub}>
                  {translate('privacyPromiseSub', langCode) || 'Your identity remains private. Support others without judgment in our safe haven.'}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.circleCard} onPress={() => openCircle(item)} activeOpacity={0.85}>
              <View style={styles.circleIconBadge}>
                {item.name?.toLowerCase().includes('child') ? (
                  <Smile size={26} color="#F59E0B" />
                ) : item.name?.toLowerCase().includes('family') || item.name?.toLowerCase().includes('welness') ? (
                  <Heart size={26} color={COLORS.secondary} />
                ) : item.name?.toLowerCase().includes('mom') ? (
                  <Baby size={26} color="#8B5CF6" />
                ) : item.name?.toLowerCase().includes('pcod') ? (
                  <Heart size={26} color="#EC4899" />
                ) : (
                  <Sparkles size={26} color="#3B82F6" />
                )}
              </View>
              <Text style={styles.circleName}>{item.name || item.title}</Text>
              <Text style={styles.circleDesc} numberOfLines={2}>{item.description || ''}</Text>

              <TouchableOpacity style={styles.enterChatBtn} onPress={() => openCircle(item)} activeOpacity={0.85}>
                <Text style={styles.enterChatBtnText}>{translate('enterChatBtn', langCode) || 'ENTER CHAT'}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
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
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.primary, flex: 1 },
  headerSub: { fontSize: 11, color: COLORS.grayMuted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginTop: 16, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: COLORS.grayMuted, marginTop: 6, textAlign: 'center' },
  list: { padding: SPACING.md, paddingBottom: 40 },

  // Privacy Promise Card (Matching Web UI)
  privacyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.white, borderRadius: 20, padding: 18,
    marginBottom: 20, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light,
  },
  shieldBadge: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: COLORS.softPink, alignItems: 'center', justifyContent: 'center',
  },
  privacyTextContent: { flex: 1 },
  privacyTitle: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  privacySub: { fontSize: 12, color: COLORS.grayMuted, marginTop: 2, lineHeight: 17 },

  // Circle Card Grid item (Matching Web UI layout)
  circleCard: {
    backgroundColor: COLORS.white, borderRadius: 24, padding: 20,
    alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  circleIconBadge: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: COLORS.softPink, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  circleName: { fontSize: 17, fontWeight: '900', color: COLORS.primary, textAlign: 'center', marginBottom: 4 },
  circleDesc: { fontSize: 12, color: COLORS.grayMuted, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  enterChatBtn: {
    width: '100%', backgroundColor: '#15192c', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  enterChatBtnText: { color: COLORS.white, fontWeight: '900', fontSize: 13, letterSpacing: 0.8 },

  // Chat View styles
  msgList: { padding: SPACING.md, paddingBottom: 16, flexGrow: 1 },
  msgBubble: {
    maxWidth: '78%', alignSelf: 'flex-start',
    backgroundColor: COLORS.white, borderRadius: 16, borderBottomLeftRadius: 4,
    padding: 12, marginBottom: 10, ...SHADOWS.light,
  },
  msgBubbleMine: {
    alignSelf: 'flex-end', backgroundColor: COLORS.secondary, borderBottomLeftRadius: 16, borderBottomRightRadius: 4,
  },
  msgSender: { fontSize: 10, fontWeight: '800', color: COLORS.secondary, marginBottom: 3, textTransform: 'uppercase' },
  msgText: { fontSize: 14, color: COLORS.textDark, lineHeight: 20 },
  msgTextMine: { color: COLORS.white },
  msgTime: { fontSize: 9, color: COLORS.grayMuted, marginTop: 4, alignSelf: 'flex-end' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  msgInput: {
    flex: 1, backgroundColor: COLORS.grayLight, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
    color: COLORS.textDark, maxHeight: 100, marginRight: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center',
  },
});
