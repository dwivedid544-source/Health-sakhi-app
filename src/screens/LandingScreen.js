import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, Animated, ActivityIndicator,
  ImageBackground, Modal, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Star, BookOpen, ChevronRight, Check, Play, X } from 'lucide-react-native';
import apiClient from '../api/apiClient';

const { width: W } = Dimensions.get('window');
const BACKEND = 'https://health-sakhi-production.up.railway.app';
const WEB_HOST = 'https://healthsakhis.kiaansoftware.com';

// ── Language-specific video URLs (same as web VideoModal) ─────────────────────
const VIDEO_URLS = {
  en: 'https://ik.imagekit.io/1udyzgff6/health-sakhi-english%20.mp4',
  hi: 'https://ik.imagekit.io/jcohpdmi8/health-sakhi%20(1).mp4',
  mr: 'https://ik.imagekit.io/xzmohzonk/WhatsApp%20Video%202026-07-08%20at%205.32.19%20PM.mp4',
};

const LANG_OPTIONS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', flag: '🌸' },
];

// ── Static data ───────────────────────────────────────────────────────────────
const FEATURES = [
  { emoji: '🌸', title: 'Period Tracker', desc: 'Smart cycle predictions, fertile window & ovulation tracking with beautiful calendar' },
  { emoji: '💰', title: 'Home Budget', desc: 'Manage family finances & track expenses with detailed analytics' },
  { emoji: '📚', title: 'Wellness Books', desc: '20+ curated books with audio narration in Hindi, English & Marathi' },
  { emoji: '🧘', title: 'Spiritual', desc: 'Daily meditations, affirmations & spiritual guidance for inner peace' },
  { emoji: '🤖', title: 'AI Sakhi', desc: 'Personal AI companion for health queries & personalized wellness advice' },
  { emoji: '👩‍⚕️', title: 'Expert Advisors', desc: '1-on-1 consultations with certified wellness advisors' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Mother of 2 · Delhi', avatar: 'P', color: '#E91E63', quote: 'HealthSakhi transformed how our family approaches health. The period tracker is incredibly accurate and the budget tools helped us save so much!' },
  { name: 'Sunita Devi', role: 'Homemaker · Mumbai', avatar: 'S', color: '#9C27B0', quote: 'Wellness books in Hindi with audio are amazing. My whole family benefits from the spiritual wellness section every single day.' },
  { name: 'Kavita Reddy', role: 'Professional · Hyderabad', avatar: 'K', color: '#673AB7', quote: 'AI Sakhi is like having a knowledgeable friend 24/7. Expert consultations are affordable and truly personalized to my needs.' },
];

const DEFAULT_PLANS = [
  {
    id: 'free', name: 'Free Sakhi', price: 0, duration: '1 Month', highlight: 'STARTER',
    desc: '1 Month Free Trial for all new sakhis — explore HealthSakhi with no cost!',
    features: [
      '1 Month Full Free Trial',
      'AI Sakhi Chat Bot (24/7)',
      'Full Book & Audio Library',
      'Sisterhood Community Circles',
      'Period Tracker & To-Do List & Expense Tracker Unlimited',
      'Wellness Certificate — Locked 🔒 (Upgrade Required)',
      'Partner Sakhi — Hidden 🔒 (Premium Only)',
    ], dark: false,
  },
  {
    id: 'premium', name: 'Premium Sakhi', price: 4999, originalPrice: 9999, duration: '12 Months', highlight: 'MOST POPULAR',
    desc: 'Everything unlocked — unlimited AI, Books, Community & your Wellness Certificate for a full year.',
    features: [
      'Unlimited AI Sakhi Chat Bot (24/7)',
      'Full Book & Audio Library — Unlimited Access',
      '1 Year Unlimited: Books, AI Chat, Community & Certificate',
      'Unlimited Sisterhood Community Circles',
      'Partner Sakhi — Earn Money by Referring 💰',
      'Official Verified Wellness Certificate (PDF Download)',
      'Unlimited Period Tracker & To-Do List & Expense Tracker',
    ], dark: true,
  },
];

const MARQUEE_BOOKS = [
  '/Images/heart%20to%20heart.png',
  '/Images/final%20cover%20fountain%20of%20family.png',
  '/Images/final%20pcod%20book%20cover.png',
  '/Images/final%20wt%20loss%20book%20cover.png',
  '/Images/HS%20LIFE%20AFTRE%20SHAADI%20COVER.png',
  '/Images/HS%20MENOPAUSE.png',
  '/Images/final%20cover%20beauty%20without%20parlour.png',
];

// ── Video Modal with language selector (matches web VideoModal exactly) ─────────
function VideoModal({ visible, onClose }) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center; }
    
    .player-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #000;
      position: relative;
    }
    
    /* Header Overlay */
    .header-bar {
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .badge {
      display: flex;
      align-items: center;
      gap: 5px;
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.15);
      padding: 5px 10px;
      border-radius: 20px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    
    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #E91E63;
      animation: pulse 1.5s infinite;
    }
    
    .badge-txt {
      color: #fff;
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .lang-selector {
      display: flex;
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.15);
      padding: 2px;
      border-radius: 20px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    
    .lang-btn {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 8px;
      font-weight: 700;
      color: rgba(255,255,255,0.6);
      background: transparent;
      border: none;
      outline: none;
      transition: all 0.3s;
    }
    
    .lang-btn.active {
      color: #fff;
      background: linear-gradient(90deg, #E91E63, #FF5E9B);
      box-shadow: 0 0 10px rgba(233,30,99,0.4);
    }
    
    .close-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.15);
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 14px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      outline: none;
    }
    
    @keyframes pulse {
      0% { opacity: 0.4; }
      50% { opacity: 1; }
      100% { opacity: 0.4; }
    }
  </style>
