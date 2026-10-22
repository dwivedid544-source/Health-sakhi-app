import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, 
  TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, 
  ActivityIndicator, ScrollView, Modal, Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Sparkles, Globe, ArrowLeft, Clock, Plus, Trash2, Lock, Crown, BookOpen, ChevronRight, HelpCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
import { translate } from '../utils/i18n';
import aiApi from '../api/aiApi';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';

const QUICK_REPLIES = {
  en: ['I feel anxious 😟', 'Period is late 🌙', 'Books library 📚', 'FAQ & Help ❓'],
  hi: ['मुझे चिंता हो रही है 😟', 'पीरियड देर से है 🌙', 'स्वास्थ्य पुस्तकें 📚', 'सवाल और जवाब ❓'],
  mr: ['मला काळजी वाटते 😟', 'पाळी उशीर झाली 🌙', 'आरोग्य पुस्तके 📚', 'प्रश्न आणि उत्तरे ❓'],
};

export default function AISakhiScreen({ navigation }) {
  const { user } = useAuth();
  const { langCode, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();

  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [historyModal, setHistoryModal] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [chatError, setChatError] = useState(null);
  const flatListRef = useRef(null);

  // Subscription plan check
  const planLower = (user?.plan || '').toLowerCase();
  const isLocked = !user?.plan || planLower.includes('free');

  const userName = (user?.name && user.name.toLowerCase() !== 'member') 
    ? user.name 
    : user?.fullName || (user?.email ? user.email.split('@')[0] : 'Sakhi');

  // Fetch all chat history / sessions from backend
  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await aiApi.getSessions();
      if (res && res.success && Array.isArray(res.sessions)) {
        setChatSessions(res.sessions);
        return res.sessions;
      }
      return [];
    } catch (err) {
      console.error('Error fetching chat sessions:', err);
      return [];
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load a specific session's messages from backend
  const loadSession = async (sId) => {
    try {
      setLoadingChat(true);
      setChatError(null);
      setSessionId(sId);

      const res = await aiApi.getMessages(sId);
      if (res && res.success && Array.isArray(res.messages)) {
        const mapped = res.messages.map((m) => ({
          id: String(m.id || Math.random()),
          role: m.role === 'assistant' ? 'sakhi' : 'user',
          text: String(m.message || m.text || ''),
          suggestions: m.suggestions || [],
          time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
        }));
        setMessages(mapped);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error loading session messages:', err);
      setChatError('Failed to load conversation history');
    } finally {
      setLoadingChat(false);
    }
  };

  // Start a completely new backend chat session
  const handleStartNewSession = async () => {
    try {
      setLoadingChat(true);
      setChatError(null);
      const title = `Sakhi Session ${new Date().toLocaleDateString()}`;
      const res = await aiApi.createSession(title);
      if (res && res.success && res.session_id) {
        setSessionId(res.session_id);
        await fetchHistory();
        setMessages([
          {
            id: 'init_' + Date.now(),
            role: 'sakhi',
            text: translate('aiWelcome', langCode) || `Namaste, Meri Sakhi🌸 I'm here to listen to your heart. Tell me, how are you feeling today?`,
            suggestions: [],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return res.session_id;
      }
    } catch (err) {
      console.error('Error creating new session:', err);
      setChatError('Failed to create new conversation');
    } finally {
      setLoadingChat(false);
    }
  };

  // Initial load: Fetch history and load recent session or create new
  useEffect(() => {
    const initialize = async () => {
      if (isLocked) return;
      const sessions = await fetchHistory();
      if (sessions && sessions.length > 0) {
        loadSession(sessions[0].id);
      } else {
        handleStartNewSession();
      }
    };
    initialize();
  }, [isLocked]);

  // Delete chat session
  const handleDeleteSession = (sid) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this chat session? 🗑️',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await aiApi.deleteSession(sid);
              const remaining = chatSessions.filter(s => String(s.id) !== String(sid));
              setChatSessions(remaining);
              if (sid === sessionId) {
                if (remaining.length > 0) {
                  loadSession(remaining[0].id);
                } else {
                  handleStartNewSession();
                }
              }
            } catch (e) {
              console.error('Failed to delete session:', e);
            }
          }
        }
      ]
    );
  };

  // Send message using exact backend contract
  const handleSend = async (text = null) => {
    const msgText = String(text || inputText).trim();
    if (!msgText || isTyping) return;

    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = await handleStartNewSession();
      if (!currentSessionId) {
        setChatError('Network error. Failed to initialize session. Please retry.');
        return;
      }
    }
    setInputText('');

    const userMsg = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text: msgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setChatError(null);

    try {
      const res = await aiApi.sendMessage(currentSessionId, msgText, null);
      if (res && res.success) {
        const botMsg = {
          id: 'sakhi_' + (Date.now() + 1),
          role: 'sakhi',
          text: String(res.reply || res.response || ''),
          suggestions: res.suggestions || [],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error(res?.message || 'Failed to get response');
      }
    } catch (err) {
      console.error('Error sending chat message:', err?.message || err);
      setChatError('Network error. Failed to send message. Please retry.');
      // Remove un-sent message from list without fabricating bot answer
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  };

  // Handles dynamic suggestion chip taps
  const handleSuggestionPress = (sugg) => {
    if (typeof sugg === 'string') {
      handleSend(sugg);
      return;
    }

    if (sugg?.type === 'book' || sugg?.link?.includes('book')) {
      const idMatch = (sugg?.link || '').match(/(?:books|book)\/([a-zA-Z0-9_-]+)/) || (sugg?.link || '').match(/(\d+)/);
      if (idMatch && idMatch[1]) {
        navigation.navigate('BookDetail', { bookId: idMatch[1] });
      } else {
        navigation.navigate('App', { screen: 'Books' });
      }
    } else if (sugg?.text || sugg?.title) {
      handleSend(sugg.text || sugg.title);
    }
  };

  // Parses markdown links like [Book Title](/books/1) into clickable pills safely
  const renderMessageContent = (text, isUser) => {
    const textStr = typeof text === 'string' ? text : String(text || '');

    if (isUser || !textStr.includes('[')) {
      return (
        <Text style={[styles.messageText, isUser ? styles.userMessageText : null]}>
          {textStr}
        </Text>
      );
    }

    const regex = /\[([^\]]+)\]\s*\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(textStr)) !== null) {
      if (match.index > lastIndex) {
        const textSegment = textStr.substring(lastIndex, match.index);
        parts.push(
          <Text key={`txt_${lastIndex}`} style={styles.messageText}>
            {textSegment}
          </Text>
        );
      }

      const linkText = match[1];
      const linkUrl = match[2];

      parts.push(
        <TouchableOpacity
          key={`link_${match.index}`}
          style={styles.linkPill}
          onPress={() => {
            if (linkUrl.includes('book')) {
              const idMatch = linkUrl.match(/(?:books|book)\/([a-zA-Z0-9_-]+)/) || linkUrl.match(/(\d+)/);
              if (idMatch && idMatch[1]) {
                navigation.navigate('BookDetail', { bookId: idMatch[1] });
              } else {
                navigation.navigate('App', { screen: 'Books' });
              }
            } else if (linkUrl.includes('faq')) {
              navigation.navigate('FAQ');
            } else if (linkUrl.includes('diary')) {
              navigation.navigate('SakhiDiary');
            }
          }}
        >
          <BookOpen size={12} color={COLORS.secondary} />
          <Text style={styles.linkPillText}>{linkText}</Text>
          <ChevronRight size={12} color={COLORS.secondary} />
        </TouchableOpacity>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < textStr.length) {
      const tailSegment = textStr.substring(lastIndex);
      parts.push(
        <Text key={`txt_tail`} style={styles.messageText}>
          {tailSegment}
        </Text>
      );
    }

    return <View style={styles.messagePartContainer}>{parts}</View>;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Sparkles size={18} color={COLORS.secondary} />
          <Text style={styles.headerTitle}>AI Health Sakhi</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => { setHistoryModal(true); fetchHistory(); }} style={styles.iconBtn}>
            <Clock size={18} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleStartNewSession} style={styles.iconBtn}>
            <Plus size={18} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowLangMenu(!showLangMenu)} style={styles.langBtn}>
            <Globe size={16} color={COLORS.secondary} />
            <Text style={styles.langBtnText}>{langCode.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Selector Dropdown */}
      {showLangMenu ? (
        <View style={styles.langDropdown}>
          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langOption, langCode === lang.code ? styles.langOptionActive : null]}
              onPress={() => {
                setLanguage(lang.code);
                setShowLangMenu(false);
              }}
            >
              <Text style={[styles.langOptionText, langCode === lang.code ? styles.langOptionTextActive : null]}>
                {lang.nativeLabel || lang.label} ({lang.label})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Free Plan Lock Gate Screen */}
      {isLocked ? (
        <View style={styles.lockedContainer}>
          <View style={styles.lockBadgeIcon}>
            <Lock size={36} color={COLORS.secondary} />
          </View>
          <Text style={styles.lockedTitle}>AI Health Sakhi Locked 🔒</Text>
          <Text style={styles.lockedSub}>
            You are currently on the Free Sakhi Plan. Upgrade to Basic or Premium Plan to unlock unlimited 24/7 AI Health Sakhi guidance.
          </Text>
          <TouchableOpacity 
            style={styles.upgradeBtn}
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            <Crown size={18} color={COLORS.white} />
            <Text style={styles.upgradeBtnText}>UPGRADE PLAN TO UNLOCK 🌸</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Chat Conversation Body */
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 25}
        >
          {loadingChat ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.secondary} />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => String(item.id)}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isUser = item.role === 'user';
                return (
                  <View style={styles.bubbleWrapper}>
                    <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
                      {!isUser ? (
                        <Text style={styles.botName}>AI HEALTH SAKHI 🌸</Text>
                      ) : null}
                      {renderMessageContent(item.text, isUser)}
                    </View>

                    {/* Dynamic Action & Suggestion Chips under Bot Reply (Matching Web) */}
                    {!isUser && item.suggestions && item.suggestions.length > 0 ? (
                      <View style={styles.botSuggestionsContainer}>
                        {item.suggestions.map((sugg, idx) => {
                          const label = typeof sugg === 'string' 
                            ? sugg 
                            : (sugg.title || sugg.label || sugg.text || sugg.caption || 'Explore');
                          const isBookType = typeof sugg !== 'string' && (sugg.type === 'book' || (sugg.link || '').includes('book'));

                          return (
                            <TouchableOpacity
                              key={idx}
                              style={[styles.actionChip, isBookType ? styles.bookActionChip : styles.questionActionChip]}
                              onPress={() => handleSuggestionPress(sugg)}
                            >
                              {isBookType ? (
                                <BookOpen size={12} color={COLORS.white} />
                              ) : (
                                <HelpCircle size={12} color={COLORS.secondary} />
                              )}
                              <Text style={[styles.actionChipText, isBookType ? styles.bookActionChipText : styles.questionActionChipText]}>
                                {label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                );
              }}
            />
          )}

          {isTyping ? (
            <View style={styles.typingContainer}>
              <ActivityIndicator size="small" color={COLORS.secondary} />
              <Text style={styles.typingText}>Sakhi is typing...</Text>
            </View>
          ) : null}

          {chatError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{chatError}</Text>
            </View>
          ) : null}

          {/* Chat Input Container */}
          <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={translate('aiPlaceholder', langCode) || 'Ask Health Sakhi anything...'}
              placeholderTextColor={COLORS.grayMuted}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, (!inputText.trim() || isTyping) ? { opacity: 0.5 } : null]} 
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isTyping}
            >
              {isTyping ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Send size={18} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Top / Dropdown Past Conversations Modal with Delete Option */}
      <Modal visible={historyModal} animationType="fade" transparent>
        <View style={styles.topModalBg}>
          <View style={styles.topModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Clock size={18} color={COLORS.secondary} />
                <Text style={styles.modalTitle}>Past Conversations</Text>
              </View>
              <TouchableOpacity onPress={() => setHistoryModal(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingHistory ? (
              <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginVertical: 30 }} />
            ) : chatSessions.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Clock size={36} color={COLORS.border} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary, marginTop: 10 }}>No past sessions</Text>
                <Text style={{ fontSize: 12, color: COLORS.grayMuted, textAlign: 'center', marginTop: 4 }}>Your previous AI conversations will appear here.</Text>
              </View>
            ) : (
              <FlatList
                data={chatSessions}
                keyExtractor={item => String(item.id || Math.random())}
                style={{ maxHeight: 300 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.sessionItemRow}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => { setHistoryModal(false); loadSession(item.id); }}>
                      <Text style={styles.sessionTitle}>{String(item.title || 'Chat Session')}</Text>
                      <Text style={styles.sessionDate}>{item.updatedAt || item.createdAt ? new Date(item.updatedAt || item.createdAt).toLocaleDateString() : ''}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleDeleteSession(item.id)} style={styles.deleteSessionBtn}>
                      <Trash2 size={16} color={COLORS.rose} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
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
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { padding: 4 },
  langBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.softPink, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  langBtnText: { fontSize: 11, fontWeight: '800', color: COLORS.secondary },
  langDropdown: {
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    padding: SPACING.sm, gap: 4, elevation: 4, zIndex: 99,
  },
  langOption: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  langOptionActive: { backgroundColor: COLORS.softPink },
  langOptionText: { fontSize: 13, color: COLORS.textDark, fontWeight: '600' },
  langOptionTextActive: { fontWeight: '800', color: COLORS.secondary },
  
  // Locked Screen
  lockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  lockBadgeIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.softPink,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  lockedTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primary, marginBottom: 8, textAlign: 'center' },
  lockedSub: { fontSize: 13, color: COLORS.grayMuted, textAlign: 'center', lineHeight: 19, marginBottom: 20, maxWidth: 300 },
  upgradeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.secondary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16,
    ...SHADOWS.medium,
  },
  upgradeBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

  // Message Bubbles & Links
  messageList: { padding: SPACING.md, paddingBottom: 10 },
  bubbleWrapper: { marginBottom: 12 },
  messageBubble: {
    maxWidth: '85%', borderRadius: 18, padding: 14, ...SHADOWS.light,
  },
  botBubble: { alignSelf: 'flex-start', backgroundColor: COLORS.white, borderBottomLeftRadius: 4 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: COLORS.secondary, borderBottomRightRadius: 4 },
  botName: { fontSize: 10, fontWeight: '900', color: COLORS.secondary, marginBottom: 4, letterSpacing: 0.5 },
  messageText: { fontSize: 14, color: COLORS.textDark, lineHeight: 20 },
  userMessageText: { color: COLORS.white },
  messagePartContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  linkPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.softPink, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    marginVertical: 4, borderWidth: 1, borderColor: COLORS.secondary,
  },
  linkPillText: { fontSize: 12, fontWeight: '800', color: COLORS.secondary },
  
  // Dynamic Bot Action Chips
  botSuggestionsContainer: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, paddingLeft: 4, maxWidth: '90%',
  },
  actionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  bookActionChip: { backgroundColor: COLORS.secondary },
  bookActionChipText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  questionActionChip: { backgroundColor: COLORS.softPink, borderWidth: 1, borderColor: COLORS.border },
  questionActionChipText: { color: COLORS.secondary, fontSize: 11, fontWeight: '800' },

  typingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: SPACING.md, marginBottom: 8 },
  typingText: { fontSize: 12, color: COLORS.grayMuted, fontStyle: 'italic' },
  errorContainer: { paddingHorizontal: SPACING.md, paddingVertical: 4, marginBottom: 6 },
  errorText: { fontSize: 12, color: COLORS.rose, fontWeight: '600' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 8,
    backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  input: {
    flex: 1, backgroundColor: COLORS.grayLight, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: COLORS.textDark,
    maxHeight: 100, marginRight: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.secondary,
    alignItems: 'center', justifyContent: 'center',
  },

  // Top Modal
  topModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', paddingTop: 50, paddingHorizontal: 16 },
  topModalCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 20, ...SHADOWS.medium },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  closeText: { fontSize: 18, color: COLORS.grayMuted, fontWeight: '900' },
  sessionItemRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight,
  },
  sessionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  sessionDate: { fontSize: 10, color: COLORS.grayMuted, marginTop: 2 },
  deleteSessionBtn: { padding: 8 },
});
