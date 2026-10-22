import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Menu, Home, BookOpen, Users, Award, Briefcase, User, LogOut, Link, PieChart, BookMarked, Gift, HelpCircle, Bot, Crown, ListTodo, Brain, Calendar } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translate } from '../utils/i18n';
import { COLORS, SHADOWS } from '../theme/theme';

export default function HeaderMenu({ navigation }) {
  const [visible, setVisible] = useState(false);
  const { role, user, logout, switchRole } = useAuth();
  const { langCode, setLanguage, LANGUAGES } = useLanguage();

  const activeRole = role ? role.toLowerCase() : 'member';
  const planLower = (user?.plan || '').toLowerCase();
  const isPremium = planLower.length > 0 && !planLower.includes('free');

  const handleNavigate = (screenName) => {
    setVisible(false);
    if (screenName === 'PartnerSakhi' && !isPremium) {
      alertPremiumUpgrade();
      return;
    }
    navigation.navigate(screenName);
  };

  const alertPremiumUpgrade = () => {
    navigation.navigate('SubscriptionPlans');
  };

  const handleLogout = async () => {
    setVisible(false);
    if (activeRole === 'partner' || activeRole === 'affiliate') {
      await switchRole('member');
    } else {
      await logout();
    }
  };

  const getMenuItems = () => {
    if (activeRole === 'affiliate' || activeRole === 'partner') {
      return [
        { label: translate('home', langCode), screen: 'PartnerDashboard', icon: Home },
        { label: translate('links', langCode), screen: 'LinkGenerator', icon: Link },
        { label: translate('earnings', langCode), screen: 'PartnerEarnings', icon: PieChart },
        { label: translate('profile', langCode), screen: 'Profile', icon: User },
      ];
    } else {
      return [
        { label: translate('home', langCode), screen: 'Dashboard', icon: Home },
        { label: translate('books', langCode), screen: 'Books', icon: BookOpen },
        { label: translate('sakhiDiary', langCode) || 'Sakhi Diary', screen: 'SakhiDiary', icon: BookMarked },
        { label: translate('todoSakhi', langCode) || 'To-Do Sakhi', screen: 'Todo', icon: ListTodo },
        { label: translate('askSakhi', langCode) || 'Ask Health Sakhi', screen: 'AskHealthSakhi', icon: Bot },
        { label: translate('community', langCode), screen: 'CommunitySakhi', icon: Users },
        { label: translate('homeBudget', langCode) || 'Home Budget Sakhi', screen: 'HomeBudget', icon: PieChart },
        { label: translate('mentalHealth', langCode) || 'Mental Health', screen: 'MentalHealth', icon: Brain },
        { label: translate('periodTracker', langCode) || 'Period Tracker', screen: 'PeriodTracker', icon: Calendar },
        { label: translate('plans', langCode) || 'Subscription Plans', screen: 'SubscriptionPlans', icon: Crown },
        { label: translate('rewards', langCode) || 'Rewards & Balance', screen: 'Rewards', icon: Gift },
        { label: translate('faq', langCode) || 'FAQ', screen: 'FAQ', icon: HelpCircle },
        { label: translate('certificate', langCode), screen: 'Certificate', icon: Award },
        { label: translate('partnerSakhi', langCode), screen: 'PartnerSakhi', icon: Briefcase },
        { label: translate('profile', langCode), screen: 'Profile', icon: User },
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <View style={styles.container}>
      <View style={styles.outerLangRow}>
        {LANGUAGES.map(lang => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.outerLangChip, langCode === lang.code && styles.activeOuterLangChip]}
            onPress={() => setLanguage(lang.code)}
          >
            <Text style={[styles.outerLangChipText, langCode === lang.code && styles.activeOuterLangChipText]}>
              {lang.code.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={() => setVisible(true)} style={styles.triggerButton} activeOpacity={0.7}>
        <Menu size={22} color={COLORS.primary} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <View style={styles.dropdownContainer}>
            {menuItems.map((item, idx) => {
              const IconComp = item.icon;
              const isLockedPartner = item.screen === 'PartnerSakhi' && !isPremium;

              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.menuItem}
                  onPress={() => handleNavigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <IconComp size={16} color={isLockedPartner ? COLORS.textMuted : COLORS.primary} style={styles.menuIcon} />
                  <Text style={[styles.menuItemText, isLockedPartner ? styles.lockedText : null]}>
                    {isLockedPartner ? `${item.label} 🔒` : item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            
            <View style={styles.divider} />

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <LogOut size={16} color={COLORS.rose} style={styles.menuIcon} />
              <Text style={styles.logoutText}>{translate('logout', langCode)}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  triggerButton: {
    padding: 8,
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  dropdownContainer: {
    marginTop: 65,
    marginRight: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 8,
    width: 200,
    borderWidth: 1,
    borderColor: COLORS.softPink,
    ...SHADOWS.medium,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  lockedText: {
    color: COLORS.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.softPink,
    marginVertical: 4,
  },
  logoutItem: {
    marginTop: 2,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.rose,
  },
  outerLangRow: {
    flexDirection: 'row',
    marginRight: 4,
    gap: 4,
  },
  outerLangChip: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  activeOuterLangChip: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  outerLangChipText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primary,
  },
  activeOuterLangChipText: {
    color: COLORS.white,
  },
});
