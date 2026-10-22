import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Shield, Search, ArrowLeft, Plus, Star, Users, Heart,
  MessageSquare, Send, X, CheckCircle2, Lock
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { translate } from '../utils/i18n';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import apiClient from '../api/apiClient';
import FloatingAIBtn from '../components/FloatingAIBtn';

const iconMap = {
  Star: Star,
  Users: Users,
  Heart: Heart,
  Shield: Shield
};

const DEFAULT_CIRCLES = [
  {
    id: '1',
    name: 'Confidence',
    icon: Star,
    color: '#F59E0B',
    description: 'Express yourself without judgment and build inner self esteem.',
    membersCount: 142,
    joined: true
  },
  {
    id: '2',
    name: 'Moms Circle',
    icon: Users,
    color: '#EC4899',
    description: 'Connecting mothers, new mothers & future mothers in sisterhood.',
    membersCount: 98,
    joined: true
  },
  {
    id: '3',
    name: 'PCOD Support',
    icon: Heart,
    color: '#8B5CF6',
    description: 'Sisterhood support for PCOD, PCOS & hormonal health wellness.',
    membersCount: 215,
    joined: true
  },
  {
    id: '4',
    name: 'Stress Support',
    icon: Shield,
    color: '#10B981',
    description: 'Finding peace, mindfulness & emotional balance together.',
    membersCount: 76,
    joined: true
  },
];

const INITIAL_MESSAGES = {
  '1': [
    { id: 'm1', sender: 'Anonymous Sakhi', text: 'Hi sakhis! How do you handle public speaking anxiety?', time: '10:15 AM' },
    { id: 'm2', sender: 'Priya (Sakhi)', text: 'Deep breathing exercises before going on stage really helped me! 🌸', time: '10:18 AM' },
    { id: 'm3', sender: 'Sister Kavita', text: 'Daily affirmations and positive self-talk before sleep worked wonders for me. 💖', time: '10:22 AM' }
  ],
  '2': [
    { id: 'm4', sender: 'Moms Sakhi', text: 'Any quick tips for postpartum fatigue sakhis?', time: '11:00 AM' },
    { id: 'm5', sender: 'Dr. Sakhi AI', text: 'Ensure adequate iron, gentle walks & power naps when baby sleeps. 🍼', time: '11:05 AM' }
  ],
  '3': [
    { id: 'm6', sender: 'Sister Ananya', text: 'Does anyone have herbal tea recommendations for period pain & PCOD bloating?', time: '9:30 AM' },
    { id: 'm7', sender: 'Dr. Sakhi AI', text: 'Spearmint tea & chamomile tea are wonderful for soothing PCOD symptoms. 🍵', time: '9:32 AM' },
    { id: 'm8', sender: 'Anonymous Sakhi', text: 'Adding 15 mins of light yoga every morning helped my hormonal balance. 🧘‍♀️', time: '9:40 AM' }
  ],
  '4': [
    { id: 'm9', sender: 'Sister Ritu', text: 'Feeling overwhelmed with work & family balance today. Sending love to all. 🌸', time: '8:45 AM' },
    { id: 'm10', sender: 'Anonymous Sakhi', text: 'You are strong Sakhi! Take 5 minutes just for yourself right now. We are with you. 💗', time: '8:50 AM' }
  ]
};

