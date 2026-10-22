import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MessageSquare, Calendar, PieChart, User, Users, Link, BookOpen, Sun, Award, Briefcase, HeartHandshake, HelpCircle, Bot, ListTodo, Brain } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translate } from '../utils/i18n';
import { COLORS } from '../theme/theme';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AISakhiScreen from '../screens/AISakhiScreen';
import PeriodTrackerScreen from '../screens/PeriodTrackerScreen';
import HomeBudgetScreen from '../screens/HomeBudgetScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SpiritualScreen from '../screens/SpiritualScreen';
import BooksLibraryScreen from '../screens/BooksLibraryScreen';
import BookDetailScreen from '../screens/BookDetailScreen';
import RelationshipSakhiScreen from '../screens/RelationshipSakhiScreen';
import WellnessCertificateScreen from '../screens/WellnessCertificateScreen';
import PartnerSakhiTabScreen from '../screens/PartnerSakhiTabScreen';
import HeaderMenu from '../components/HeaderMenu';

// Member Feature Screens
import SakhiDiaryScreen from '../screens/SakhiDiaryScreen';
import CommunityScreen from '../screens/CommunityScreen';
import SubscriptionPlansScreen from '../screens/SubscriptionPlansScreen';
import RewardsScreen from '../screens/RewardsScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import FAQScreen from '../screens/FAQScreen';
import AskHealthSakhiScreen from '../screens/AskHealthSakhiScreen';
import TodoScreen from '../screens/TodoScreen';
import MentalHealthScreen from '../screens/MentalHealthScreen';

// Partner Screens
import PartnerDashboardScreen from '../screens/PartnerDashboardScreen';
import LinkGeneratorScreen from '../screens/LinkGeneratorScreen';
import PartnerEarningsScreen from '../screens/PartnerEarningsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MemberStack = createNativeStackNavigator();

import { useSafeAreaInsets } from 'react-native-safe-area-context';

function MemberBooksStack() {
  return (
    <MemberStack.Navigator screenOptions={{ headerShown: false }}>
      <MemberStack.Screen name="BooksLibrary" component={BooksLibraryScreen} />
      <MemberStack.Screen name="BookDetail" component={BookDetailScreen} />
    </MemberStack.Navigator>
  );
}

function TabNavigator() {
  const { role, user } = useAuth();
  const { langCode } = useLanguage();
  const insets = useSafeAreaInsets();
  const activeRole = role ? role.toLowerCase() : 'member';

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ color, size }) => {
          const iconSize = 20;
          if (route.name === 'Dashboard' || route.name === 'PartnerDashboard') {
            return <Home color={color} size={iconSize} />;
          } else if (route.name === 'AISakhi') {
            return <MessageSquare color={color} size={iconSize} />;
          } else if (route.name === 'Books') {
            return <BookOpen color={color} size={iconSize} />;
          } else if (route.name === 'CommunitySakhi') {
            return <Users color={color} size={iconSize} />;
          } else if (route.name === 'FAQ') {
            return <HelpCircle color={color} size={iconSize} />;
          } else if (route.name === 'AskHealthSakhi') {
            return <Bot color={color} size={iconSize} />;
          } else if (route.name === 'Certificate') {
            return <Award color={color} size={iconSize} />;
          } else if (route.name === 'PartnerSakhi') {
            return <Briefcase color={color} size={iconSize} />;
          } else if (route.name === 'PeriodTracker') {
            return <Calendar color={color} size={iconSize} />;
          } else if (route.name === 'HomeBudget' || route.name === 'PartnerEarnings') {
            return <PieChart color={color} size={iconSize} />;
          } else if (route.name === 'Spiritual' || route.name === 'MentalHealth') {
            return <Brain color={color} size={iconSize} />;
          } else if (route.name === 'Todo') {
            return <ListTodo color={color} size={iconSize} />;
          } else if (route.name === 'LinkGenerator') {
            return <Link color={color} size={iconSize} />;
          } else if (route.name === 'Profile') {
            return <User color={color} size={iconSize} />;
          }
        },
        headerStyle: {
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTintColor: COLORS.primary,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 16,
        },
        headerRight: () => (
          <HeaderMenu navigation={navigation} />
        ),
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 60 + (insets.bottom > 0 ? insets.bottom - 4 : 0),
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 6,
        },
      })}
    >
      {activeRole === 'affiliate' || activeRole === 'partner' ? (
        <>
          <Tab.Screen 
            name="PartnerDashboard" 
            component={PartnerDashboardScreen} 
            options={{ title: translate('dashboard', langCode), tabBarLabel: translate('home', langCode) }}
          />
          <Tab.Screen 
            name="LinkGenerator" 
            component={LinkGeneratorScreen} 
            options={{ title: translate('links', langCode), tabBarLabel: translate('links', langCode) }}
          />
          <Tab.Screen 
            name="PartnerEarnings" 
            component={PartnerEarningsScreen} 
            options={{ title: translate('earnings', langCode), tabBarLabel: translate('earnings', langCode) }}
          />
        </>
      ) : (
        <>
          <Tab.Screen 
            name="Dashboard" 
            component={DashboardScreen} 
            options={{ title: translate('dashboard', langCode), tabBarLabel: translate('home', langCode) }}
          />
          <Tab.Screen 
            name="Books" 
            component={MemberBooksStack} 
            options={{ 
              title: translate('books', langCode), 
              tabBarLabel: translate('books', langCode),
              headerShown: false,
            }}
          />
          <Tab.Screen 
            name="CommunitySakhi" 
            component={CommunityScreen} 
            options={{ title: translate('community', langCode), tabBarLabel: translate('community', langCode) }}
          />
          <Tab.Screen 
            name="FAQ" 
            component={FAQScreen} 
            options={{ title: translate('faq', langCode) || 'FAQ', tabBarLabel: translate('faq', langCode) || 'FAQ' }}
          />
          <Tab.Screen 
            name="AskHealthSakhi" 
            component={AskHealthSakhiScreen} 
            options={{ title: translate('askSakhi', langCode) || 'Ask Sakhi', tabBarLabel: translate('askSakhi', langCode) || 'Ask Sakhi' }}
          />
        </>
      )}
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: translate('profile', langCode), tabBarLabel: translate('profile', langCode) }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.secondary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="App" component={TabNavigator} />
            <Stack.Screen name="AISakhi" component={AISakhiScreen} />
            <Stack.Screen name="RelationshipSakhi" component={RelationshipSakhiScreen} />
            <Stack.Screen name="SakhiDiary" component={SakhiDiaryScreen} />
            <Stack.Screen name="Community" component={CommunityScreen} />
            <Stack.Screen name="SubscriptionPlans" component={SubscriptionPlansScreen} />
            <Stack.Screen name="Rewards" component={RewardsScreen} />
            <Stack.Screen name="Receipts" component={ReceiptsScreen} />
            <Stack.Screen name="FAQ" component={FAQScreen} />
            <Stack.Screen name="AskHealthSakhi" component={AskHealthSakhiScreen} />
            <Stack.Screen name="PeriodTracker" component={PeriodTrackerScreen} />
            <Stack.Screen name="HomeBudget" component={HomeBudgetScreen} />
            <Stack.Screen name="Spiritual" component={SpiritualScreen} />
            <Stack.Screen name="MentalHealth" component={MentalHealthScreen} />
            <Stack.Screen name="Todo" component={TodoScreen} />
            <Stack.Screen name="Certificate" component={WellnessCertificateScreen} />
            <Stack.Screen name="PartnerSakhi" component={PartnerSakhiTabScreen} />
            <Stack.Screen name="BookDetail" component={BookDetailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
