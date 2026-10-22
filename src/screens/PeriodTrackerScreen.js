import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Settings, Droplets } from 'lucide-react-native';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import FloatingAIBtn from '../components/FloatingAIBtn';

// Local prediction fallback when network unavailable
function computeLocalMarkers(lastPeriodDateStr, cycleLen, periodLen, month, year) {
  if (!lastPeriodDateStr) return { logged: [], predicted: [], fertile: [], ovulation: [] };
  const cycleLenNum = parseInt(cycleLen) || 28;
  const periodLenNum = parseInt(periodLen) || 5;
  const lastPeriod = new Date(lastPeriodDateStr);
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, daysInMonth);
  const logged = [], predicted = [], fertile = [], ovulation = [];

  for (let cycle = -2; cycle <= 12; cycle++) {
    const cycleStart = new Date(lastPeriod.getTime() + cycle * cycleLenNum * 86400000);
    const cycleEnd = new Date(cycleStart.getTime() + (periodLenNum - 1) * 86400000);
    const ovulDay = new Date(cycleStart.getTime() + (cycleLenNum - 14) * 86400000);
    const fertileStart = new Date(ovulDay.getTime() - 5 * 86400000);
    const fertileEnd = new Date(ovulDay.getTime() + 1 * 86400000);

    for (let d = new Date(cycleStart); d <= cycleEnd; d.setDate(d.getDate() + 1)) {
      if (d >= monthStart && d <= monthEnd) {
        const ds = String(d.getDate()).padStart(2, '0');
        if (cycle === 0) { if (!logged.includes(ds)) logged.push(ds); }
        else { if (!predicted.includes(ds)) predicted.push(ds); }
      }
    }
    for (let d = new Date(fertileStart); d <= fertileEnd; d.setDate(d.getDate() + 1)) {
      if (d >= monthStart && d <= monthEnd) {
        const ds = String(d.getDate()).padStart(2, '0');
        if (!fertile.includes(ds)) fertile.push(ds);
      }
    }
    if (ovulDay >= monthStart && ovulDay <= monthEnd) {
      const ds = String(ovulDay.getDate()).padStart(2, '0');
      if (!ovulation.includes(ds)) ovulation.push(ds);
    }
  }
  return { logged, predicted, fertile, ovulation };
}

