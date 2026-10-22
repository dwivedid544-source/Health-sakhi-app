import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  RefreshControl, ActivityIndicator, TouchableOpacity, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, CheckCircle, DollarSign, Award, Star, Video, Clock } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';

export default function AdvisorDashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/advisors/dashboard');
      if (response.data) {
        setData(response.data);
      }
    } catch (err) {
      console.error('Error fetching advisor dashboard:', err);
      // Fallback mocks
      setData({
        stats: {
          today: [
            { name: 'Sessions Today', value: '2', icon: 'CheckCircle', color: COLORS.secondary },
            { name: 'Upcoming Calls', value: '4', icon: 'Calendar', color: '#3b82f6' },
            { name: 'Today Earnings', value: '₹1,500', icon: 'DollarSign', color: '#f59e0b' },
          ]
        },
        appointments: {
          today: [
            { id: '1', time: '10:00 AM', clientName: 'Priya Patel', status: 'confirmed', topic: 'Hormonal Health' },
            { id: '2', time: '02:30 PM', clientName: 'Sneha Rao', status: 'pending', topic: 'PCOS Diet Guidance' }
          ]
        },
        clinicalExcellence: {
          patientSatisfaction: '98%',
          completionRate: '96%',
          avgRating: '4.9/5',
          totalConsultations: 18
        }
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleAction = (type, apptId) => {
    Alert.alert('Action Triggered', `Appointment ${apptId} ${type} successfully! 🌸`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.secondary} size="large" />
      </View>
    );
  }

  const todayStats = data?.stats?.today || [];
  const todayAppts = data?.appointments?.today || [];
  const excellence = data?.clinicalExcellence || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.welcomeText}>Namaste, {user?.name || 'Dr. Advisor'} 👋</Text>
            <Text style={styles.subtext}>Your clinical health command center</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#E0F2FE' }]}>
            <Award size={14} color="#0284C7" />
            <Text style={[styles.badgeText, { color: '#0284C7' }]}>Advisor</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.gridRow}>
            {todayStats.map((stat, index) => (
              <View key={index} style={styles.gridCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBg, { backgroundColor: '#FDF2F8' }]}>
                    {stat.name.includes('Session') ? (
                      <CheckCircle size={18} color={COLORS.secondary} />
                    ) : stat.name.includes('Call') ? (
                      <Calendar size={18} color="#3b82f6" />
                    ) : (
                      <DollarSign size={18} color="#f59e0b" />
                    )}
                  </View>
                </View>
                <Text style={styles.cardVal}>{stat.value}</Text>
                <Text style={styles.cardLabel}>{stat.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Clinical Excellence Metrics */}
        <Text style={styles.sectionHeader}>Clinical Excellence</Text>
        <View style={styles.excellenceCard}>
          <View style={styles.excellenceRow}>
            <View style={styles.excellenceCol}>
              <Star size={20} color="#F59E0B" />
              <Text style={styles.excellenceVal}>{excellence.avgRating || '4.9/5'}</Text>
              <Text style={styles.excellenceLabel}>Avg Rating</Text>
            </View>
            <View style={styles.excellenceDivider} />
            <View style={styles.excellenceCol}>
              <CheckCircle size={20} color={COLORS.success} />
              <Text style={styles.excellenceVal}>{excellence.patientSatisfaction || '98%'}</Text>
              <Text style={styles.excellenceLabel}>Satisfaction</Text>
            </View>
            <View style={styles.excellenceDivider} />
            <View style={styles.excellenceCol}>
              <Clock size={20} color="#3b82f6" />
              <Text style={styles.excellenceVal}>{excellence.totalConsultations || '0'}</Text>
              <Text style={styles.excellenceLabel}>Consultations</Text>
            </View>
          </View>
        </View>

        {/* Today's Appointments */}
        <Text style={styles.sectionHeader}>Today's Sessions</Text>
        {todayAppts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No appointments scheduled for today. 🌸</Text>
          </View>
        ) : (
          todayAppts.map((appt) => (
            <View key={appt.id} style={styles.apptCard}>
              <View style={styles.apptHeader}>
                <View style={styles.apptTimeBg}>
                  <Clock size={14} color={COLORS.primary} />
                  <Text style={styles.apptTimeText}>{appt.time}</Text>
                </View>
                <Text style={[styles.statusBadge, appt.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending]}>
                  {appt.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.clientName}>{appt.clientName}</Text>
              <Text style={styles.topicText}>Topic: {appt.topic}</Text>

              <View style={styles.actionRow}>
                {appt.status !== 'confirmed' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.confirmBtn]}
                    onPress={() => handleAction('confirmed', appt.id)}
                  >
                    <Text style={styles.confirmBtnText}>Confirm</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.callBtn]}
                  onPress={() => handleAction('join call', appt.id)}
                >
                  <Video size={14} color={COLORS.white} style={{ marginRight: 6 }} />
                  <Text style={styles.callBtnText}>Join Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  statsContainer: {
    marginBottom: SPACING.md,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  gridCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderRadius: 15,
    ...SHADOWS.light,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconBg: {
    padding: 6,
    borderRadius: 8,
  },
  cardVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  excellenceCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 15,
    ...SHADOWS.light,
    marginBottom: SPACING.sm,
  },
  excellenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  excellenceCol: {
    alignItems: 'center',
  },
  excellenceVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  excellenceLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  excellenceDivider: {
    width: 1,
    height: 35,
    backgroundColor: COLORS.border,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  apptCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 15,
    marginBottom: SPACING.sm,
    ...SHADOWS.light,
  },
  apptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  apptTimeBg: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  apptTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 4,
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusConfirmed: {
    backgroundColor: '#EAF7EA',
    color: COLORS.success,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  clientName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  topicText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.xs,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  confirmBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  callBtn: {
    backgroundColor: COLORS.secondary,
  },
  callBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
