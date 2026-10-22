import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Modal, Animated, Easing 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brain, Smile, TrendingUp, AlertTriangle, Wind, Sparkles, MessageSquare, Bot, Play, Pause, RefreshCw, X } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { translate } from '../utils/i18n';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import FloatingAIBtn from '../components/FloatingAIBtn';

const QUIZ_QUESTIONS = [
  { id: 1, q: 'How often have you felt nervous, anxious, or on edge?' },
  { id: 2, q: 'How often have you been unable to stop or control worrying?' },
  { id: 3, q: 'How often have you felt little interest or pleasure in doing things?' },
  { id: 4, q: 'How often have you felt down, depressed, or hopeless?' },
  { id: 5, q: 'Overall, how would you rate your emotional wellbeing today?' },
];

const OPTIONS = [
  { label: 'Not at all', score: 0 },
  { label: 'Several days', score: 1 },
  { label: 'More than half the days', score: 2 },
  { label: 'Nearly every day', score: 3 },
];

// 4-7-8 Breathing phases
const BREATH_PHASES = [
  { name: 'Inhale', duration: 4, instruction: 'Inhale deeply through your nose...', color: '#EC4899', scale: 1.35 },
  { name: 'Hold', duration: 7, instruction: 'Hold your breath gently...', color: '#9333EA', scale: 1.35 },
  { name: 'Exhale', duration: 8, instruction: 'Exhale slowly through your mouth...', color: '#2563EB', scale: 0.8 },
];