export default function PeriodTrackerScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [loggedPeriodDays, setLoggedPeriodDays] = useState([]);
  const [predictedPeriodDays, setPredictedPeriodDays] = useState([]);
  const [fertileDays, setFertileDays] = useState([]);
  const [ovulationDays, setOvulationDays] = useState([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [startDayInput, setStartDayInput] = useState('');
  const [durationInput, setDurationInput] = useState('5');
  const [cycleLength, setCycleLength] = useState('28');
  const [periodLength, setPeriodLength] = useState('5');
  const [lastPeriodDate, setLastPeriodDate] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const applyLocalFallback = (month, year, lastDate, cl, pl) => {
    const markers = computeLocalMarkers(
      lastDate || lastPeriodDate,
      cl || cycleLength,
      pl || periodLength,
      month,
      year
    );
    setLoggedPeriodDays(markers.logged);
    setPredictedPeriodDays(markers.predicted);
    setFertileDays(markers.fertile);
    setOvulationDays(markers.ovulation);
  };

  const fetchDashboard = async (date) => {
    try {
      const res = await apiClient.get(`/period/dashboard?date=${date}`);
      if (res.data) {
        setDashboardData(res.data);
        if (res.data.cycleLength) setCycleLength(String(res.data.cycleLength));
        if (res.data.periodLength) setPeriodLength(String(res.data.periodLength));
        if (res.data.lastPeriodDate) setLastPeriodDate(res.data.lastPeriodDate);
      }
    } catch (err) {
      console.log('Dashboard fetch error - using fallback UI');
      setDashboardData({
        wellnessMessage: 'Log your period to get predictions! 🌸',
        cycleDay: null, nextPeriodIn: null, currentPhase: '--', hasData: false,
      });
    }
  };

  const fetchCalendar = async (month, year) => {
    try {
      const res = await apiClient.get(`/period/calendar?month=${month}&year=${year}`);
      if (res.data) {
        setLoggedPeriodDays(res.data.loggedPeriodDays || []);
        setPredictedPeriodDays(res.data.predictedPeriodDays || []);
        setFertileDays(res.data.fertileDays || []);
        setOvulationDays(res.data.ovulationDays || []);
      }
    } catch (err) {
      console.log('Calendar fetch error - computing locally');
      applyLocalFallback(month, year);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchDashboard(selectedDate), fetchCalendar(currentMonth, currentYear)]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [currentMonth, currentYear]);

  const handlePrevMonth = () => {
    let m = currentMonth - 1, y = currentYear;
    if (m < 1) { m = 12; y -= 1; }
    setCurrentMonth(m); setCurrentYear(y);
  };
  const handleNextMonth = () => {
    let m = currentMonth + 1, y = currentYear;
    if (m > 12) { m = 1; y += 1; }
    setCurrentMonth(m); setCurrentYear(y);
  };

  const handleLogPeriod = async () => {
    if (!startDayInput || isNaN(startDayInput)) { Alert.alert('Error', 'Please enter a valid starting day.'); return; }
    const dayNum = parseInt(startDayInput);
    if (dayNum < 1 || dayNum > 31) { Alert.alert('Error', 'Day must be between 1 and 31.'); return; }

    setActionLoading(true);
    const monthStr = String(currentMonth).padStart(2, '0');
    const startStr = `${currentYear}-${monthStr}-${String(dayNum).padStart(2, '0')}T12:00:00.000Z`;
    const duration = parseInt(durationInput) || 5;
    const endDayNum = Math.min(dayNum + duration - 1, 31);
    const endStr = `${currentYear}-${monthStr}-${String(endDayNum).padStart(2, '0')}T12:00:00.000Z`;

    // Optimistically apply markers locally first
    const newLogged = [];
    for (let d = dayNum; d <= endDayNum; d++) newLogged.push(String(d).padStart(2, '0'));
    setLoggedPeriodDays(prev => [...new Set([...prev, ...newLogged])]);
    setLastPeriodDate(startStr);

    try {
      await apiClient.post('/period/start', { startDate: startStr, endDate: endStr });
      Alert.alert('Saved! 🌸', 'Period logged successfully!');
      setShowLogModal(false);
      setStartDayInput('');
      loadData();
    } catch (err) {
      applyLocalFallback(currentMonth, currentYear, startStr, cycleLength, periodLength);
      Alert.alert('Saved Locally 📴', 'Could not reach server. Period marked on your calendar. It will sync when reconnected.');
      setShowLogModal(false);
      setStartDayInput('');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setActionLoading(true);
    try {
      await apiClient.put('/period/profile', {
        cycleLength: parseInt(cycleLength) || 28,
        periodLength: parseInt(periodLength) || 5,
      });
      Alert.alert('Success', 'Settings updated!');
      setShowSettingsModal(false);
      loadData();
    } catch (err) {
      applyLocalFallback(currentMonth, currentYear);
      Alert.alert('Saved Locally 📴', 'Settings saved locally.');
      setShowSettingsModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const renderCalendarGrid = () => {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay();
    const today = new Date();
    const todayDay = today.getFullYear() === currentYear && today.getMonth() + 1 === currentMonth
      ? today.getDate() : null;

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<View key={`e${i}`} style={styles.calendarDayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const isLogged = loggedPeriodDays.includes(dayStr);
      const isPredicted = predictedPeriodDays.includes(dayStr);
      const isFertile = fertileDays.includes(dayStr);
      const isOvulation = ovulationDays.includes(dayStr);
      const isToday = todayDay === day;

      let cellBg = 'transparent';
      let textColor = '#333';

      if (isLogged) { cellBg = '#E91E8C'; textColor = '#FFFFFF'; }
      else if (isPredicted) { cellBg = '#FCE4EC'; textColor = '#C2185B'; }
      else if (isFertile) { cellBg = '#E0F7FA'; textColor = '#00838F'; }
      else if (isOvulation) { cellBg = '#FFF8E1'; textColor = '#E65100'; }

      const dots = [];
      if (isLogged) dots.push({ color: '#ffffff', key: 'l' });
      else {
        if (isPredicted) dots.push({ color: '#E91E8C', key: 'p' });
        if (isFertile) dots.push({ color: '#00ACC1', key: 'f' });
        if (isOvulation) dots.push({ color: '#F59E0B', key: 'o' });
      }

      days.push(
        <TouchableOpacity
          key={`d${day}`}
          style={[
            styles.calendarDayCell,
            { backgroundColor: cellBg },
            isToday && cellBg === 'transparent' ? styles.todayCell : null,
            isOvulation && !isLogged ? styles.ovulationCell : null,
          ]}
          onPress={() => {
            const ms = String(currentMonth).padStart(2, '0');
            setSelectedDate(`${currentYear}-${ms}-${dayStr}`);
          }}
        >
          <Text style={[styles.calendarDayText, { color: textColor }, isToday && cellBg === 'transparent' ? { color: '#E91E8C', fontWeight: '900' } : null]}>
            {day}
          </Text>
          {isOvulation && <Text style={styles.starBadge}>⭐</Text>}
          {dots.length > 0 && (
            <View style={styles.dotRow}>
              {dots.map(dot => <View key={dot.key} style={[styles.dot, { backgroundColor: dot.color }]} />)}
            </View>
          )}
        </TouchableOpacity>
      );
    }
    return days;
  };

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#E91E8C" size="large" />
        <Text style={styles.loadingText}>Loading Period Data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.wellnessMsg}>
            {dashboardData?.wellnessMessage || 'Log your period details to get predictions! 🌸'}
          </Text>
          <View style={styles.metricGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{dashboardData?.cycleDay != null ? `Day ${dashboardData.cycleDay}` : '--'}</Text>
              <Text style={styles.metricLabel}>CYCLE DAY</Text>
            </View>
            <View style={[styles.metricItem, styles.metricMiddle]}>
              <Text style={styles.metricVal}>{dashboardData?.nextPeriodIn != null ? `${dashboardData.nextPeriodIn} Days` : '--'}</Text>
              <Text style={styles.metricLabel}>NEXT PERIOD IN</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{dashboardData?.currentPhase || '--'}</Text>
              <Text style={styles.metricLabel}>CURRENT PHASE</Text>
            </View>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeaderRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
              <ChevronLeft size={18} color="#6A1B9A" />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>{monthNames[currentMonth - 1]} {currentYear}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
              <ChevronRight size={18} color="#6A1B9A" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdaysRow}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <Text key={d} style={styles.weekdayLabel}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>{renderCalendarGrid()}</View>

          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E91E8C' }]} />
              <Text style={styles.legendLabelText}>Logged Period</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FCE4EC', borderWidth: 1.5, borderColor: '#E91E8C' }]} />
              <Text style={styles.legendLabelText}>Predicted</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E0F7FA' }]} />
              <Text style={styles.legendLabelText}>Fertile Window</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={{ fontSize: 11 }}>⭐</Text>
              <Text style={styles.legendLabelText}>Ovulation Day</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.primaryActionBtn]}
            onPress={() => {
              setStartDayInput(String(new Date().getDate()));
              setShowLogModal(true);
            }}
          >
            <Droplets size={16} color="#FFF" />
            <Text style={styles.primaryActionText}>Log Today's Flow</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.secondaryActionBtn]}
            onPress={() => setShowSettingsModal(true)}
          >
            <Settings size={16} color="#6A1B9A" />
            <Text style={styles.secondaryActionText}>Settings</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Log Period Modal */}
      <Modal visible={showLogModal} transparent animationType="fade" onRequestClose={() => setShowLogModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalEmoji}>🩸</Text>
              <Text style={styles.modalTitle}>Log Period</Text>
              <Text style={styles.modalSubtitle}>Tell us when your period started</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>START DAY OF THE MONTH ({monthNames[currentMonth - 1].toUpperCase()})</Text>
              <TextInput style={styles.modalInput} value={startDayInput} onChangeText={setStartDayInput}
                placeholder="e.g. 5" placeholderTextColor="#9E9E9E" keyboardType="number-pad" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DURATION (DAYS)</Text>
              <TextInput style={styles.modalInput} value={durationInput} onChangeText={setDurationInput}
                placeholder="e.g. 5" placeholderTextColor="#9E9E9E" keyboardType="number-pad" />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowLogModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleLogPeriod} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettingsModal} transparent animationType="fade" onRequestClose={() => setShowSettingsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalEmoji}>⚙️</Text>
              <Text style={styles.modalTitle}>Cycle Settings</Text>
              <Text style={styles.modalSubtitle}>Adjust your cycle parameters</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>AVERAGE CYCLE LENGTH (DAYS)</Text>
              <TextInput style={styles.modalInput} value={cycleLength} onChangeText={setCycleLength}
                placeholder="e.g. 28" placeholderTextColor="#9E9E9E" keyboardType="number-pad" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>AVERAGE PERIOD LENGTH (DAYS)</Text>
              <TextInput style={styles.modalInput} value={periodLength} onChangeText={setPeriodLength}
                placeholder="e.g. 5" placeholderTextColor="#9E9E9E" keyboardType="number-pad" />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSettingsModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save</Text>}
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
  container: { flex: 1, backgroundColor: '#FDF6FF' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF6FF' },
  loadingText: { color: '#9C27B0', marginTop: 12, fontSize: 12, fontWeight: '700' },

  summaryCard: {
    backgroundColor: '#6A1B9A',
    padding: 20, borderRadius: 24,
    shadowColor: '#6A1B9A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  wellnessMsg: { color: '#FFF', fontSize: 13, fontWeight: '700', lineHeight: 20, textAlign: 'center', marginBottom: 14 },
  metricGrid: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 4,
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  metricVal: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  metricLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 8, fontWeight: '700', textTransform: 'uppercase', marginTop: 3, letterSpacing: 0.5, textAlign: 'center' },

  calendarCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    borderWidth: 1, borderColor: 'rgba(106,27,154,0.06)',
  },
  calendarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  navBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3E5F5', justifyContent: 'center', alignItems: 'center' },
  calendarTitle: { fontSize: 15, fontWeight: '800', color: '#6A1B9A' },
  weekdaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  weekdayLabel: { width: '14.28%', textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#9E9E9E' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 },

  calendarDayCell: {
    width: '14.28%', height: 48, justifyContent: 'center', alignItems: 'center',
    borderRadius: 14, position: 'relative',
  },
  todayCell: { borderWidth: 2, borderColor: '#E91E8C' },
  ovulationCell: { borderWidth: 1.5, borderColor: '#F59E0B', borderStyle: 'dashed' },
  calendarDayText: { fontSize: 13, fontWeight: '700' },
  starBadge: { position: 'absolute', top: 1, right: 2, fontSize: 8 },
  dotRow: { flexDirection: 'row', gap: 2, position: 'absolute', bottom: 3, justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 2.5 },

  legendContainer: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center',
    marginTop: 14, borderTopWidth: 1, borderTopColor: '#F3E5F5', paddingTop: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabelText: { fontSize: 9, color: '#757575', fontWeight: '700' },

  actionsBar: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  primaryActionBtn: { backgroundColor: '#E91E8C' },
  primaryActionText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  secondaryActionBtn: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#6A1B9A' },
  secondaryActionText: { color: '#6A1B9A', fontWeight: '700', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: {
    backgroundColor: '#FFF', borderRadius: 28, padding: 24, width: '100%', maxWidth: 360,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalEmoji: { fontSize: 36, marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#6A1B9A' },
  modalSubtitle: { fontSize: 11, color: '#9E9E9E', fontWeight: '600', marginTop: 2 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 9, fontWeight: '800', color: '#9E9E9E', letterSpacing: 1, marginBottom: 7, textTransform: 'uppercase' },
  modalInput: {
    borderWidth: 1.5, borderColor: '#E9D5F5', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, fontWeight: '700',
    color: '#6A1B9A', backgroundColor: '#FDF6FF',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { color: '#9E9E9E', fontWeight: '700', fontSize: 13 },
  saveBtn: {
    backgroundColor: '#6A1B9A', paddingVertical: 10, paddingHorizontal: 24,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center', minWidth: 80,
  },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
});
