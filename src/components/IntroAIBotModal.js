import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, X, Sparkles } from 'lucide-react-native';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';

const SYSTEM_RESPONSES = {
  en: {
    welcome: "Namaste! 🌸 I am AI Sakhi's Intro Bot. I'm here to tell you how HealthSakhi works and what it is. Ask me anything or tap a question below!",
    suggest1: "What is HealthSakhi?",
    suggest2: "What features are inside?",
    suggest3: "How do I earn commissions?",
    suggest4: "Is my privacy secure?",
    reply1: "HealthSakhi is a premium family wellness companion designed to empower women. We provide certified clinical health books, ovulation and period trackers, spiritual wellness logs, and a supportive community.",
    reply2: "Our core features include:\n1. 📚 Wellness Books Library with multi-language audio.\n2. 📅 Period & Ovulation Trackers.\n3. 🪔 Spiritual Wellness (Gita & scripture reading).\n4. 🌸 Relationship Sakhi support groups.\n5. 🩺 Expert Advisor session booking.",
    reply3: "Our Premium plan subscribers automatically gain access to the Partner Sakhi Program. You can generate custom referral links to share wellness guides with your community and earn 15% instant commission on every referral subscription!",
    reply4: "Yes, completely! HealthSakhi guarantees absolute privacy. Inside the community support circles, all members post anonymously to ensure you can express yourself freely without judgment.",
    default: "I'm a guide bot here to help you get started. You can register for a Free account or Premium subscription to unlock the full potential of HealthSakhi! 🌸"
  },
  hi: {
    welcome: "नमस्ते! 🌸 मैं एआई सखी का गाइड बॉट हूँ। मैं यहाँ आपको बताने के लिए हूँ कि हेल्थसखी कैसे काम करती है और यह क्या है। मुझसे कुछ भी पूछें या नीचे एक प्रश्न पर टैप करें!",
    suggest1: "हेल्थसखी क्या है?",
    suggest2: "इसके अंदर क्या विशेषताएं हैं?",
    suggest3: "मैं कमीशन कैसे कमाऊं?",
    suggest4: "क्या मेरी गोपनीयता सुरक्षित है?",
    reply1: "हेल्थसखी एक प्रीमियम पारिवारिक कल्याण साथी है जिसे महिलाओं को सशक्त बनाने के लिए डिज़ाइन किया गया है। हम नैदानिक स्वास्थ्य पुस्तकें, मासिक धर्म और ओव्यूलेशन ट्रैकर्स, आध्यात्मिक कल्याण शास्त्र और एक सहायक समुदाय प्रदान करते हैं।",
    reply2: "हमारी मुख्य विशेषताएं:\n1. 📚 बहु-भाषी ऑडियो के साथ वेलनेस बुक्स लाइब्रेरी।\n2. 📅 पीरियड और ओव्यूलेशन ट्रैकर्स।\n3. 🪔 आध्यात्मिक कल्याण (गीता और शास्त्र पठन)।\n4. 🌸 रिलेशनशिप सखी सहायता समूह।\n5. 🩺 विशेषज्ञ सलाहकार सत्र बुकिंग।",
    reply3: "हमारे प्रीमियम प्लान के ग्राहक स्वचालित रूप से पार्टनर सखी कार्यक्रम का लाभ उठा सकते हैं। आप अपने समुदाय के साथ वेलनेस गाइड साझा करने के लिए कस्टम रेफरल लिंक उत्पन्न कर सकते हैं और प्रत्येक रेफरल सदस्यता पर 15% तत्काल कमीशन कमा सकते हैं!",
    reply4: "हाँ, पूरी तरह से! हेल्थसखी पूर्ण गोपनीयता की गारंटी देती है। कम्युनिटी सहायता समूहों के अंदर, सभी सदस्य गुमनाम रूप से पोस्ट करते हैं ताकि बिना किसी डर या संकोच के खुद को स्वतंत्र रूप से व्यक्त कर सकें।",
    default: "मैं आपको शुरुआत करने में मदद करने वाला एक गाइड बॉट हूँ। आप हेल्थसखी की पूरी क्षमता को अनलॉक करने के लिए फ्री अकाउंट या प्रीमियम सब्सक्रिप्शन के लिए पंजीकरण कर सकते हैं! 🌸"
  },
  mr: {
    welcome: "नमस्कार! 🌸 मी एआय सखीचा ओळख बॉट आहे. हेल्थसखी कशी काम करते आणि ती काय आहे हे सांगण्यासाठी मी येथे आहे. मला काहीही विचारा किंवा खालील प्रश्नावर टॅप करा!",
    suggest1: "हेल्थसखी काय आहे?",
    suggest2: "यामध्ये कोणती वैशिष्ट्ये आहेत?",
    suggest3: "मी कमिशन कसे कमवू?",
    suggest4: "माझी गोपनीयता सुरक्षित आहे का?",
    reply1: "हेल्थसखी हा एक विश्वासू कौटुंबिक आरोग्य सोबती आहे जो महिलांना सक्षम करण्यासाठी डिझाइन केला आहे. आम्ही क्लिनिकल वेलनेस मार्गदर्शक, मासिक पाळी ट्रॅकर्स, आध्यात्मिक कल्याण शास्त्र आणि मदत गट प्रदान करतो.",
    reply2: "आमची मुख्य वैशिष्ट्ये:\n1. 📚 ऑडिओ सहाय्यासह वेलनेस बुक्स लायब्ररी.\n2. 📅 मासिक पाळी आणि ओव्हुलेशन ट्रॅकर्स.\n3. 🪔 आध्यात्मिक कल्याण (गीता आणि शास्त्र वाचन).\n4. 🌸 रिलेशनशिप सखी कम्युनिटी (मदत गट).\n5. 🩺 तज्ज्ञ सल्लागार सत्र बुकिंग.",
    reply3: "प्रीमियम वापरकर्ते सानुकूल रेफरल दुवे तयार करण्यासाठी भागीदार सखी म्हणून लॉग इन करू शकतात. आपल्या समुदायासोबत क्लिनिकल मार्गदर्शक सामायिक करा आणि प्रत्येक रेफरल सदस्यत्वावर १५% त्वरित कमिशन मिळवा!",
    reply4: "होय, पूर्णपणे! हेल्थसखी पूर्ण गोपनीयतेची हमी देते. मदत गटांमध्ये सर्व सदस्य अनामितपणे पोस्ट करतात जेणेकरून तुम्ही कोणत्याही भीतीशिवाय स्वतःला व्यक्त करू शकाल.",
    default: "मी तुम्हाला सुरुवात करण्यात मदत करणारा एक मार्गदर्शक बॉट आहे. हेल्थसखीची पूर्ण वैशिष्ट्ये अनलॉक करण्यासाठी तुम्ही मोफत खाते किंवा प्रीमियम सदस्यत्वासाठी नोंदणी करू शकता! 🌸"
  }
};

