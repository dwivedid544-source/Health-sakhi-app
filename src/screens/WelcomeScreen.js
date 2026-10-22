import React, { useEffect, useRef, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import { useLanguage } from '../context/LanguageContext';
import IntroAIBotModal from '../components/IntroAIBotModal';
import DraggableIntroAIBtn from '../components/DraggableIntroAIBtn';



const WEB_HOST = 'https://healthsakhis.kiaansoftware.com';

const WELLNESS_BOOKS = [
  {
    id: '1',
    title: 'Life After Shaadi',
    image: `${WEB_HOST}/Images/HS%20LIFE%20AFTRE%20SHAADI%20COVER.png`,
  },
  {
    id: '2',
    title: 'Men-O-Pause',
    image: `${WEB_HOST}/Images/HS%20MENOPAUSE.png`,
  },
  {
    id: '3',
    title: 'Beauty Without Parlour',
    image: `${WEB_HOST}/Images/final%20cover%20beauty%20without%20parlour.png`,
  },
  {
    id: '4',
    title: 'How to Read Your Husband',
    image: `${WEB_HOST}/Images/HS%20HOW%20TO%20READ%20HUSBAND%20COVE%20R.png`,
  },
  {
    id: '5',
    title: 'How to Read Woman Like a Poem',
    image: `${WEB_HOST}/Images/HOW%20TO%20READ%20WOMAN%20LIKE%20A%20POEM.png`,
  },
  {
    id: '6',
    title: '100 Operations',
    image: `${WEB_HOST}/Images/100%20operations.png`,
  },
  {
    id: '7',
    title: 'Heart to Heart',
    image: `${WEB_HOST}/Images/heart%20to%20heart.png`,
  },
  {
    id: '8',
    title: 'Fountain of Family',
    image: `${WEB_HOST}/Images/final%20cover%20fountain%20of%20family.png`,
  },
  {
    id: '9',
    title: 'PCOD Management',
    image: `${WEB_HOST}/Images/final%20pcod%20book%20cover.png`,
  },
  {
    id: '10',
    title: 'Weight Loss Guide',
    image: `${WEB_HOST}/Images/final%20wt%20loss%20book%20cover.png`,
  },
];

export default function WelcomeScreen({ navigation }) {
  const marqueeRef = useRef(null);
  const scrollX = useRef(0);
  const { langCode } = useLanguage();
  const [showIntroBot, setShowIntroBot] = useState(false);


  useEffect(() => {
    // Automatic horizontal marquee loop for book cards
    const marqueeTimer = setInterval(() => {
      if (marqueeRef.current) {
        scrollX.current += 0.8;
        const itemWidth = 97; // 85 card width + 12 gap
        const limit = WELLNESS_BOOKS.length * itemWidth;
        if (scrollX.current >= limit) {
          scrollX.current = 0;
        }
        marqueeRef.current.scrollTo({ x: scrollX.current, animated: false });
      }
    }, 25);

    return () => clearInterval(marqueeTimer);
  }, []);

  return (
    <ImageBackground
      source={require('../../assets/landing-bg.jpeg')}
      style={styles.bg}
      resizeMode="cover"
    >
      {/* Light subtle overlay so colorful background clouds & stars shine through brightly */}
      <View style={styles.bgTint} />
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Brand Header */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.jpeg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>HEALTH SAKHI</Text>
            <Text style={styles.subtitle}>Family Wellness</Text>


            {/* Sakhi Group Photo - Direct & Transparent (No White Card Box) */}
            <View style={styles.groupWrapper}>
              <Image
                source={require('../../assets/sakhis-group.png')}
                style={styles.groupImageDirect}
                resizeMode="contain"
              />
              <View style={styles.groupPillBadge}>
                <Text style={styles.groupPillText}>🌸 Joined by 10,000+ Happy Sakhis</Text>
              </View>
            </View>
          </View>

          {/* Compact Wellness Books Library Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.emojiBg}>
                <Text style={styles.emojiText}>📚</Text>
              </View>
              <Text style={styles.cardTitle}>WELLNESS BOOKS LIBRARY</Text>
              <Text style={styles.cardDesc}>
                Access 20+ wellness guides with audio support in English, Hindi & Marathi.
              </Text>
            </View>

            {/* Automatic Scrolling Book Cards Marquee */}
            <View style={styles.scrollWrapper}>
              <ScrollView
                ref={marqueeRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={true}
                contentContainerStyle={styles.booksScrollContent}
              >
                {[...WELLNESS_BOOKS, ...WELLNESS_BOOKS, ...WELLNESS_BOOKS].map((book, i) => (
                  <View key={`${book.id}-${i}`} style={styles.bookCard}>
                    <Image
                      source={{ uri: book.image }}
                      style={styles.bookCover}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.loginButton]}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <Text style={styles.loginText}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.signupButton]}
              onPress={() => navigation.navigate('Signup')}
              activeOpacity={0.85}
            >
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Floating AI Intro Bot Button */}
      <DraggableIntroAIBtn onPress={() => setShowIntroBot(true)} />


      {/* Intro AI Bot Modal */}
      <IntroAIBotModal
        visible={showIntroBot}
        onClose={() => setShowIntroBot(false)}
        langCode={langCode}
      />

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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    marginTop: 4,
    alignItems: 'center',
    width: '100%',
  },
  logoImage: {
    width: 68,
    height: 68,
    marginBottom: 2,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(233, 30, 99, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 1.5,
    marginTop: 1,
    textTransform: 'uppercase',
  },
  // Sakhi Group Direct Floating Wrapper (No White Card Box)
  groupWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 0,
  },
  groupImageDirect: {
    width: '100%',
    height: 270,
  },
  groupPillBadge: {
    backgroundColor: 'rgba(123, 31, 162, 0.90)',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: -14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  groupPillText: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Compact Main Card
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(123, 31, 162, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingVertical: 10,
    marginVertical: 4,
    shadowColor: '#7B1FA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  emojiBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#7B1FA2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  emojiText: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7B1FA2',
    textAlign: 'center',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardDesc: {
    fontSize: 11.5,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  // Scrollable Books (Smaller & Sleeker)
  scrollWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  booksScrollContent: {
    paddingHorizontal: 12,
    gap: 12,
  },
  bookCard: {
    width: 85,
    height: 125,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  bookCover: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 10,
    gap: SPACING.xs,
  },
  button: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
  },
  loginText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  partnerButton: {
    backgroundColor: '#0F172A',
  },
  partnerText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  signupButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  signupText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});