export default function MentalHealthScreen({ navigation }) {
  const { langCode } = useLanguage();
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  // Breathing state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathRunning, setBreathRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(BREATH_PHASES[0].duration);
  const [completedCycles, setCompletedCycles] = useState(0);

  const circleScale = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  // Clear timer
  const stopBreathingTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Start / stop breathing loop
  useEffect(() => {
    if (!breathRunning) {
      stopBreathingTimer();
      return;
    }

    const currentPhaseObj = BREATH_PHASES[phaseIndex];
    // Trigger animation
    Animated.timing(circleScale, {
      toValue: currentPhaseObj.scale,
      duration: currentPhaseObj.duration * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setPhaseIndex(pIdx => {
            const nextIdx = (pIdx + 1) % BREATH_PHASES.length;
            if (nextIdx === 0) {
              setCompletedCycles(c => c + 1);
            }
            setSecondsLeft(BREATH_PHASES[nextIdx].duration);
            return nextIdx;
          });
          return BREATH_PHASES[(phaseIndex + 1) % BREATH_PHASES.length].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => stopBreathingTimer();
  }, [breathRunning, phaseIndex]);

  const handleStartBreathing = () => {
    setBreathingActive(true);
    setPhaseIndex(0);
    setSecondsLeft(BREATH_PHASES[0].duration);
    setCompletedCycles(0);
    setBreathRunning(true);
  };

  const handleCloseBreathing = () => {
    stopBreathingTimer();
    setBreathRunning(false);
    setBreathingActive(false);
    circleScale.setValue(1);
  };

  const handleSelectOption = (questionId, optionScore) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionScore }));
  };

  const handleCalculateScore = () => {
    const total = Object.values(answers).reduce((acc, curr) => acc + curr, 0);
    setScore(total);
    setShowResult(true);
  };

  const getResult = () => {
    if (score <= 3) {
      return { 
        title: translate('resultBalanced', langCode) || 'Balanced & Calm', 
        color: '#10B981', 
        bg: '#ECFDF5', 
        desc: translate('resultBalancedMsg', langCode) || 'You are doing beautifully! Keep nurturing your peace.' 
      };
    }
    if (score <= 6) {
      return { 
        title: translate('resultStressed', langCode) || 'Mildly Stressed', 
        color: '#F59E0B', 
        bg: '#FEF3C7', 
        desc: translate('resultStressedMsg', langCode) || 'Some tension is building. Small self-care acts can make a big difference.' 
      };
    }
    return { 
      title: translate('resultSupport', langCode) || 'Needs Support', 
      color: '#EF4444', 
      bg: '#FEE2E2', 
      desc: translate('resultSupportMsg', langCode) || 'It is okay to struggle. Please talk to someone you trust or reach out to our team.' 
    };
  };

  const currentPhase = BREATH_PHASES[phaseIndex];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.iconBg}>
              <Brain size={24} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{translate('mentalHealth', langCode) || 'Mental Health & Mindfulness'}</Text>
              <Text style={styles.headerSub}>Self-check emotional assessment & guided breathing</Text>
            </View>
          </View>
        </View>

        {/* Guided Breathing Banner */}
        <TouchableOpacity 
          style={styles.breathingCard}
          onPress={handleStartBreathing}
          activeOpacity={0.85}
        >
          <Wind size={22} color="#2563EB" />
          <View style={{ flex: 1 }}>
            <Text style={styles.breathingTitle}>{translate('guidedBreathing', langCode) || '4-7-8 Guided Box Breathing'}</Text>
            <Text style={styles.breathingSub}>{translate('startBreathingSub', langCode) || 'Tap to start a quick 1-minute calming session'}</Text>
          </View>
          <Sparkles size={18} color="#2563EB" />
        </TouchableOpacity>

        {/* Self Check Assessment Quiz */}
        <View style={styles.quizCard}>
          <Text style={styles.quizTitle}>🌸 {translate('emotionalSelfCheck', langCode) || 'Emotional Wellbeing Self-Check'}</Text>
          <Text style={styles.quizSub}>Answer all 5 questions to assess your emotional wellbeing today.</Text>

          {QUIZ_QUESTIONS.map(q => (
            <View key={q.id} style={styles.questionBlock}>
              <Text style={styles.questionText}>{q.id}. {q.q}</Text>
              <View style={styles.optionsRow}>
                {OPTIONS.map((opt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.optChip, answers[q.id] === opt.score && styles.activeOptChip]}
                    onPress={() => handleSelectOption(q.id, opt.score)}
                  >
                    <Text style={[styles.optText, answers[q.id] === opt.score && styles.activeOptText]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.submitBtn, Object.keys(answers).length < 5 && styles.submitBtnDisabled]}
            disabled={Object.keys(answers).length < 5}
            onPress={handleCalculateScore}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>{translate('calculateScore', langCode) || 'Calculate Score'}</Text>
          </TouchableOpacity>
        </View>

        {/* Result Card & Support Options */}
        {showResult && (
          <View style={[styles.resultCard, { backgroundColor: getResult().bg }]}>
            <Text style={[styles.resultTitle, { color: getResult().color }]}>{getResult().title}</Text>
            <Text style={styles.resultDesc}>{getResult().desc}</Text>

            <View style={styles.supportOptionsDivider} />

            <Text style={styles.supportHeading}>CHOOSE YOUR SUPPORT OPTION</Text>

            {/* Option 1: AI Chatbot */}
            <TouchableOpacity
              style={styles.aiOptionBtn}
              onPress={() => navigation.navigate('AISakhi')}
              activeOpacity={0.85}
            >
              <Bot size={18} color={COLORS.white} />
              <View style={{ flex: 1 }}>
                <Text style={styles.aiOptionTitle}>{translate('chatWithAISakhi', langCode) || 'Chat with AI Sakhi'}</Text>
                <Text style={styles.aiOptionSub}>Instant AI wellness companion for general guidance</Text>
              </View>
            </TouchableOpacity>

            {/* Option 2: Ask Health Sakhi (Personal Consultation Thread) */}
            <TouchableOpacity
              style={styles.doctorOptionBtn}
              onPress={() => navigation.navigate('AskHealthSakhi')}
              activeOpacity={0.85}
            >
              <MessageSquare size={18} color="#2563EB" />
              <View style={{ flex: 1 }}>
                <Text style={styles.doctorOptionTitle}>{translate('askHealthSakhiTitle', langCode) || 'Ask Health Sakhi'}</Text>
                <Text style={styles.doctorOptionSub}>Personal Consultation Thread with Doctor/Support</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Guided Breathing Modal */}
      <Modal visible={breathingActive} transparent animationType="fade" onRequestClose={handleCloseBreathing}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalTopRow}>
              <Text style={styles.modalTitle}>{translate('relaxAndBreathe', langCode) || 'Relax & Breathe 🌸'}</Text>
              <TouchableOpacity onPress={handleCloseBreathing} style={styles.closeIconBtn}>
                <X size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.phaseInstruction, { color: currentPhase.color }]}>
              {currentPhase.instruction}
            </Text>

            <Animated.View style={[styles.circleGraphic, { transform: [{ scale: circleScale }], borderColor: currentPhase.color }]}>
              <Text style={[styles.timerCountText, { color: currentPhase.color }]}>{secondsLeft}s</Text>
              <Text style={styles.phaseLabelText}>{currentPhase.name}</Text>
            </Animated.View>

            <Text style={styles.cyclesText}>Completed Cycles: {completedCycles}</Text>

            {/* Modal Controls */}
            <View style={styles.modalControlsRow}>
              <TouchableOpacity 
                style={styles.controlBtn}
                onPress={() => setBreathRunning(!breathRunning)}
              >
                {breathRunning ? (
                  <>
                    <Pause size={16} color={COLORS.white} />
                    <Text style={styles.controlBtnText}>Pause</Text>
                  </>
                ) : (
                  <>
                    <Play size={16} color={COLORS.white} />
                    <Text style={styles.controlBtnText}>Resume</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.controlBtn, { backgroundColor: COLORS.primary }]}
                onPress={handleCloseBreathing}
              >
                <Text style={styles.controlBtnText}>Close Session</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 30, 90, 0.08)',
    ...SHADOWS.light,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  breathingCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  breathingTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E40AF',
  },
  breathingSub: {
    fontSize: 10,
    color: '#3B82F6',
    marginTop: 2,
    fontWeight: '600',
  },
  quizCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 30, 90, 0.08)',
    gap: 14,
    ...SHADOWS.light,
  },
  quizTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
  },
  quizSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
  },
  questionBlock: {
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  questionText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeOptChip: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  optText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  activeOptText: {
    color: COLORS.white,
  },
  submitBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },
  resultCard: {
    borderRadius: 20,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  resultDesc: {
    fontSize: 12,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
  supportOptionsDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 4,
  },
  supportHeading: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  aiOptionBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiOptionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.white,
  },
  aiOptionSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
  },
  doctorOptionBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  doctorOptionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E40AF',
  },
  doctorOptionSub: {
    fontSize: 10,
    color: '#3B82F6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    width: '90%',
    alignItems: 'center',
    gap: 16,
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  closeIconBtn: {
    padding: 4,
  },
  phaseInstruction: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  circleGraphic: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FDF2F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  timerCountText: {
    fontSize: 28,
    fontWeight: '900',
  },
  phaseLabelText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  cyclesText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  modalControlsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  controlBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
