import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, FlatList, 
  ActivityIndicator, TouchableOpacity, TextInput, Alert, Modal 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, CheckCircle, Video, Clock } from 'lucide-react-native';
import apiClient from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';

export default function AdvisorConsultationsScreen() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [prescriptions, setPrescriptions] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchAppointments = async () => {
    try {
      const response = await apiClient.get('/appointments');
      if (response.data && response.data.success) {
        setAppointments(response.data.appointments || []);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      // Fallback mocks
      setAppointments([
        { id: '1', date: new Date().toISOString(), time: '10:00 AM', clientName: 'Priya Patel', status: 'completed', topic: 'Hormonal Health Balance Plan', notes: 'Advised lifestyle changes and dietary guidelines.' },
        { id: '2', date: new Date().toISOString(), time: '02:30 PM', clientName: 'Sneha Rao', status: 'confirmed', topic: 'PCOS Diet Guidance', notes: '' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const openNotesModal = (appt) => {
    setSelectedAppt(appt);
    if (appt.notes && typeof appt.notes === 'object') {
      setSymptoms(appt.notes.symptoms || '');
      setDiagnosis(appt.notes.diagnosis || '');
      setTreatmentPlan(appt.notes.treatment_plan || '');
      setPrescriptions(appt.notes.prescriptions || '');
    } else {
      setSymptoms('');
      setDiagnosis('');
      setTreatmentPlan(typeof appt.notes === 'string' ? appt.notes : '');
      setPrescriptions('');
    }
    setNotesModalVisible(true);
  };

  const handleSaveNotes = async () => {
    if (!treatmentPlan.trim()) {
      Alert.alert('Error', 'Treatment plan is required.');
      return;
    }

    try {
      setSavingNotes(true);
      await apiClient.post(`/appointments/${selectedAppt.id}/notes`, {
        symptoms: symptoms.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        treatment_plan: treatmentPlan.trim(),
        prescriptions: prescriptions.trim() || undefined
      });
      Alert.alert('Success', 'Consultation summary updated successfully! 🌸');
      setNotesModalVisible(false);
      fetchAppointments();
    } catch (err) {
      console.error('Error saving notes:', err);
      Alert.alert('Error', 'Failed to save notes.');
    } finally {
      setSavingNotes(false);
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
      <View style={styles.headerBanner}>
        <FileText size={22} color={COLORS.white} />
        <Text style={styles.headerTitle}>Consultations Room</Text>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md }}
        renderItem={({ item }) => (
          <View style={styles.consultationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.statusRow}>
                <Clock size={12} color={COLORS.textMuted} />
                <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()} at {item.time}</Text>
              </View>
              <Text style={[styles.statusBadge, item.status === 'completed' ? styles.statusCompleted : styles.statusActive]}>
                {item.status.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.clientName}>{item.clientName}</Text>
            <Text style={styles.topicText}>Focus: {item.topic}</Text>

            {item.notes ? (
              <View style={styles.notesBox}>
                <Text style={styles.notesTitle}>Summary Notes:</Text>
                {typeof item.notes === 'string' ? (
                  <Text style={styles.notesText}>{item.notes}</Text>
                ) : (
                  <>
                    {item.notes.symptoms ? <Text style={styles.notesText}>• Symptoms: {item.notes.symptoms}</Text> : null}
                    {item.notes.diagnosis ? <Text style={styles.notesText}>• Diagnosis: {item.notes.diagnosis}</Text> : null}
                    {item.notes.treatment_plan ? <Text style={styles.notesText}>• Plan: {item.notes.treatment_plan}</Text> : null}
                    {item.notes.prescriptions ? <Text style={styles.notesText}>• Prescriptions: {item.notes.prescriptions}</Text> : null}
                  </>
                )}
              </View>
            ) : null}

            <TouchableOpacity 
              style={styles.notesButton}
              onPress={() => openNotesModal(item)}
            >
              <FileText size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.notesButtonText}>
                {item.notes ? 'Edit Summary Notes' : 'Write Summary Notes'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No appointments or consultations recorded yet. 🌸</Text>
          </View>
        }
      />

      {/* Write Notes Modal */}
      <Modal visible={notesModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Consultation Notes</Text>
            <Text style={styles.modalSub}>Patient: {selectedAppt?.clientName}</Text>

            <ScrollView style={{ maxHeight: 300, marginBottom: SPACING.md }}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Symptoms</Text>
                <TextInput
                  style={styles.modalNotesInput}
                  value={symptoms}
                  onChangeText={setSymptoms}
                  placeholder="e.g. Fatigue, mood swings"
                  placeholderTextColor={COLORS.grayMuted}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Diagnosis</Text>
                <TextInput
                  style={styles.modalNotesInput}
                  value={diagnosis}
                  onChangeText={setDiagnosis}
                  placeholder="e.g. Mild Hormonal Imbalance"
                  placeholderTextColor={COLORS.grayMuted}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Treatment Plan *</Text>
                <TextInput
                  style={[styles.modalNotesInput, { height: 80 }]}
                  multiline
                  numberOfLines={3}
                  value={treatmentPlan}
                  onChangeText={setTreatmentPlan}
                  placeholder="e.g. Daily exercise, 8h sleep cycle"
                  placeholderTextColor={COLORS.grayMuted}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Prescriptions</Text>
                <TextInput
                  style={styles.modalNotesInput}
                  value={prescriptions}
                  onChangeText={setPrescriptions}
                  placeholder="e.g. Ashwagandha, Vitamin D3"
                  placeholderTextColor={COLORS.grayMuted}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setNotesModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSaveNotes}
                disabled={savingNotes}
              >
                {savingNotes ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Notes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  consultationCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 15,
    marginBottom: SPACING.sm,
    ...SHADOWS.light,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusCompleted: {
    backgroundColor: '#EAF7EA',
    color: COLORS.success,
  },
  statusActive: {
    backgroundColor: '#E0F2FE',
    color: '#0284C7',
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
  },
  notesBox: {
    marginTop: 10,
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  notesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 8,
  },
  notesButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    width: '100%',
    padding: SPACING.md,
    borderRadius: 20,
    ...SHADOWS.medium,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  modalInputGroup: {
    marginBottom: 10,
  },
  modalInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  modalNotesInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: COLORS.secondary,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