</head>
<body>
  <div class="player-container">
    <div class="header-bar">
      <div class="badge">
        <div class="badge-dot"></div>
        <div class="badge-txt">HealthSakhi Demo</div>
      </div>
      <div class="controls">
        <div class="lang-selector">
          <button class="lang-btn active" id="btn-en" onclick="switchLang('en')">ENGLISH</button>
          <button class="lang-btn" id="btn-hi" onclick="switchLang('hi')">हिंदी</button>
          <button class="lang-btn" id="btn-mr" onclick="switchLang('mr')">मराठी</button>
        </div>
        <button class="close-btn" onclick="closeModal()">✕</button>
      </div>
    </div>
    <video id="demo-video" src="${VIDEO_URLS.en}" controls autoplay playsinline></video>
  </div>

  <script>
    const urls = {
      en: "${VIDEO_URLS.en}",
      hi: "${VIDEO_URLS.hi}",
      mr: "${VIDEO_URLS.mr}"
    };
    
    let currentLang = 'en';
    const video = document.getElementById('demo-video');
    
    function switchLang(lang) {
      if (lang === currentLang) return;
      
      const currentTime = video.currentTime;
      const isPaused = video.paused;
      
      document.getElementById('btn-' + currentLang).classList.remove('active');
      document.getElementById('btn-' + lang).classList.add('active');
      
      currentLang = lang;
      video.src = urls[lang];
      video.load();
      
      video.onloadedmetadata = function() {
        video.currentTime = currentTime;
        if (!isPaused) {
          video.play().catch(e => console.log('Autoplay blocked:', e));
        }
        video.onloadedmetadata = null;
      };
    }
    
    function closeModal() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage('close');
      }
    }
  </script>
