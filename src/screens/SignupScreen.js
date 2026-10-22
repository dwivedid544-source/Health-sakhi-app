import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Modal, ImageBackground, Alert, Image
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import memberApi from '../api/memberApi';
import DISCLAIMER_TEXT from '../constants/disclaimerText';

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();
  const { langCode, setLanguage, LANGUAGES } = useLanguage();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  
  // Dynamic Plans State
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plan, setPlan] = useState('Free Sakhi');
  const [showDropdown, setShowDropdown] = useState(false);

  // Consent & Modal State
  const [agree, setAgree] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [disclaimerLang, setDisclaimerLang] = useState(langCode || 'en');
  const [loading, setLoading] = useState(false);

  // Sync disclaimerLang with active langCode when langCode changes
  useEffect(() => {
    if (langCode) {
      setDisclaimerLang(langCode);
    }
  }, [langCode]);

  // Fetch subscription plans dynamically from database/API
  useEffect(() => {
    let isMounted = true;
    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        const res = await memberApi.getPlans();
        if (res && res.success && res.plans && Array.isArray(res.plans)) {
          const activePlans = res.plans
            .filter(p => p.status === 'ACTIVE' || !p.status)
            .sort((a, b) => Number(a.price || 0) - Number(b.price || 0));

          if (isMounted && activePlans.length > 0) {
            setPlans(activePlans);
            // Default to first active plan if current plan not found
            setPlan(prev => {
              const found = activePlans.find(p => p.name === prev);
              return found ? prev : activePlans[0].name;
            });
          }
        }
      } catch (err) {
        console.error('Error fetching plans in SignupScreen:', err);
      } finally {
        if (isMounted) setPlansLoading(false);
      }
    };
    fetchPlans();
    return () => { isMounted = false; };
  }, []);

  const handleSignupSubmit = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanPhone || !cleanEmail || !cleanPassword) {
      Alert.alert(
        langCode === 'hi' ? 'त्रुटि' : (langCode === 'mr' ? 'त्रुटी' : 'Error'),
        langCode === 'hi' ? 'कृपया सभी फ़ील्ड भरें।' : (langCode === 'mr' ? 'कृपया सर्व फील्ड भरा.' : 'Please fill in all fields.')
      );
      return;
    }

    // Phone validation (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(cleanPhone)) {
      Alert.alert(
        langCode === 'hi' ? 'त्रुटि' : (langCode === 'mr' ? 'त्रुटी' : 'Error'),
        langCode === 'hi' ? 'कृपया एक मान्य 10-अंकीय फ़ोन नंबर दर्ज करें।' : (langCode === 'mr' ? 'कृपया वैध १०-अंकी फोन नंबर प्रविष्ट करा.' : 'Please enter a valid 10-digit phone number.')
      );
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      Alert.alert(
        langCode === 'hi' ? 'त्रुटि' : (langCode === 'mr' ? 'त्रुटी' : 'Error'),
        langCode === 'hi' ? 'कृपया एक मान्य ईमेल पता दर्ज करें।' : (langCode === 'mr' ? 'कृपया वैध ईमेल पत्ता प्रविष्ट करा.' : 'Please enter a valid email address.')
      );
      return;
    }

    if (cleanPassword.length < 6) {
      Alert.alert(
        langCode === 'hi' ? 'त्रुटि' : (langCode === 'mr' ? 'त्रुटी' : 'Error'),
        langCode === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : (langCode === 'mr' ? 'पासवर्ड किमान ६ अक्षरांचा असावा.' : 'Password must be at least 6 characters.')
      );
      return;
    }

    // Strict check: User must formally accept terms inside modal
    if (!agree) {
      Alert.alert(
        langCode === 'hi' ? 'शर्तें स्वीकार करें' : (langCode === 'mr' ? 'अटी स्वीकारा' : 'Terms Required'),
        langCode === 'hi'
          ? 'आगे बढ़ने के लिए कृपया सेवा की शर्तों और गोपनीयता नीति को स्वीकार करें।'
          : (langCode === 'mr'
            ? 'पुढे जाण्यासाठी कृपया सेवा अटी आणि गोपनीयता धोरण स्वीकारा.'
            : 'Please open and accept the Terms of Service & Privacy Policy to proceed.'),
        [
          {
            text: langCode === 'hi' ? 'शर्तें देखें' : (langCode === 'mr' ? 'अटी पहा' : 'View Terms'),
            onPress: () => setShowTermsModal(true)
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    try {
      setLoading(true);
      const res = await signup({
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        password: cleanPassword,
        role: 'member',
        plan: plan
      });

      if (res.success) {
        Alert.alert(
          langCode === 'hi' ? 'सफलता' : (langCode === 'mr' ? 'यशस्वी' : 'Success'),
          langCode === 'hi' ? 'पंजीकरण सफल! आपका क्रेडेंशियल सहेज लिया गया है।' : (langCode === 'mr' ? 'नोंदणी यशस्वी! तुमची माहिती सेव्ह झाली आहे.' : 'Registration successful! Your credentials have been saved.'),
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert(
          langCode === 'hi' ? 'त्रुटि' : (langCode === 'mr' ? 'त्रुटी' : 'Error'),
          res.message || (langCode === 'hi' ? 'पंजीकरण विफल रहा।' : (langCode === 'mr' ? 'नोंदणी अपयशी ठरली.' : 'Registration failed.'))
        );
      }
    } catch (err) {
      console.error(err);
      Alert.alert(
        langCode === 'hi' ? 'त्रुटि' : (langCode === 'mr' ? 'त्रुटी' : 'Error'),
        langCode === 'hi' ? 'पंजीकरण विफल रहा।' : (langCode === 'mr' ? 'नोंदणी अपयशी ठरली.' : 'Registration failed.')
      );
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    if (disclaimerLang === 'hi') return 'सेवा की शर्तें और गोपनीयता नीति';
    if (disclaimerLang === 'mr') return 'सेवा अटी आणि गोपनीयता धोरण';
    return 'Terms & Privacy Policy';
  };

  const getModalSubtitle = () => {
    if (disclaimerLang === 'hi') return 'कृपया ध्यान से पढ़ें';
    if (disclaimerLang === 'mr') return 'कृपया काळजीपूर्वक वाचा';
    return 'PLEASE READ CAREFULLY';
  };

  const getModalFooterNote = () => {
    if (disclaimerLang === 'hi') return 'स्वीकार करके, आप ऊपर सूचीबद्ध सभी शर्तों से सहमत होते हैं।';
    if (disclaimerLang === 'mr') return 'स्वीकार करून, आपण वरील सर्व अटींशी सहमत आहात.';
    return 'By accepting, you agree to all the terms listed above.';
  };

  const getModalAcceptText = () => {
    if (disclaimerLang === 'hi') return 'मैं स्वीकार करता हूं और सहमत हूं';
    if (disclaimerLang === 'mr') return 'मी स्वीकार करतो आणि सहमत आहे';
    return 'I ACCEPT & AGREE';
  };

  return (
    <ImageBackground 
      source={require('../../assets/landing-bg.jpeg')} 
      style={styles.bg} 
      resizeMode="cover"
    >
      <View style={styles.bgTint} />

      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header Action bar (Back & Language Selector) */}
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>{langCode === 'hi' ? '← पीछे' : (langCode === 'mr' ? '← मागे' : '← Back')}</Text>
            </TouchableOpacity>

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
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            
            {/* Main Form Card */}
            <View style={styles.card}>
              
              {/* Close Button x top right */}
              <TouchableOpacity onPress={() => navigation.navigate('Welcome')} style={styles.closeBtn}>
                <X size={18} color="#FDA4AF" />
              </TouchableOpacity>

              {/* Brand Header */}
              <View style={styles.headerBlock}>
                <Image 
                  source={require('../../assets/logo.jpeg')} 
                  style={styles.logoImage} 
                  resizeMode="contain"
                />
                <Text style={styles.brandTitle}>HealthSakhi</Text>

                <Text style={styles.brandSubtitle}>
                  {langCode === 'hi' ? 'विश्वसनीय स्वास्थ्य साथी' : (langCode === 'mr' ? 'विश्वासू आरोग्य सोबती' : 'TRUSTED WELLNESS COMPANION')}
                </Text>
              </View>

              {/* Login / Signup Tabs */}
              <View style={styles.tabsRow}>
                <TouchableOpacity 
                  style={styles.tabBtn} 
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.tabText}>{langCode === 'hi' ? 'लॉगिन' : (langCode === 'mr' ? 'लॉगिन' : 'LOGIN')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tabBtn, styles.activeTabBtn]} 
                  disabled={true}
                >
                  <Text style={[styles.tabText, styles.activeTabText]}>{langCode === 'hi' ? 'साइनअप' : (langCode === 'mr' ? 'साइनअप' : 'SIGNUP')}</Text>
                </TouchableOpacity>
              </View>

              {/* Form Input fields */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{langCode === 'hi' ? 'पूरा नाम' : (langCode === 'mr' ? 'पूर्ण नाव' : 'Full Name')}</Text>
                <TextInput 
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Jane Doe"
                  placeholderTextColor="#94A3B8"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{langCode === 'hi' ? 'फ़ोन नंबर' : (langCode === 'mr' ? 'फोन नंबर' : 'Phone Number')}</Text>
                <TextInput 
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{langCode === 'hi' ? 'ईमेल पता' : (langCode === 'mr' ? 'ईमेल पत्ता' : 'Email Address')}</Text>
                <TextInput 
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="jane@example.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{langCode === 'hi' ? 'पासवर्ड' : (langCode === 'mr' ? 'पासवर्ड' : 'Password')}</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput 
                    style={[styles.input, { flex: 1, borderBottomWidth: 0 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={secureText}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeBtn}>
                    <Text style={styles.eyeText}>
                      {secureText 
                        ? (langCode === 'hi' ? 'दिखाएं' : (langCode === 'mr' ? 'दाखवा' : 'Show')) 
                        : (langCode === 'hi' ? 'छिपाएं' : (langCode === 'mr' ? 'लपवा' : 'Hide'))}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dynamic Plan dropdown selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{langCode === 'hi' ? 'योजना चुनें' : (langCode === 'mr' ? 'योजना निवडा' : 'Choose Plan')}</Text>
                <TouchableOpacity 
                  style={styles.dropdownTrigger} 
                  onPress={() => setShowDropdown(!showDropdown)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownTriggerText}>
                    {plan}
                  </Text>
                  {plansLoading ? (
                    <ActivityIndicator size="small" color="#EC4899" />
                  ) : (
                    <Text style={styles.dropdownChevron}>▼</Text>
                  )}
                </TouchableOpacity>

                {showDropdown && (
                  <View style={styles.dropdownOptionsList}>
                    {plans.length > 0 ? (
                      plans.map((p) => (
                        <TouchableOpacity 
                          key={p.id || p.name}
                          style={[styles.dropdownOption, plan === p.name && styles.selectedDropdownOption]}
                          onPress={() => {
                            setPlan(p.name);
                            setShowDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownOptionText, plan === p.name && styles.selectedDropdownOptionText]}>
                            {p.name} {p.price > 0 ? `(₹${p.price})` : '(Free)'}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.dropdownOption}>
                        <Text style={styles.dropdownOptionText}>Free Sakhi</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Terms and conditions checkbox */}
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => {
                  if (!agree) {
                    setShowTermsModal(true);
                  } else {
                    setAgree(false);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxBox, agree && styles.checkboxBoxChecked]}>
                  {agree && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxText}>
                  {langCode === 'hi' 
                    ? 'मैंने पढ़ लिया है और मैं सेवा की शर्तों और गोपनीयता नीति से सहमत हूँ।' 
                    : (langCode === 'mr' 
                      ? 'मी वाचले आहे आणि सेवा अटी आणि गोपनीयता धोरणाशी सहमत आहे.' 
                      : 'I have read and agree to the Terms of Service and Privacy Policy')}
                </Text>
              </TouchableOpacity>

              {/* Submit Button */}
              <TouchableOpacity 
                style={[styles.submitBtn, agree ? styles.activeSubmitBtn : styles.disabledSubmitBtn]} 
                onPress={handleSignupSubmit}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {langCode === 'hi' ? 'साइनअप अनुरोध बनाएं' : (langCode === 'mr' ? 'नोंदणी विनंती तयार करा' : 'CREATE SIGNUP REQUEST')}
                  </Text>
                )}
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Terms & Privacy Policy Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{getModalTitle()}</Text>
                <Text style={styles.modalSubtitle}>{getModalSubtitle()}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowTermsModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={16} color="#EC4899" />
              </TouchableOpacity>
            </View>

            {/* Language Switcher inside Modal */}
            <View style={styles.modalLangRow}>
              <TouchableOpacity
                style={[styles.modalLangBtn, disclaimerLang === 'en' && styles.modalActiveLangBtn]}
                onPress={() => setDisclaimerLang('en')}
              >
                <Text style={[styles.modalLangBtnText, disclaimerLang === 'en' && styles.modalActiveLangBtnText]}>
                  English
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalLangBtn, disclaimerLang === 'hi' && styles.modalActiveLangBtn]}
                onPress={() => setDisclaimerLang('hi')}
              >
                <Text style={[styles.modalLangBtnText, disclaimerLang === 'hi' && styles.modalActiveLangBtnText]}>
                  हिन्दी
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalLangBtn, disclaimerLang === 'mr' && styles.modalActiveLangBtn]}
                onPress={() => setDisclaimerLang('mr')}
              >
                <Text style={[styles.modalLangBtnText, disclaimerLang === 'mr' && styles.modalActiveLangBtnText]}>
                  मराठी
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Legal Content */}
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
              <Text style={styles.disclaimerBodyText}>
                {DISCLAIMER_TEXT[disclaimerLang] || DISCLAIMER_TEXT['en']}
              </Text>
            </ScrollView>

            {/* Modal Footer / Acceptance Action */}
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterNote}>{getModalFooterNote()}</Text>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => {
                  setAgree(true);
                  setShowTermsModal(false);
                }}
                activeOpacity={0.88}
              >
                <Text style={styles.acceptBtnText}>{getModalAcceptText()}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bgTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(253, 242, 248, 0.15)',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    ...SHADOWS.medium,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
    zIndex: 10,
  },
  headerBlock: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EC4899',
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabBtn: {
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  activeTabText: {
    color: '#1E293B',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 44,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
  },
  eyeBtn: {
    padding: 8,
  },
  eyeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EC4899',
  },
  dropdownTrigger: {
    height: 44,
    borderWidth: 1.5,
    borderColor: '#EC4899',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#FFF5F7',
  },
  dropdownTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#831843',
  },
  dropdownChevron: {
    fontSize: 10,
    fontWeight: '900',
    color: '#EC4899',
  },
  dropdownOptionsList: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EC4899',
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    ...SHADOWS.light,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF1F2',
  },
  selectedDropdownOption: {
    backgroundColor: '#FFF0F3',
  },
  dropdownOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#831843',
  },
  selectedDropdownOptionText: {
    color: '#EC4899',
    fontWeight: '800',
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  activeSubmitBtn: {
    backgroundColor: '#1E293B',
    ...SHADOWS.medium,
  },
  disabledSubmitBtn: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  footerText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 4,
    gap: 10,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxBoxChecked: {
    backgroundColor: '#EC4899',
    borderColor: '#EC4899',
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
  checkboxText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    lineHeight: 15,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginTop: 10,
    marginBottom: 10,
  },
  langSelectorRow: {
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
  backButton: {
    padding: SPACING.xs,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    height: '82%',
    maxHeight: 680,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFF7F8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4B1E5A',
  },
  modalSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EC4899',
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLangRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalLangBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  modalActiveLangBtn: {
    backgroundColor: '#EC4899',
    borderColor: '#EC4899',
  },
  modalLangBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B1E5A',
    textTransform: 'uppercase',
  },
  modalActiveLangBtnText: {
    color: COLORS.white,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FDFBFB',
  },
  modalBodyContent: {
    paddingBottom: 20,
  },
  disclaimerBodyText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#334155',
    fontWeight: '500',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: COLORS.white,
    alignItems: 'center',
    gap: 10,
  },
  modalFooterNote: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  acceptBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#E91E63',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
