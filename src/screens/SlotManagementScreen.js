import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  ActivityIndicator, TouchableOpacity, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, Save } from 'lucide-react-native';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';

export default function SlotManagementScreen() {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const allSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', 
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
  ];

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/advisors/me/availability');
      const backendSlots = res.data?.slots || [];
      
      const newSlots = {
        Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
      };
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      backendSlots.forEach(s => {
        const dateStr = typeof s.date === 'string' ? s.date.split('T')[0] : new Date(s.date).toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-').map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day));
        const dayName = dayNames[utcDate.getUTCDay()];

        const [h, m] = s.start_time.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        const time12 = `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
        
        if (newSlots[dayName] && !newSlots[dayName].includes(time12)) {
          newSlots[dayName].push(time12);
        }
      });
      
      setSlots(newSlots);
    } catch (err) {
      console.error('Error fetching availability:', err);
      // Fallback fallback mock initial slots
      setSlots({
        Monday: ['09:00 AM', '10:00 AM', '02:30 PM'],
        Tuesday: ['11:00 AM', '03:00 PM'],
        Wednesday: ['10:00 AM', '04:30 PM'],
        Thursday: [], Friday: [], Saturday: [], Sunday: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const toggleSlot = (time) => {
    const currentDaySlots = slots[selectedDay];
    let updated;
    if (currentDaySlots.includes(time)) {
      updated = currentDaySlots.filter(t => t !== time);
    } else {
      updated = [...currentDaySlots, time].sort();
    }
    setSlots({ ...slots, [selectedDay]: updated });
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      const today = new Date();
      const dayIndexMap = {
        Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
      };
      
      const payloadSlots = [];
      
      for (const [dayName, times] of Object.entries(slots)) {
        const targetDayIndex = dayIndexMap[dayName];
        const currentDayIndex = today.getDay();
        let daysToAdd = targetDayIndex - currentDayIndex;
        if (daysToAdd < 0) daysToAdd += 7;
        
        const slotDate = new Date();
        slotDate.setDate(today.getDate() + daysToAdd);
        
        const year = slotDate.getFullYear();
        const month = String(slotDate.getMonth() + 1).padStart(2, '0');
        const dateVal = String(slotDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${dateVal}`;
        
        for (const timeStr of times) {
          const [time, modifier] = timeStr.split(' ');
          let [hours, minutes] = time.split(':');
          let h = parseInt(hours, 10);
          if (modifier === 'PM' && h !== 12) h += 12;
          if (modifier === 'AM' && h === 12) h = 0;
          
          const formattedTime = `${String(h).padStart(2, '0')}:${minutes}`;
          payloadSlots.push({
            date: formattedDate,
            start_time: formattedTime,
            end_time: formattedTime // simple match start
          });
        }
      }

      await apiClient.post('/advisors/availability/bulk', { slots: payloadSlots });
      Alert.alert('Success', 'Availability schedule updated successfully! 🌸');
    } catch (err) {
      console.error('Failed to save availability:', err);
      Alert.alert('Error', 'Failed to save slots schedule.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.secondary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Banner */}
      <View style={styles.headerBanner}>
        <Calendar size={22} color={COLORS.white} />
        <Text style={styles.headerTitle}>Configure Slots</Text>
      </View>

      {/* Weekday Selector */}
      <View style={styles.daySelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>
          {days.map((day) => (
            <TouchableOpacity 
              key={day} 
              style={[styles.dayTab, selectedDay === day && styles.activeDayTab]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayTabText, selectedDay === day && styles.activeDayTabText]}>
                {day.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Slots Selection Pills */}
      <ScrollView contentContainerStyle={styles.slotsGridContainer}>
        <Text style={styles.subtitle}>Select available hours for {selectedDay}:</Text>
        
        <View style={styles.slotsGrid}>
          {allSlots.map((time) => {
            const isSelected = slots[selectedDay].includes(time);
            return (
              <TouchableOpacity 
                key={time} 
                style={[styles.slotPill, isSelected && styles.activeSlotPill]}
                onPress={() => toggleSlot(time)}
              >
                <Clock size={12} color={isSelected ? COLORS.white : COLORS.textMuted} style={{ marginRight: 6 }} />
                <Text style={[styles.slotText, isSelected && styles.activeSlotText]}>
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Save Button Floating Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveBtn} 
          onPress={handleSaveSchedule}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Save size={18} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Schedule</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  headerBanner: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  daySelectorContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 10,
  },
  dayTabs: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  dayTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeDayTab: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  activeDayTabText: {
    color: COLORS.white,
  },
  slotsGridContainer: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '48%', // Grid layout
    marginBottom: 4,
    ...SHADOWS.light,
  },
  activeSlotPill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  slotText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  activeSlotText: {
    color: COLORS.white,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