</body>
</html>`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={vm.overlay}>
        <View style={vm.container}>
          <WebView
            source={{ html }}
            style={{ flex: 1, backgroundColor: '#000' }}
            javaScriptEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            scrollEnabled={false}
            onMessage={(event) => {
              if (event.nativeEvent.data === 'close') {
                onClose();
              }
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const vm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(45,27,61,0.96)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  container: { width: '100%', aspectRatio: 16 / 9, borderRadius: 24, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', shadowColor: '#E91E63', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  brandDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#E91E63' },
  brandTxt: { color: 'rgba(255,255,255,0.9)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  langBar: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 3, gap: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  langBtn: { flex: 1, paddingVertical: 5, borderRadius: 16, alignItems: 'center' },
  langBtnActive: { backgroundColor: '#E91E63', shadowColor: '#E91E63', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 3 },
  langBtnTxt: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '800' },
  langBtnTxtActive: { color: '#FFF' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
});

// ── Reusable components ─────────────────────────────────────────────────────────
function GlassCard({ children, style }) {
  return <View style={[s.glass, style]}>{children}</View>;
}

function SBadge({ text }) {
  return (
    <View style={s.badge}>
      <Text style={s.badgeTxt}>{text}</Text>
    </View>
  );
}

// ── Main LandingScreen ──────────────────────────────────────────────────────────
export default function LandingScreen({ navigation }) {
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [books, setBooks] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const marqueeRef = useRef(null);
  const scrollX = useRef(0);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 950, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 950, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -8, duration: 2400, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 2400, useNativeDriver: true }),
    ])).start();

    // Loop marquee scroll smoothly (left-ward)
    let marqueeTimer = setInterval(() => {
      if (marqueeRef.current) {
        scrollX.current += 0.8;
        const itemWidth = 92; // 82 width + 10 margin
        const limit = MARQUEE_BOOKS.length * itemWidth;
        if (scrollX.current >= limit) {
          scrollX.current = 0;
        }
        marqueeRef.current.scrollTo({ x: scrollX.current, animated: false });
      }
    }, 20);

    fetchPlans();
    fetchBooks();

    return () => clearInterval(marqueeTimer);
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await apiClient.get('/subscriptions/plans');
      if (res.data?.success && res.data.plans?.length > 0) {
        const mapped = res.data.plans
          .filter(p => p.status === 'ACTIVE')
          .sort((a, b) => Number(a.price) - Number(b.price))
          .map((p, i) => ({
            id: p.id, name: p.name, price: Number(p.price),
            duration: p.interval === 'MONTHLY' ? '1 Month' : p.interval === 'YEARLY' ? '12 Months' : 'Forever',
            highlight: i === 0 ? 'STARTER' : i === 1 ? 'MOST POPULAR' : 'BEST VALUE',
            desc: p.description || '',
            features: (p.features || []).map(f => f.value || f.name || '').filter(Boolean),
            dark: i === 1,
          }));
        if (mapped.length > 0) setPlans(mapped);
      }
    } catch (_) {}
    setPlansLoading(false);
  };

  const fetchBooks = async () => {
    try {
      const res = await apiClient.get('/books?limit=5');
      if (res.data?.books?.length > 0) setBooks(res.data.books);
    } catch (_) {}
  };

  return (
    <ImageBackground
      source={require('../../assets/landing-bg.jpeg')}
      style={s.bg}
      resizeMode="cover"
    >
      {/* Soft pink-white overlay for readability */}
      <View style={s.bgTint} />
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={s.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>

          {/* ═══ HERO ═══ */}
          <View style={s.heroWrap}>
            <GlassCard style={s.heroCard}>
              {/* Decorative petals */}
              <View style={[s.petal, { top: -20, right: -30, width: 100, height: 100, backgroundColor: 'rgba(233,30,99,0.08)', borderRadius: 50 }]} />
              <View style={[s.petal, { bottom: -10, left: -20, width: 80, height: 80, backgroundColor: 'rgba(156,39,176,0.07)', borderRadius: 40 }]} />

              {/* Floating logo */}
              <Animated.View style={{ transform: [{ translateY: floatAnim }], alignItems: 'center', marginBottom: 14 }}>
                <View style={s.logoRing}>
                  <Image source={require('../../assets/logo.jpeg')} style={s.logo} resizeMode="cover" />
                </View>
              </Animated.View>

              <Text style={s.brand}>HEALTH SAKHI</Text>

              {/* Tagline divider */}
              <View style={s.taglineRow}>
                <View style={s.taglineLine} />
                <Text style={s.tagline}>Family Wellness</Text>
                <View style={s.taglineLine} />
              </View>

              <Text style={s.heroDesc}>
                Your complete companion for intimate health tracking, family budget management & holistic wellness
              </Text>

              {/* Stats strip */}
              <View style={s.statsStrip}>
                {[{ v: '20+', l: 'Wellness\nBooks' }, { v: '10K+', l: 'Happy\nFamilies' }, { v: '5 ★', l: 'App\nRating' }].map((item, i) => (
                  <View key={i} style={[s.statItem, i === 1 && s.statItemMid]}>
                    <Text style={s.statVal}>{item.v}</Text>
                    <Text style={s.statLbl}>{item.l}</Text>
                  </View>
                ))}
              </View>

              {/* Primary CTA */}
              <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
                <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('Signup')} activeOpacity={0.85}>
                  <Text style={s.primaryBtnTxt}>Get Started Free 🌸</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Secondary CTAs row */}
              <View style={s.heroBtnRow}>
                <TouchableOpacity style={s.outlineBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
                  <Text style={s.outlineBtnTxt}>Already a Member? Log In</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.watchBtn} onPress={() => setShowVideo(true)} activeOpacity={0.85}>
                  <Play size={13} color="#FFF" fill="#FFF" />
                  <Text style={s.watchBtnTxt}>Watch</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>

          {/* ═══ BOOK MARQUEE STRIP ═══ */}
          <GlassCard style={s.marqueeCard}>
            <Text style={s.marqueeLbl}>✦ HEALTHSAKHI WELLNESS BOOKS ✦</Text>
            <ScrollView 
              ref={marqueeRef}
              horizontal 
              showsHorizontalScrollIndicator={false} 
              scrollEnabled={false}
              style={{ marginTop: 10 }}
            >
              {[...MARQUEE_BOOKS, ...MARQUEE_BOOKS, ...MARQUEE_BOOKS].map((img, i) => (
                <Image key={i} source={{ uri: `${WEB_HOST}${img}` }} style={s.marqueeImg} resizeMode="cover" />
              ))}
            </ScrollView>
          </GlassCard>

          {/* ═══ ABOUT DOCTOR ═══ */}
          <View style={s.sec}>
            <SBadge text="👨‍⚕️  OUR FOUNDER" />
            <Text style={s.secTitle}>Meet Dr. Pratap{'\n'}Madhukar</Text>
            <GlassCard style={{ padding: 0, overflow: 'hidden', marginTop: 14 }}>
              <View style={s.docImgBox}>
                <Image
                  source={{ uri: `${WEB_HOST}/Images/dr-pratap-portrait.png` }}
                  style={s.docImg}
                  resizeMode="cover"
                  defaultSource={require('../../assets/logo.jpeg')}
                />
                {/* Gradient overlay at bottom of image */}
                <View style={s.docImgGrad}>
                  <Text style={s.docImgBadgeNum}>20+</Text>
                  <Text style={s.docImgBadgeLbl}>Wellness Books</Text>
                </View>
              </View>
              <View style={s.docBody}>
                <Text style={s.docName}>Dr. Pratap Madhukar</Text>
                <Text style={s.docQual}>MBBS, MSc, PGDip</Text>
                <Text style={s.docRole}>Lifestyle & Wellness Coach | Author | Founder, HealthSakhi</Text>
                <View style={s.expPill}>
                  <Text style={s.expPillTxt}>⭐ 36+ Years of Experience</Text>
                </View>
                <Text style={s.docBio}>
                  With over 36 years of clinical experience in Family Medicine, Women’s Health, and Lifestyle Medicine, Dr. Pratap Madhukar has dedicated his career to improving the health and well-being of thousands of families. His work combines evidence-based medical knowledge with compassionate patient counseling, empowering individuals to make sustainable lifestyle changes for healthier lives.
                </Text>
                <View style={s.docPillsRow}>
                  {[{ i: '🤝', l: '10K+ Families' }, { i: '📚', l: '20+ Books' }, { i: '🌸', l: 'HealthSakhi' }].map((item, idx) => (
                    <View key={idx} style={s.docPill}>
                      <Text style={{ fontSize: 11 }}>{item.i}</Text>
                      <Text style={s.docPillTxt}>{item.l}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </GlassCard>
          </View>

          {/* ═══ FEATURES ═══ */}
          <View style={s.sec}>
            <SBadge text="✨  WHAT WE OFFER" />
            <Text style={s.secTitle}>Everything Your{'\n'}Family Needs</Text>
            <Text style={s.secSub}>All-in-one wellness platform crafted for Indian families</Text>
            <View style={s.featGrid}>
              {FEATURES.map((f, i) => (
                <GlassCard key={i} style={s.featCard}>
                  <Text style={s.featEmoji}>{f.emoji}</Text>
                  <Text style={s.featTitle}>{f.title}</Text>
                  <Text style={s.featDesc}>{f.desc}</Text>
                </GlassCard>
              ))}
            </View>
          </View>

          {/* ═══ DEMO VIDEO + BOOKS ═══ */}
          <View style={s.sec}>
            <SBadge text="🎬  LEARNING & LISTENING" />
            <Text style={s.secTitle}>Watch Demo &{'\n'}Explore Books</Text>
            <Text style={s.secSub}>Available in English, हिंदी & मराठी</Text>

            <GlassCard style={{ padding: 16, marginTop: 14 }}>
              {/* Video thumbnail */}
              <TouchableOpacity style={s.vThumb} onPress={() => setShowVideo(true)} activeOpacity={0.85}>
                <Image
                  source={require('../../assets/sakhis-group.png')}
                  style={s.vThumbImg}
                  resizeMode="cover"
                />
                <View style={s.vOverlay}>
                  <View style={s.vPlayCircle}>
                    <Play size={30} color="#FFF" fill="#FFF" />
                  </View>
                  <Text style={s.vPlayLabel}>Watch HealthSakhi Demo</Text>
                  {/* Language badges below play button */}
                  <View style={s.vLangBadges}>
                    {['🇬🇧 EN', '🇮🇳 HI', '🌸 MR'].map((lbl, i) => (
                      <View key={i} style={s.vLangBadge}>
                        <Text style={s.vLangBadgeTxt}>{lbl}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Books horizontal scroll */}
              <Text style={s.booksSubhdr}>📚 Featured Books</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(books.length > 0 ? books : [{}, {}, {}, {}]).slice(0, 5).map((book, i) => (
                  <TouchableOpacity key={i} style={s.bookCard} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
                    {book.coverImageUrl ? (
                      <Image
                        source={{ uri: book.coverImageUrl.startsWith('http') ? book.coverImageUrl : `${WEB_HOST}${book.coverImageUrl}` }}
                        style={s.bookCover}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[s.bookCover, s.bookCoverPh]}>
                        <Text style={{ fontSize: 32 }}>{['📕', '📗', '📘', '📙', '📒'][i % 5]}</Text>
                      </View>
                    )}
                    <Text style={s.bookTitle} numberOfLines={2}>{book.title || `Wellness Book ${i + 1}`}</Text>
                    <View style={s.bookBadge}>
                      <BookOpen size={8} color="#E91E63" />
                      <Text style={s.bookBadgeTxt}>Read & Listen</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={s.viewAllBtn} onPress={() => navigation.navigate('Login')}>
                <Text style={s.viewAllTxt}>View All Books</Text>
                <ChevronRight size={15} color="#E91E63" />
              </TouchableOpacity>
            </GlassCard>
          </View>

          {/* ═══ TESTIMONIALS ═══ */}
          <View style={s.sec}>
            <SBadge text="💬  WORDS FROM OUR SAKHIS" />
            <Text style={s.secTitle}>Real Stories,{'\n'}Real Transformations</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
              {TESTIMONIALS.map((t, i) => (
                <GlassCard key={i} style={s.testCard}>
                  <View style={s.starsRow}>
                    {[1, 2, 3, 4, 5].map(n => <Star key={n} size={13} color="#F59E0B" fill="#F59E0B" />)}
                  </View>
                  <Text style={s.testQuote}>"{t.quote}"</Text>
                  <View style={s.testFooter}>
                    <View style={[s.testAv, { backgroundColor: t.color }]}>
                      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>{t.avatar}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.testName}>{t.name}</Text>
                      <Text style={s.testRole}>{t.role}</Text>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </ScrollView>
          </View>

          {/* ═══ PRICING ═══ */}
          <View style={s.sec}>
            <SBadge text="💎  CHOOSE YOUR WELLNESS PLAN" />
            <Text style={s.secTitle}>Choose Your{'\n'}Wellness Plan</Text>
            <Text style={s.secSub}>Affordable plans for every Indian family</Text>

            {plansLoading ? (
              <ActivityIndicator color="#E91E63" size="large" style={{ marginTop: 24 }} />
            ) : (
              plans.map(plan => (
                <View key={plan.id} style={[s.planCard, plan.dark ? s.planDark : s.planGlass]}>
                  {plan.highlight && (
                    <View style={[s.planBdg, plan.dark && { backgroundColor: '#F9A8D4' }]}>
                      <Text style={s.planBdgTxt}>{plan.highlight}</Text>
                    </View>
                  )}
                  <View style={s.planHd}>
                    <View>
                      <Text style={[s.planName, plan.dark && { color: '#FFF' }]}>{plan.name}</Text>
                      <Text style={[s.planDur, plan.dark && { color: '#F9A8D4' }]}>{plan.duration}</Text>
                    </View>
                    <Text style={[s.planPx, plan.dark && { color: '#FFF' }]}>
                      {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString()}`}
                    </Text>
                  </View>
                  <Text style={[s.planDes, plan.dark && { color: 'rgba(255,255,255,0.65)' }]}>{plan.desc}</Text>
                  <View style={s.planDiv} />
                  <View style={{ gap: 8, marginBottom: 18 }}>
                    {(plan.features || []).map((feat, fi) => (
                      <View key={fi} style={s.planFR}>
                        <View style={[s.chk, plan.dark && { backgroundColor: '#F9A8D4' }]}>
                          <Check size={9} color={plan.dark ? '#4B1E5A' : '#FFF'} strokeWidth={3} />
                        </View>
                        <Text style={[s.planFT, plan.dark && { color: 'rgba(255,255,255,0.85)' }]}>{feat}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[s.planBtn, plan.dark ? { backgroundColor: '#FFF' } : { backgroundColor: '#E91E63' }]}
                    onPress={() => navigation.navigate('Signup')}
                    activeOpacity={0.85}
                  >
                    <Text style={[s.planBTxt, plan.dark ? { color: '#4B1E5A' } : { color: '#FFF' }]}>
                      {plan.price === 0 ? 'Start Free →' : 'Choose Plan →'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* ═══ CTA BANNER ═══ */}
          <GlassCard style={s.ctaBanner}>
            <Text style={s.ctaEmoji}>🌸</Text>
            <Text style={s.ctaTitle}>Start Your Wellness{'\n'}Journey Today</Text>
            <Text style={s.ctaSub}>Join 10,000+ Indian families transforming their health with HealthSakhi</Text>
            <TouchableOpacity style={s.ctaPBtn} onPress={() => navigation.navigate('Signup')} activeOpacity={0.85}>
              <Text style={s.ctaPBtnTxt}>Create Free Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ctaOBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
              <Text style={s.ctaOBtnTxt}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* ═══ FOOTER ═══ */}
          <GlassCard style={s.footer}>
            <Image source={require('../../assets/logo.jpeg')} style={s.footerLogo} resizeMode="cover" />
            <Text style={s.footerBrand}>HEALTH SAKHI</Text>
            <Text style={s.footerTagline}>Family Wellness Companion</Text>
            <Text style={s.footerCopy}>© 2026 HealthSakhi. All rights reserved.{'\n'}Crafted with 🌸 for Indian Families</Text>
          </GlassCard>

        </ScrollView>
      </SafeAreaView>

      <VideoModal visible={showVideo} onClose={() => setShowVideo(false)} />
    </ImageBackground>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  bg: { flex: 1 },
  bgTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 236, 248, 0.42)' },
  safe: { flex: 1 },
  petal: { position: 'absolute' },

  // Glass card
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 5,
  },

  // HERO
  heroWrap: { padding: 14, paddingTop: 10 },
  heroCard: { padding: 24, alignItems: 'center', overflow: 'hidden' },
  logoRing: { width: 114, height: 114, borderRadius: 57, borderWidth: 3, borderColor: 'rgba(233,30,99,0.35)', padding: 4, backgroundColor: 'rgba(255,255,255,0.55)' },
  logo: { width: '100%', height: '100%', borderRadius: 53 },
  brand: { fontSize: 31, fontWeight: '900', color: '#4B1E5A', letterSpacing: 3, textAlign: 'center', textShadowColor: 'rgba(233,30,99,0.15)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  taglineRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 9, width: '80%' },
  taglineLine: { flex: 1, height: 1.5, backgroundColor: 'rgba(233,30,99,0.4)' },
  tagline: { color: '#E91E63', fontWeight: '800', fontSize: 14, marginHorizontal: 10, fontStyle: 'italic' },
  heroDesc: { color: '#6B5E63', textAlign: 'center', fontSize: 12.5, lineHeight: 21, fontWeight: '500', marginBottom: 20, paddingHorizontal: 4 },
  statsStrip: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 20, paddingVertical: 13, paddingHorizontal: 8, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(233,30,99,0.12)' },
  statItem: { flex: 1, alignItems: 'center' },
  statItemMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(233,30,99,0.15)' },
  statVal: { color: '#4B1E5A', fontSize: 22, fontWeight: '900' },
  statLbl: { color: '#9E9E9E', fontSize: 8, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 12, marginTop: 2 },
  primaryBtn: { backgroundColor: '#E91E63', borderRadius: 30, paddingVertical: 15, alignItems: 'center', width: '100%', shadowColor: '#E91E63', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 7, marginBottom: 11 },
  primaryBtnTxt: { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 0.4 },
  heroBtnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  outlineBtn: { flex: 1, borderWidth: 2, borderColor: '#4B1E5A', borderRadius: 28, paddingVertical: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.45)' },
  outlineBtnTxt: { color: '#4B1E5A', fontWeight: '700', fontSize: 10.5 },
  watchBtn: { backgroundColor: '#4B1E5A', borderRadius: 28, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  watchBtnTxt: { color: '#FFF', fontWeight: '800', fontSize: 11 },

  // MARQUEE
  marqueeCard: { marginHorizontal: 14, marginBottom: 6, padding: 14 },
  marqueeLbl: { textAlign: 'center', fontSize: 9, fontWeight: '900', color: '#C2185B', letterSpacing: 2.5, textTransform: 'uppercase' },
  marqueeImg: { width: 82, height: 112, borderRadius: 14, marginRight: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)', shadowColor: '#E91E63', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },

  // SECTION
  sec: { paddingHorizontal: 14, paddingBottom: 6, paddingTop: 10 },
  badge: { alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 9, borderWidth: 1, borderColor: 'rgba(233,30,99,0.2)' },
  badgeTxt: { color: '#E91E63', fontWeight: '900', fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase' },
  secTitle: { fontSize: 25, fontWeight: '900', color: '#4B1E5A', textAlign: 'center', lineHeight: 33, marginBottom: 7 },
  secSub: { color: '#9E9E9E', textAlign: 'center', fontSize: 12, lineHeight: 18, fontWeight: '500', marginBottom: 4 },

  // DOCTOR
  docImgBox: { height: 350, position: 'relative' },
  docImg: { width: '100%', height: '100%' },
  docImgGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(75,30,90,0.6)', paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  docImgBadgeNum: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  docImgBadgeLbl: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 0.5 },
  docBody: { padding: 18 },
  docName: { fontSize: 19, fontWeight: '900', color: '#4B1E5A', marginBottom: 2 },
  docQual: { fontSize: 10, fontWeight: '800', color: '#E91E63', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  docRole: { fontSize: 10, fontWeight: '600', color: '#9E9E9E', marginBottom: 10, lineHeight: 15 },
  expPill: { alignSelf: 'flex-start', backgroundColor: '#FCE4EC', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 11, borderWidth: 1, borderColor: 'rgba(233,30,99,0.2)' },
  expPillTxt: { color: '#E91E63', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  docBio: { fontSize: 12, color: '#6B6B9E', lineHeight: 20, fontWeight: '500', marginBottom: 14 },
  docPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  docPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(233,30,99,0.07)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  docPillTxt: { fontSize: 9, fontWeight: '700', color: '#4B1E5A', textTransform: 'uppercase', letterSpacing: 0.4 },

  // FEATURES
  featGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  featCard: { 
    width: (W - 38) / 2, 
    padding: 16, 
    borderRadius: 24, 
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 6
  },
  featEmoji: { fontSize: 28, marginBottom: 8 },
  featTitle: { fontSize: 11, fontWeight: '950', color: '#4B1E5A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  featDesc: { fontSize: 10, color: '#7E7E9A', lineHeight: 16, fontWeight: '600' },

  // VIDEO
  vThumb: { height: 200, borderRadius: 24, overflow: 'hidden', position: 'relative', backgroundColor: '#F3E5F5', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(233,30,99,0.15)' },
  vThumbImg: { width: '100%', height: '100%' },
  vOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(57,20,70,0.65)', justifyContent: 'center', alignItems: 'center' },
  vPlayCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#E91E63', justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#E91E63', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 8 },
  vPlayLabel: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.6, marginBottom: 12, textTransform: 'uppercase' },
  vLangBadges: { flexDirection: 'row', gap: 8 },
  vLangBadge: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  vLangBadgeTxt: { color: '#FFF', fontSize: 9.5, fontWeight: '900' },
  booksSubhdr: { fontSize: 13, fontWeight: '900', color: '#4B1E5A', marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  bookCard: { width: 124, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, overflow: 'hidden', marginRight: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.95)', shadowColor: '#E91E63', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  bookCover: { width: '100%', height: 145 },
  bookCoverPh: { backgroundColor: '#FDF2F8', justifyContent: 'center', alignItems: 'center' },
  bookTitle: { fontSize: 10, fontWeight: '900', color: '#4B1E5A', margin: 8, lineHeight: 15 },
  bookBadge: { flexDirection: 'row', alignItems: 'center', gap: 3.5, backgroundColor: '#FFF0F5', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, marginLeft: 8, marginBottom: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#FBE8EB' },
  bookBadgeTxt: { color: '#E91E63', fontSize: 8, fontWeight: '900' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 16, paddingVertical: 14, borderWidth: 2, borderColor: '#E91E63', borderRadius: 20 },
  viewAllTxt: { color: '#E91E63', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },

  // TESTIMONIALS
  testCard: { width: W * 0.77, padding: 18, marginRight: 12 },
  starsRow: { flexDirection: 'row', gap: 3, marginBottom: 11 },
  testQuote: { color: '#4B1E5A', fontSize: 12, lineHeight: 20, fontStyle: 'italic', fontWeight: '500', marginBottom: 14 },
  testFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  testAv: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  testName: { color: '#4B1E5A', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
  testRole: { color: '#9E9E9E', fontSize: 9, fontWeight: '600', marginTop: 1 },

  // PRICING
  planCard: { borderRadius: 26, padding: 20, marginTop: 13, position: 'relative', overflow: 'hidden' },
  planGlass: { backgroundColor: 'rgba(255,255,255,0.78)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.92)', shadowColor: '#E91E63', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 15, elevation: 4 },
  planDark: { backgroundColor: '#2D0A3E', shadowColor: '#2D0A3E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 18, elevation: 7 },
  planBdg: { position: 'absolute', top: 15, right: 15, backgroundColor: '#E91E63', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 4 },
  planBdgTxt: { color: '#FFF', fontSize: 7.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  planHd: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 },
  planName: { fontSize: 17, fontWeight: '900', color: '#4B1E5A', marginBottom: 2 },
  planDur: { fontSize: 9, fontWeight: '700', color: '#E91E63', textTransform: 'uppercase', letterSpacing: 0.8 },
  planPx: { fontSize: 26, fontWeight: '900', color: '#4B1E5A' },
  planDes: { fontSize: 11, color: '#9E9E9E', lineHeight: 17, marginBottom: 11 },
  planDiv: { height: 1, backgroundColor: 'rgba(233,30,99,0.1)', marginBottom: 11 },
  planFR: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  chk: { width: 17, height: 17, borderRadius: 8.5, backgroundColor: '#E91E63', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  planFT: { fontSize: 11, fontWeight: '600', color: '#4B1E5A', flex: 1, lineHeight: 17 },
  planBtn: { borderRadius: 18, paddingVertical: 13, alignItems: 'center' },
  planBTxt: { fontWeight: '800', fontSize: 13 },

  // CTA
  ctaBanner: { margin: 14, padding: 28, alignItems: 'center', backgroundColor: 'rgba(233,30,99,0.88)', borderColor: 'rgba(255,255,255,0.3)' },
  ctaEmoji: { fontSize: 46, marginBottom: 10 },
  ctaTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', textAlign: 'center', lineHeight: 32, marginBottom: 8 },
  ctaSub: { color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontSize: 12, lineHeight: 19, fontWeight: '500', marginBottom: 22 },
  ctaPBtn: { backgroundColor: '#FFF', borderRadius: 30, paddingVertical: 14, alignItems: 'center', width: '100%', marginBottom: 10 },
  ctaPBtnTxt: { color: '#E91E63', fontWeight: '900', fontSize: 14 },
  ctaOBtn: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 30, paddingVertical: 12, alignItems: 'center', width: '100%' },
  ctaOBtnTxt: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 12 },

  // FOOTER
  footer: { margin: 14, marginTop: 4, padding: 24, alignItems: 'center' },
  footerLogo: { width: 54, height: 54, borderRadius: 27, marginBottom: 8 },
  footerBrand: { fontSize: 15, fontWeight: '900', color: '#4B1E5A', letterSpacing: 3, marginBottom: 3 },
  footerTagline: { color: '#E91E63', fontSize: 11, fontWeight: '700', fontStyle: 'italic', marginBottom: 12 },
  footerCopy: { color: '#9E9E9E', fontSize: 9, fontWeight: '500', textAlign: 'center', lineHeight: 16 },
});
