import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Image, Modal, ImageBackground, Alert
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import IntroAIBotModal from '../components/IntroAIBotModal';
import DraggableIntroAIBtn from '../components/DraggableIntroAIBtn';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';



export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { langCode, setLanguage, LANGUAGES } = useLanguage();
  const [showIntroBot, setShowIntroBot] = useState(false);
  const [email, setEmail] = useState('member@gmail.com');

  const [password, setPassword] = useState('member123');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal to pick Sakhi vs Partner Sakhi login option
  const [showRoleModal, setShowRoleModal] = useState(false);

  const handleOpenRoleModal = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail || !password.trim()) {
      Alert.alert(
        langCode === 'hi' ? 'त्रुटि' : (langCode === 'mr' ? 'त्रुटी' : 'Error'),
        langCode === 'hi' ? 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें।' : (langCode === 'mr' ? 'कृपया ईमेल आणि पासवर्ड दोन्ही प्रविष्ट करा.' : 'Please enter both email and password.')
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      Alert.alert(
        langCode === 'hi' ? 'त्रुटि' : (langCode === 'mr' ? 'त्रुटी' : 'Error'),
        langCode === 'hi' ? 'कृपया एक मान्य ईमेल पता दर्ज करें।' : (langCode === 'mr' ? 'कृपया वैध ईमेल पत्ता प्रविष्ट करा.' : 'Please enter a valid email address.')
      );
      return;
    }

    setLoading(true);
    // Log in as member first under-the-hood to verify details and read plan
    const result = await login(cleanEmail, password, 'member');
    setLoading(false);

    if (result.success) {
      const loggedUser = result.user;
      const planBadge = (loggedUser?.plan || '').toLowerCase();
      // Premium Sakhi is the Partner
      const isPremium = planBadge.length > 0 && !planBadge.includes('free');

      if (isPremium) {
        setShowRoleModal(true);
      } else {
        // Direct member login, show success and navigate
        Alert.alert(
          langCode === 'hi' ? 'सफलता' : (langCode === 'mr' ? 'यशस्वी' : 'Success'),
          langCode === 'hi' ? 'सफलतापूर्वक लॉग इन किया गया!' : (langCode === 'mr' ? 'यशस्वीरित्या लॉग इन केले!' : 'Logged in successfully!')
        );
      }
    } else {
      Alert.alert(
        langCode === 'hi' ? 'त्रुटि' : (langCode === 'mr' ? 'त्रुटी' : 'Error'),
        result.message || (langCode === 'hi' ? 'लॉगिन विफल रहा।' : (langCode === 'mr' ? 'लॉगिन अयशस्वी झाले.' : 'Login failed. Please check your credentials.'))
      );
    }
  };

  const handleLoginWithRole = async (targetRole) => {
    setShowRoleModal(false);
    if (targetRole === 'partner') {
      await switchRole('partner');
      Alert.alert(
        langCode === 'hi' ? 'सफलता' : (langCode === 'mr' ? 'यशस्वी' : 'Success'),
        langCode === 'hi' ? 'पार्टनर के रूप में लॉग इन किया गया!' : (langCode === 'mr' ? 'पार्टनर म्हणून लॉग इन केले!' : 'Logged in as Partner!')
      );
    } else {
      // Already logged in under-the-hood as member
      Alert.alert(
        langCode === 'hi' ? 'सफलता' : (langCode === 'mr' ? 'यशस्वी' : 'Success'),
        langCode === 'hi' ? 'सफलतापूर्वक लॉग इन किया गया!' : (langCode === 'mr' ? 'यशस्वीरित्या लॉग इन केले!' : 'Logged in successfully!')
      );
    }
  };


  return (
    <ImageBackground 
      source={require('../../assets/landing-bg.jpeg')} 
      style={styles.bg} 
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backButtonText}>{langCode === 'hi' ? '← पीछे' : (langCode === 'mr' ? '← मागे' : '← Back')}</Text>
              </TouchableOpacity>

              {/* Language Selector chips top right */}
              <View style={styles.langSelectorRow}>
                {LANGUAGES.map(lang => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.langChip, langCode === lang.code && styles.activeLangChip]}
                    onPress={() => setLanguage(lang.code)}
                  >
                    <Text style={[styles.langChipText, langCode === lang.code && styles.activeLangChipText]}>
                      {lang.code.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Image 
                source={require('../../assets/logo.jpeg')} 
                style={styles.logoImage} 
                resizeMode="contain" 
              />
              <Text style={styles.title}>{langCode === 'hi' ? 'आपका स्वागत है' : (langCode === 'mr' ? 'तुमचे स्वागत आहे' : 'Welcome Back')}</Text>
              <Text style={styles.subtitle}>{langCode === 'hi' ? 'अपने हेल्थसखी खाते में साइन इन करें' : (langCode === 'mr' ? 'तुमच्या हेल्थसखी खात्यात साइन इन करा' : 'Sign in to your HealthSakhi account')}</Text>
            </View>


            {/* Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{langCode === 'hi' ? 'ईमेल पता' : (langCode === 'mr' ? 'ईमेल पत्ता' : 'Email Address')}</Text>
                <TextInput 
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="aditi@example.com"
                  placeholderTextColor={COLORS.grayMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{langCode === 'hi' ? 'पासवर्ड' : (langCode === 'mr' ? 'पासवर्ड' : 'Password')}</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput 
                    style={[styles.input, { flex: 1, borderBottomWidth: 0, marginBottom: 0 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.grayMuted}
                    secureTextEntry={secureText}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity 
                    onPress={() => setSecureText(!secureText)}
                    style={styles.eyeButton}
                  >
                    <Text style={styles.eyeText}>
                      {secureText 
                        ? (langCode === 'hi' ? 'दिखाएं' : (langCode === 'mr' ? 'दाखवा' : 'Show')) 
                        : (langCode === 'hi' ? 'छिपाएं' : (langCode === 'mr' ? 'लपवा' : 'Hide'))}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>


              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
                </View>
              ) : null}

              {successMsg ? (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>✅ {successMsg}</Text>
                </View>
              ) : null}

              <TouchableOpacity 
                style={styles.loginBtn}
                onPress={handleOpenRoleModal}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.loginBtnText}>{langCode === 'hi' ? 'लॉग इन' : (langCode === 'mr' ? 'लॉग इन' : 'Log In')}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signupPrompt}>
                <Text style={styles.noAccountText}>{langCode === 'hi' ? 'खाता नहीं है?' : (langCode === 'mr' ? 'खाते नाही?' : "Don't have an account?")}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                  <Text style={styles.linkText}>{langCode === 'hi' ? 'यहाँ रजिस्टर करें' : (langCode === 'mr' ? 'येथे नोंदणी करा' : 'Register here')}</Text>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* Role Selection Modal on Log In */}
        <Modal visible={showRoleModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              
              <Text style={styles.modalBadge}>{langCode === 'hi' ? 'डैशबोर्ड पोर्टल चुनें' : (langCode === 'mr' ? 'डॅशबोर्ड पोर्टल निवडा' : 'CHOOSE DASHBOARD PORTAL')}</Text>
              <Text style={styles.modalTitle}>{langCode === 'hi' ? 'आप कैसे प्रवेश करना चाहेंगे?' : (langCode === 'mr' ? 'तुम्हाला कसे प्रवेश करायला आवडेल?' : 'How would you like to enter?')}</Text>
              <Text style={styles.modalSub}>
                {langCode === 'hi' ? 'सखी या पार्टनर सखी के रूप में लॉग इन करने के लिए समान क्रेडेंशियल्स का उपयोग करें:' : (langCode === 'mr' ? 'सखी किंवा भागीदार सखी म्हणून लॉग इन करण्यासाठी समान क्रेडेंशियल वापरा:' : 'Use the same credentials to log in as a Sakhi or Partner Sakhi:')}
              </Text>

              <TouchableOpacity 
                style={styles.roleChoiceBtnSakhi}
                onPress={() => handleLoginWithRole('member')}
              >
                <Text style={styles.roleChoiceTitleSakhi}>{langCode === 'hi' ? '🌸 सखी लॉग इन' : (langCode === 'mr' ? '🌸 सखी लॉग इन' : '🌸 Sakhi Log In')}</Text>
                <Text style={styles.roleChoiceSubSakhi}>{langCode === 'hi' ? 'वेलनेस बुक्स, एआई सखी और कम्युनिटी का उपयोग करें' : (langCode === 'mr' ? 'वेलनेस बुक्स, एआय सखी आणि कम्युनिटीमध्ये प्रवेश करा' : 'Access Wellness Books, AI Sakhi & Community')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.roleChoiceBtnPartner}
                onPress={() => handleLoginWithRole('partner')}
              >
                <Text style={styles.roleChoiceTitlePartner}>{langCode === 'hi' ? '💼 पार्टनर सखी लॉग इन' : (langCode === 'mr' ? '💼 पार्टनर सखी लॉग इन' : '💼 Partner Sakhi Log In')}</Text>
                <Text style={styles.roleChoiceSubPartner}>{langCode === 'hi' ? 'प्रशिक्षण, रेफरल लिंक और कमाई का उपयोग करें' : (langCode === 'mr' ? 'प्रशिक्षण, रेफरल लिंक्स आणि कमाईमध्ये प्रवेश करा' : 'Access Training, Referral Links & Earnings')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setShowRoleModal(false)}
              >
                <Text style={styles.cancelBtnText}>{langCode === 'hi' ? 'रद्द करें' : (langCode === 'mr' ? 'रद्द करा' : 'Cancel')}</Text>
              </TouchableOpacity>


             </View>
          </View>
        </Modal>

        {/* Floating AI Intro Bot Button */}
        <DraggableIntroAIBtn onPress={() => setShowIntroBot(true)} />


        {/* Intro AI Bot Modal */}
        <IntroAIBotModal
          visible={showIntroBot}
          onClose={() => setShowIntroBot(false)}
          langCode={langCode}
        />

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SPACING.md,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: SPACING.xs,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  langSelectorRow: {
    position: 'absolute',
    right: 0,
    top: 0,
    flexDirection: 'row',
    gap: 4,
  },
  langChip: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  activeLangChip: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  langChipText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primary,
  },
  activeLangChipText: {
    color: COLORS.white,
  },
  logoImage: {
    width: 60,
    height: 60,
    marginTop: 20,
    marginBottom: SPACING.xs,
    borderRadius: 30,
  },
  title: {

    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.md,
    ...SHADOWS.medium,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    borderBottomWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 14,
    color: COLORS.textDark,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderColor: COLORS.border,
  },
  eyeButton: {
    padding: SPACING.xs,
  },
  eyeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    padding: 10,
    borderRadius: 10,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: '#D8000C',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: '#EAF7EA',
    padding: 10,
    borderRadius: 10,
    marginBottom: SPACING.md,
  },
  successText: {
    color: '#270',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  loginBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.light,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  noAccountText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  linkText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  // Role Selection Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    width: '100%',
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.medium,
  },
  modalBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 20,
  },
  roleChoiceBtnSakhi: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  roleChoiceTitleSakhi: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
  },
  roleChoiceSubSakhi: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  roleChoiceBtnPartner: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  roleChoiceTitlePartner: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.white,
  },
  roleChoiceSubPartner: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  cancelBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.grayMuted,
  },
});