export default function RelationshipSakhiScreen({ navigation }) {
  const { langCode } = useLanguage();
  const [circles, setCircles] = useState(DEFAULT_CIRCLES);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper translations for demo groups
  const getCircleName = (name) => {
    if (name === 'Confidence') return langCode === 'hi' ? 'आत्मविश्वास' : (langCode === 'mr' ? 'आत्मविश्वास' : 'Confidence');
    if (name === 'Moms Circle') return langCode === 'hi' ? 'मदर्स सर्कल' : (langCode === 'mr' ? 'मदर्स सर्कल' : 'Moms Circle');
    if (name === 'PCOD Support') return langCode === 'hi' ? 'पीसीओडी सहायता' : (langCode === 'mr' ? 'पीसीओडी मदत' : 'PCOD Support');
    if (name === 'Stress Support') return langCode === 'hi' ? 'तनाव सहायता' : (langCode === 'mr' ? 'तणाव मदत' : 'Stress Support');
    return name;
  };

  const getCircleDesc = (desc, name) => {
    if (name === 'Confidence') return langCode === 'hi' ? 'बिना किसी निर्णय के खुद को व्यक्त करें और आत्मविश्वास बढ़ाएं।' : (langCode === 'mr' ? 'स्वतःला व्यक्त करा आणि आत्मविश्वास वाढवा.' : desc);
    if (name === 'Moms Circle') return langCode === 'hi' ? 'सिस्टरहुड में माताओं, नई माताओं और भविष्य की माताओं को जोड़ना।' : (langCode === 'mr' ? 'भगिनीभावामध्ये मातांना जोडणे.' : desc);
    if (name === 'PCOD Support') return langCode === 'hi' ? 'पीसीओडी, पीसीओएस और हार्मोनल स्वास्थ्य कल्याण के लिए सिस्टरहुड समर्थन।' : (langCode === 'mr' ? 'पीसीओडी, पीसीओएस आणि हार्मोनल आरोग्य कल्याणासाठी मदत.' : desc);
    if (name === 'Stress Support') return langCode === 'hi' ? 'एक साथ शांति, दिमागीपन और भावनात्मक संतुलन खोजना।' : (langCode === 'mr' ? 'एकत्र शांतता आणि भावनिक संतुलन शोधणे.' : desc);
    return desc;
  };

  // Active Group Chat Room Modal State
  const [activeCircle, setActiveCircle] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Create Circle / Post Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const [isTrialExpired, setIsTrialExpired] = useState(false);

  useEffect(() => {
    fetchCircles();
    checkTrial();
  }, []);

  const checkTrial = async () => {
    try {
      const res = await apiClient.get('/members/profile');
      if (res.data && res.data.success && res.data.profile?.subscription?.is_trial_expired) {
        setIsTrialExpired(true);
      }
    } catch (e) {}
  };

  const fetchCircles = async () => {
    try {
      const res = await apiClient.get('/community/circles');
      if (res.data && res.data.success && res.data.circles?.length > 0) {
        const apiCircles = res.data.circles.map(c => ({
          id: c.id,
          name: c.name,
          icon: iconMap[c.icon] || Heart,
          color: c.color || '#EC4899',
          description: c.description || 'A safe space for sakhis to connect.',
          membersCount: c.membersCount || c.members_count || 120,
          joined: c.joined === true
        }));
        setCircles(apiCircles);
      }
    } catch (err) {
      console.log('Failed to fetch backend circles:', err.message);
    }
  };

  const handleJoinCircle = async (circleId) => {
    try {
      const res = await apiClient.post(`/community/circles/${circleId}/join`);
      if (res.data && res.data.success) {
        Alert.alert('Joined Sisterhood! 💖', 'You are now a member of this circle.');
        fetchCircles();
      }
    } catch (err) {
      console.log('Failed to join circle:', err.message);
      Alert.alert('Error', 'Could not join support circle.');
    }
  };

  useEffect(() => {
    if (!activeCircle) return;
    fetchCircleMessages(activeCircle.id);

    // Only poll if activeCircle.id is a real UUID from database
    if (activeCircle.id && typeof activeCircle.id === 'string' && activeCircle.id.length > 10) {
      const interval = setInterval(() => {
        fetchCircleMessages(activeCircle.id);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeCircle]);

  const fetchCircleMessages = async (circleId) => {
    if (!circleId) return;

    // For static demo IDs ('1', '2', '3', '4'), load local initial messages without calling backend
    if (typeof circleId === 'string' && circleId.length <= 10) {
      setMessages(INITIAL_MESSAGES[circleId] || [
        { id: 'init', sender: 'health sakhi Team', text: `Welcome to ${activeCircle?.name || 'Sisterhood'} Circle! Share anonymously and support each other. 🌸`, time: 'Just now' }
      ]);
      return;
    }

    try {
      const res = await apiClient.get(`/community/circles/${circleId}/messages`);
      if (res.data && res.data.success && Array.isArray(res.data.messages)) {
        const formatted = res.data.messages.map(m => ({
          id: m.id,
          sender: m.isOwnMessage ? 'You (Anonymous)' : (m.senderName || 'Anonymous Sakhi'),
          text: m.message || '',
          time: new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(formatted);
      } else if (!messages || messages.length === 0) {
        setMessages(INITIAL_MESSAGES[circleId] || []);
      }
    } catch (err) {
      // Quiet fallback on network/backend 500 error
      if (!messages || messages.length === 0) {
        setMessages(INITIAL_MESSAGES[circleId] || []);
      }
    }
  };

  const filteredCircles = circles.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinOrEnter = (circle) => {
    setActiveCircle(circle);
    setMessages(INITIAL_MESSAGES[circle.id] || [
      { id: 'init', sender: 'health sakhi Team', text: `Welcome to ${circle.name} Circle! Share anonymously and support each other. 🌸`, time: 'Just now' }
    ]);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeCircle) return;
    const textToSend = newMessage.trim();
    setNewMessage('');

    // Instant local append so chat feels instantaneous
    const myMsg = {
      id: Date.now().toString(),
      sender: 'You (Anonymous)',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, myMsg]);

    if (activeCircle.id && typeof activeCircle.id === 'string' && activeCircle.id.length > 10) {
      try {
        await apiClient.post(`/community/circles/${activeCircle.id}/messages`, {
          message: textToSend,
          isAnonymous: true
        });
        fetchCircleMessages(activeCircle.id);
      } catch (err) {
        // Quiet fallback
      }
    }
  };

  const handleCreateCircle = () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please enter a circle title.');
      return;
    }
    const newCircle = {
      id: Date.now().toString(),
      name: newTitle.trim(),
      icon: Heart,
      color: '#EC4899',
      description: newDesc.trim() || 'A safe space for sakhis to connect and support each other.',
      membersCount: 1,
      joined: true
    };
    setCircles(prev => [newCircle, ...prev]);
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    Alert.alert('Circle Created! 🌸', `"${newCircle.name}" support circle is now live!`);
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{translate('womenCommunity', langCode)}</Text>
            <Text style={styles.headerSub}>{translate('anonymousSafeSpace', langCode)}</Text>
          </View>
        </View>


        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
          <Plus size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {isTrialExpired ? (
        <View style={{ flex: 1, padding: 20, alignItems: 'center', justifyCenter: 'center', backgroundColor: '#FFF7F8' }}>
          <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Users size={36} color="#FFF" />
          </View>
          <View style={{ backgroundColor: '#FFF1F2', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 10 }}>
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#BE123C' }}>1-MONTH FREE SAKHI PLAN EXPIRED 🌸</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.primary, marginBottom: 8, textAlign: 'center' }}>Upgrade to Premium Plan 💎</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 20, maxWidth: 280 }}>
            Your 30-day Free Sakhi trial period has ended. Please upgrade to a Premium plan to unlock Community Sakhis!
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: COLORS.secondary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 }}
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFF' }}>UPGRADE TO PREMIUM PLAN 💎</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={translate('searchCircles', langCode)}
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>


        {/* Privacy Promise Banner (Matching Web Frontend) */}
        <View style={styles.privacyBanner}>
          <View style={styles.shieldIconBg}>
            <Shield size={24} color={COLORS.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.privacyTitle}>{translate('privacyPromise', langCode)}</Text>
            <Text style={styles.privacySub}>
              {translate('privacyPromiseSub', langCode)}
            </Text>
          </View>
        </View>

        {/* Support Circles 2x2 Grid (Matching Web Frontend) */}
        <Text style={styles.sectionHeading}>{translate('supportCircles', langCode)}</Text>

        <View style={styles.gridContainer}>
          {filteredCircles.map(item => {
            const IconComp = item.icon;

            return (
              <View key={item.id} style={styles.circleCard}>
                <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                  <IconComp size={26} color={item.color} />
                </View>

                <Text style={styles.cardName}>{getCircleName(item.name)}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{getCircleDesc(item.description, item.name)}</Text>
                <Text style={styles.cardMembers}>{item.membersCount} {translate('membersActive', langCode)}</Text>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    item.joined ? styles.joinedBtn : styles.joinBtn
                  ]}
                  onPress={() => item.joined ? handleJoinOrEnter(item) : handleJoinCircle(item.id)}
                  activeOpacity={0.85}
                >
                  <Text style={[
                    styles.actionBtnText,
                    item.joined ? styles.joinedBtnText : styles.joinBtnText
                  ]}>
                    {item.joined ? translate('enterChat', langCode) : translate('joinCircle', langCode)}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>


      </ScrollView>
      )}

      {/* ── Group Chat Room Modal ── */}
      <Modal visible={!!activeCircle} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.chatModalContainer}>

          {/* Chat Modal Header (Matching Web 2nd SS) */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setActiveCircle(null)} style={styles.chatBackBtn}>
              <ArrowLeft size={20} color={COLORS.primary} />
            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <View style={styles.supportGroupBadge}>
                <Text style={styles.supportGroupBadgeText}>
                  {(langCode === 'hi' ? 'सहायता समूह चैट' : (langCode === 'mr' ? 'मदत गट चॅट' : 'SUPPORT GROUP CHAT')) + ' 🌸'}
                </Text>
              </View>
              <Text style={styles.chatHeaderTitle}>{getCircleName(activeCircle?.name)}</Text>
              <Text style={styles.chatHeaderSub} numberOfLines={1}>{getCircleDesc(activeCircle?.description, activeCircle?.name)}</Text>
            </View>


            <TouchableOpacity onPress={() => setActiveCircle(null)} style={styles.chatCloseBtn}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Messages Scroll Area */}
          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={{ padding: 16, gap: 14 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(msg => {
              const isMine = msg.sender.includes('You');
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.msgBubble,
                    isMine ? styles.myMsgBubble : styles.otherMsgBubble
                  ]}
                >
                  <Text style={[styles.msgSender, isMine ? styles.myMsgSender : styles.otherMsgSender]}>
                    {msg.sender}
                  </Text>
                  <Text style={[styles.msgText, isMine ? styles.myMsgText : styles.otherMsgText]}>
                    {msg.text}
                  </Text>
                  <Text style={[styles.msgTime, isMine ? styles.myMsgTime : styles.otherMsgTime]}>
                    {msg.time}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Anonymous Subheader Bar (Matching Web 2nd SS) */}
          <View style={styles.chatSubHeaderBar}>
            <View style={styles.postingAnonBadge}>
              <Text style={styles.postingAnonText}>{translate('postingAnonymously', langCode)}</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  langCode === 'hi' ? 'सर्कल छोड़ें' : (langCode === 'mr' ? 'मंडळ सोडा' : 'Leave Circle'),
                  langCode === 'hi' ? `क्या आप वाकई ${getCircleName(activeCircle?.name)} छोड़ना चाहते हैं?` : (langCode === 'mr' ? `तुम्हाला नक्की ${getCircleName(activeCircle?.name)} सोडायचे आहे का?` : `Are you sure you want to leave ${activeCircle?.name}?`),
                  [
                    { text: langCode === 'hi' ? 'रद्द करें' : (langCode === 'mr' ? 'रद्द करा' : 'Cancel'), style: 'cancel' },
                    {
                      text: langCode === 'hi' ? 'छोड़ें' : (langCode === 'mr' ? 'सोडा' : 'Leave'),
                      style: 'destructive',
                      onPress: async () => {
                        if (activeCircle.id && typeof activeCircle.id === 'string' && activeCircle.id.length > 10) {
                          try {
                            await apiClient.post(`/community/circles/${activeCircle.id}/leave`);
                            fetchCircles();
                          } catch (err) {
                            console.log('Failed to leave circle:', err.message);
                          }
                        } else {
                          setCircles(prev => prev.map(c => c.id === activeCircle.id ? { ...c, joined: false } : c));
                        }
                        setActiveCircle(null);
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.leaveCircleText}>{translate('leaveCircle', langCode)}</Text>
            </TouchableOpacity>
          </View>


          {/* Input Box Bar (Matching Web 2nd SS) */}
          <View style={styles.chatInputBar}>
            <TextInput
              style={styles.chatInput}
              placeholder={translate('postPlaceholder', langCode)}
              placeholderTextColor={COLORS.textMuted}
              value={newMessage}
              onChangeText={setNewMessage}
            />

            <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} activeOpacity={0.85}>
              <Send size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </Modal>

      {/* ── Create Circle Modal ── */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.createModalContent}>

            <View style={styles.createModalHeader}>
              <Text style={styles.createModalTitle}>Create Support Circle 🌸</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CIRCLE TITLE</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Hormonal Health Sakhis"
                placeholderTextColor={COLORS.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DESCRIPTION</Text>
              <TextInput
                style={[styles.textInput, { height: 70 }]}
                placeholder="Describe what sakhis can share in this circle..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                value={newDesc}
                onChangeText={setNewDesc}
              />
            </View>

            <TouchableOpacity style={styles.submitCircleBtn} onPress={handleCreateCircle}>
              <Text style={styles.submitCircleText}>CREATE CIRCLE NOW</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      <FloatingAIBtn navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  headerSub: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginTop: 1,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    marginBottom: 16,
    ...SHADOWS.light,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textDark,
  },
  // Privacy Promise Banner
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.white,
    marginBottom: 20,
    gap: 14,
    ...SHADOWS.light,
  },
  shieldIconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
  },
  privacySub: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 15,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  // Support Circles Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  circleCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#FCE7F3',
    ...SHADOWS.light,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 14,
    height: 28,
    marginBottom: 8,
    fontWeight: '600',
  },
  cardMembers: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 12,
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinBtn: {
    backgroundColor: '#FDF2F8',
  },
  joinBtnText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#EC4899',
    letterSpacing: 0.5,
  },
  joinedBtn: {
    backgroundColor: '#0F172A',
  },
  joinedBtnText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  // Chat Room Modal Styles (Matching Web 2nd SS 1:1)
  chatModalContainer: {
    flex: 1,
    backgroundColor: '#FFF7F8',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chatBackBtn: {
    padding: 4,
  },
  chatCloseBtn: {
    padding: 4,
  },
  supportGroupBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  supportGroupBadgeText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#EC4899',
    letterSpacing: 0.5,
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  chatHeaderSub: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  msgBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  myMsgBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#EC4899',
    borderBottomRightRadius: 4,
  },
  otherMsgBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    borderBottomLeftRadius: 4,
  },
  msgSender: {
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 3,
  },
  myMsgSender: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  otherMsgSender: {
    color: '#EC4899',
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  myMsgText: {
    color: COLORS.white,
  },
  otherMsgText: {
    color: '#15192C',
  },
  msgTime: {
    fontSize: 8,
    fontWeight: '700',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  myMsgTime: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  otherMsgTime: {
    color: '#9A8A8E',
  },
  // Subheader Bar above input box
  chatSubHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF7F8',
    borderTopWidth: 1,
    borderTopColor: '#FCE7F3',
  },
  postingAnonBadge: {
    backgroundColor: '#EC4899',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  postingAnonText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  leaveCircleText: {
    color: '#E11D48',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#FFF7F8',
    borderWidth: 1,
    borderColor: '#FCE7F3',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textDark,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  // Create Circle Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  createModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    ...SHADOWS.medium,
  },
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  createModalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.primary,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textDark,
  },
  submitCircleBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitCircleText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