export default function IntroAIBotModal({ visible, onClose, langCode }) {
  const currentLang = langCode || 'en';
  const dictionary = SYSTEM_RESPONSES[currentLang] || SYSTEM_RESPONSES.en;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setMessages([
        { id: 'welcome', isUser: false, text: dictionary.welcome }
      ]);
    }
  }, [visible, currentLang]);

  const handleSend = (text) => {
    const query = (text || inputText).trim();
    if (!query || loading) return;
    setInputText('');

    // Add user message
    setMessages(prev => [...prev, { id: 'usr_' + Date.now(), isUser: true, text: query }]);
    setLoading(true);

    setTimeout(() => {
      let botReply = dictionary.default;
      const lowerQuery = query.toLowerCase();

      if (lowerQuery.includes('what') || lowerQuery.includes('healthsakhi') || lowerQuery.includes('क्या') || lowerQuery.includes('काय')) {
        botReply = dictionary.reply1;
      } else if (lowerQuery.includes('feature') || lowerQuery.includes('विशेषता') || lowerQuery.includes('वैशिष्ट्ये') || lowerQuery.includes('work')) {
        botReply = dictionary.reply2;
      } else if (lowerQuery.includes('earn') || lowerQuery.includes('commission') || lowerQuery.includes('कमाई') || lowerQuery.includes('पार्टनर')) {
        botReply = dictionary.reply3;
      } else if (lowerQuery.includes('privacy') || lowerQuery.includes('secure') || lowerQuery.includes('गोपनीयता') || lowerQuery.includes('सुरक्षित')) {
        botReply = dictionary.reply4;
      }

      setMessages(prev => [...prev, { id: 'bot_' + Date.now(), isUser: false, text: botReply }]);
      setLoading(false);
    }, 800);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, loading]);

  const suggestions = [
    { text: dictionary.suggest1 },
    { text: dictionary.suggest2 },
    { text: dictionary.suggest3 },
    { text: dictionary.suggest4 }
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.chatContainer}>
          
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={styles.sparkleIconBg}>
                <Sparkles size={16} color={COLORS.white} />
              </View>
              <View>
                <Text style={styles.headerTitle}>AI Sakhi Guide</Text>
                <Text style={styles.headerSub}>Intro & Help Bot</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Messages list */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => (
              <View style={[styles.bubbleWrapper, item.isUser ? styles.myMsgWrapper : styles.botMsgWrapper]}>
                {!item.isUser && (
                  <Text style={styles.avatarLabel}>🌸</Text>
                )}
                <View style={[styles.msgBubble, item.isUser ? styles.myBubble : styles.botBubble]}>
                  <Text style={[styles.msgText, item.isUser ? styles.myMsgText : styles.botMsgText]}>
                    {item.text}
                  </Text>
                </View>
              </View>
            )}
          />

          {/* Quick suggestions pills */}
          {messages.length < 6 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
                {suggestions.map((s, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.suggestionPill}
                    onPress={() => handleSend(s.text)}
                  >
                    <Text style={styles.suggestionText}>{s.text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Typing indicator */}
          {loading && (
            <View style={styles.typingContainer}>
              <ActivityIndicator size="small" color={COLORS.secondary} />
              <Text style={styles.typingText}>Sakhi is responding...</Text>
            </View>
          )}

          {/* Input Bar */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          >
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder={currentLang === 'hi' ? 'पूछें...' : (currentLang === 'mr' ? 'विचारा...' : 'Ask Sakhi...')}
                placeholderTextColor={COLORS.textMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend()}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !inputText.trim() && styles.disabledSendBtn]}
                onPress={() => handleSend()}
                disabled={!inputText.trim() || loading}
              >
                <Send size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingBottom: Platform.OS === 'android' ? 10 : 0,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8FF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sparkleIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
  },
  headerSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
  },
  messagesList: {
    padding: SPACING.md,
    gap: 12,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '85%',
  },
  myMsgWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botMsgWrapper: {
    alignSelf: 'flex-start',
  },
  avatarLabel: {
    fontSize: 18,
    marginBottom: 2,
  },
  msgBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    ...SHADOWS.light,
  },
  myBubble: {
    backgroundColor: COLORS.secondary,
    borderBottomRightRadius: 2,
  },
  botBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  msgText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  myMsgText: {
    color: COLORS.white,
  },
  botMsgText: {
    color: COLORS.primary,
  },
  suggestionsContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#FAF5FF',
  },
  suggestionsScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  suggestionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  suggestionText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    gap: 6,
  },
  typingText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3E8FF',
    backgroundColor: COLORS.white,
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 16,
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: '#FAF8FC',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendBtn: {
    backgroundColor: '#E9D5FF',
  },
});
