import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookOpen, Plus, Trash2, Calendar, Heart, Activity,
  Smile, Droplet, User, Check, Edit2, Download,
  ArrowLeft, Search, Pill, Stethoscope, Sparkles, FileText, X
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translate } from '../utils/i18n';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import diaryApi from '../api/diaryApi';

const FORM_TABS = [
  { key: 'clinical', label: '🩺 Clinical' },
  { key: 'medicines', label: '💊 Medicines' },
  { key: 'diet', label: '🥗 Diet & Water' },
  { key: 'harmony', label: '💖 Harmony' },
  { key: 'reflections', label: '📝 Reflections' }
];

const MOOD_OPTIONS = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Calm', emoji: '🧘' },
  { label: 'Stressed', emoji: '😰' },
  { label: 'Tired', emoji: '😴' },
  { label: 'Sad', emoji: '😢' },
  { label: 'Angry', emoji: '😡' }
];

export default function SakhiDiaryScreen({ navigation }) {
  const { user } = useAuth();
  const { langCode } = useLanguage();
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('clinical');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Form State matching Web Frontend Tabs
  const [formData, setFormData] = useState({
    id: null,
    entryDate: new Date().toISOString().split('T')[0],
    symptoms: '',
    diagnosis: '',
    doctorNotes: '',
    meals: '',
    waterIntake: 2.5,
    dietType: 'General / Standard Diet',
    mood: 'Happy 😊',
    harmonyNotes: '',
    gratitude: '',
    personalNotes: '',
    medicines: []
  });

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await diaryApi.getEntries();
      const list = res?.entries || res?.data?.entries || res?.data || [];
      setEntries(list);
      if (list.length > 0 && !selectedEntry) {
        setSelectedEntry(list[0]);
      }
    } catch (e) {
      console.error('Failed to load diary entries:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleOpenCreate = () => {
    setFormData({
      id: null,
      entryDate: new Date().toISOString().split('T')[0],
      symptoms: '',
      diagnosis: '',
      doctorNotes: '',
      meals: '',
      waterIntake: 2.5,
      dietType: 'General / Standard Diet',
      mood: 'Happy 😊',
      harmonyNotes: '',
      gratitude: '',
      personalNotes: '',
      medicines: []
    });
    setActiveTab('clinical');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry) => {
    const item = entry || selectedEntry;
    if (!item) return;
    setFormData({
      id: item.id,
      entryDate: item.entryDate ? new Date(item.entryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      symptoms: item.symptoms || '',
      diagnosis: item.diagnosis || '',
      doctorNotes: item.doctorNotes || '',
      meals: item.meals || '',
      waterIntake: item.waterIntake || 2.5,
      dietType: item.dietType || 'General / Standard Diet',
      mood: item.mood || 'Happy 😊',
      harmonyNotes: item.harmonyNotes || '',
      gratitude: item.gratitude || '',
      personalNotes: item.personalNotes || '',
      medicines: item.medicines || []
    });
    setActiveTab('clinical');
    setIsModalOpen(true);
  };

  const handleAddMedicineRow = () => {
    setFormData(prev => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        {
          name: '',
          dosage: '1-0-1 (Morning & Night)',
          schedule: 'After Food',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          memberName: 'Myself'
        }
      ]
    }));
  };

  const handleUpdateMedicineRow = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.medicines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, medicines: updated };
    });
  };

  const handleRemoveMedicineRow = (index) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const handleSaveEntry = async () => {
    setIsSaving(true);
    try {
      const payload = {
        id: formData.id,
        entryDate: formData.entryDate,
        symptoms: formData.symptoms,
        diagnosis: formData.diagnosis,
        doctorNotes: formData.doctorNotes,
        meals: formData.meals,
        waterIntake: Number(formData.waterIntake),
        dietType: formData.dietType,
        mood: formData.mood,
        harmonyNotes: formData.harmonyNotes,
        gratitude: formData.gratitude,
        personalNotes: formData.personalNotes,
        medicines: formData.medicines
      };

      let res;
      if (formData.id) {
        res = await diaryApi.updateEntry(formData.id, payload);
      } else {
        res = await diaryApi.createEntry(payload);
      }

      Alert.alert('Success 🎉', 'Daily diary health log saved successfully!');
      setIsModalOpen(false);
      loadEntries();
      if (res?.data) {
        setSelectedEntry(res.data);
      }
    } catch (e) {
      console.error('Failed to save entry:', e);
      Alert.alert('Error', 'Error saving diary log. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = (id) => {
    Alert.alert(
      'Delete Diary Log',
      'Are you sure you want to delete this diary entry? 🗑️',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await diaryApi.deleteEntry(id);
              if (selectedEntry?.id === id) {
                setSelectedEntry(null);
              }
              loadEntries();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete entry.');
            }
          }
        }
      ]
    );
  };

  const handleGeneratePdfReport = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const patientName = user?.name || user?.fullName || 'Health Sakhi Member';
      const targetDate = selectedEntry?.entryDate ? new Date(selectedEntry.entryDate).toISOString().split('T')[0] : '';
      const result = await diaryApi.downloadReport({
        patientName,
        dateScope: selectedEntry ? 'selected' : 'all',
        targetDate
      });
      if (result && result.success) {
        Alert.alert(
          'Report PDF Saved & Opened 🎉',
          `Clinical health report for ${patientName} downloaded and opened successfully!`
        );
      }
    } catch (e) {
      console.error('Failed to generate PDF report:', e);
      Alert.alert(
        'Download Failed ❌',
        e?.message || 'Unable to download Sakhi Diary PDF report. Please check connection and retry.'
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredEntries = entries.filter(item => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      (item.symptoms && item.symptoms.toLowerCase().includes(q)) ||
      (item.diagnosis && item.diagnosis.toLowerCase().includes(q)) ||
      (item.doctorNotes && item.doctorNotes.toLowerCase().includes(q)) ||
      (item.meals && item.meals.toLowerCase().includes(q)) ||
      (item.personalNotes && item.personalNotes.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <BookOpen size={20} color={COLORS.secondary} />
          <Text style={styles.headerTitle}>{translate('sakhiDiary', langCode) || 'Sakhi Diary'}</Text>
        </View>
        <TouchableOpacity onPress={handleOpenCreate} style={styles.writeHeaderBtn}>
          <Plus size={16} color={COLORS.white} />
          <Text style={styles.writeHeaderBtnText}>LOG</Text>
        </TouchableOpacity>
      </View>

      {/* Main Screen Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Top Banner (Matching Web UI Screenshots) */}
          <View style={styles.banner}>
            <View style={styles.bannerTag}>
              <Text style={styles.bannerTagText}>WELLNESS DIARY</Text>
            </View>
            <Text style={styles.bannerTitle}>📔 Sakhi Diary</Text>
            <Text style={styles.bannerSub}>
              TRACK DAILY HEALTH METRICS, FAMILY MEDICINES, WATER NUTRITION, AND EMOTIONAL GRATITUDE.
            </Text>

            <View style={styles.bannerBtnRow}>
              <TouchableOpacity
                style={styles.pdfReportBtn}
                onPress={handleGeneratePdfReport}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Download size={14} color={COLORS.primary} />
                    <Text style={styles.pdfReportBtnText}>{translate('generateReport', langCode) || 'GENERATE REPORT'}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.bannerWriteBtn} onPress={handleOpenCreate}>
                <Plus size={14} color={COLORS.primary} />
                <Text style={styles.bannerWriteBtnText}>+ WRITE HEALTH LOG</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBox}>
            <Search size={16} color={COLORS.grayMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search symptoms, medicines, notes..."
              placeholderTextColor={COLORS.grayMuted}
            />
          </View>

          {/* Timeline Logs List */}
          <Text style={styles.sectionTitle}>Timeline Logs ({filteredEntries.length})</Text>

          {filteredEntries.length === 0 ? (
            <View style={styles.emptyBox}>
              <BookOpen size={40} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No health logs found</Text>
              <Text style={styles.emptySub}>Tap "+ WRITE HEALTH LOG" to record your daily symptoms and nutrition.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timelineScroll}>
              {filteredEntries.map(item => {
                const isSelected = selectedEntry?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.timelineChip, isSelected && styles.timelineChipSelected]}
                    onPress={() => setSelectedEntry(item)}
                  >
                    <View style={styles.timelineHeader}>
                      <Calendar size={14} color={isSelected ? COLORS.secondary : COLORS.primary} />
                      <Text style={[styles.timelineDate, isSelected && styles.timelineDateSelected]}>
                        {formatDate(item.entryDate || item.createdAt)}
                      </Text>
                      <TouchableOpacity onPress={() => handleDeleteEntry(item.id)} style={{ marginLeft: 6 }}>
                        <Trash2 size={12} color={COLORS.rose} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.timelineDesc} numberOfLines={1}>
                      {item.symptoms || item.diagnosis || 'Daily Wellness Log'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Selected Entry Details Card (Matching Web UI) */}
          {selectedEntry && (
            <View style={styles.detailContainer}>
              <View style={styles.detailHeader}>
                <View>
                  <Text style={styles.detailTitle}>Log Details: {formatDate(selectedEntry.entryDate || selectedEntry.createdAt)}</Text>
                  <Text style={styles.detailSub}>LOGGED IN SAKHI DATABASE</Text>
                </View>
                <TouchableOpacity style={styles.updateBtn} onPress={() => handleOpenEdit(selectedEntry)}>
                  <Edit2 size={12} color={COLORS.secondary} />
                  <Text style={styles.updateBtnText}>UPDATE LOG</Text>
                </TouchableOpacity>
              </View>

              {/* 🩺 Clinical Profile Card */}
              <View style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <Stethoscope size={16} color={COLORS.secondary} />
                  <Text style={styles.cardTitle}>CLINICAL PROFILE</Text>
                </View>
                <Text style={styles.fieldLabel}>SYMPTOMS LOGGED</Text>
                <Text style={styles.fieldVal}>{selectedEntry.symptoms || 'None'}</Text>

                <Text style={styles.fieldLabel}>DIAGNOSIS</Text>
                <Text style={styles.fieldVal}>{selectedEntry.diagnosis || 'General Checkup'}</Text>

                <Text style={styles.fieldLabel}>DOCTOR VISIT NOTES</Text>
                <Text style={styles.fieldVal}>{selectedEntry.doctorNotes || 'No advice notes added.'}</Text>
              </View>

              {/* 🥗 Diet & Hydration Card */}
              <View style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <Smile size={16} color="#F59E0B" />
                  <Text style={styles.cardTitle}>DIET & HYDRATION</Text>
                </View>
                <Text style={styles.fieldLabel}>DIET TYPE</Text>
                <View style={styles.dietBadge}>
                  <Text style={styles.dietBadgeText}>{selectedEntry.dietType || 'General / Standard Diet'}</Text>
                </View>

                <Text style={styles.fieldLabel}>DAILY MEALS DETAILS</Text>
                <Text style={styles.fieldVal}>{selectedEntry.meals || 'Balanced diet logged.'}</Text>

                <Text style={styles.fieldLabel}>WATER INTAKE GOAL</Text>
                <View style={styles.waterBarTrack}>
                  <View style={[styles.waterBarFill, { width: `${Math.min(100, ((selectedEntry.waterIntake || 2.5) / 4) * 100)}%` }]} />
                </View>
                <Text style={styles.waterText}>{selectedEntry.waterIntake || 2.5}L / 4.0L</Text>
              </View>

              {/* 💊 Medication Track List Card */}
              <View style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <Pill size={16} color="#9333EA" />
                  <Text style={styles.cardTitle}>MEDICATION TRACK LIST ({selectedEntry.medicines?.length || 0})</Text>
                </View>
                {(!selectedEntry.medicines || selectedEntry.medicines.length === 0) ? (
                  <Text style={styles.fieldVal}>No active prescriptions for this date.</Text>
                ) : (
                  selectedEntry.medicines.map((med, idx) => (
                    <View key={idx} style={styles.medRow}>
                      <Text style={styles.medName}>💊 {med.name}</Text>
                      <Text style={styles.medDetails}>{med.dosage} ({med.schedule || 'After Food'})</Text>
                      {med.memberName ? <Text style={styles.medMemberTag}>Tag: {med.memberName}</Text> : null}
                    </View>
                  ))
                )}
              </View>

              {/* 💖 Harmony & Reflections Card */}
              <View style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <Heart size={16} color={COLORS.secondary} />
                  <Text style={styles.cardTitle}>HARMONY & REFLECTIONS</Text>
                </View>
                <Text style={styles.fieldLabel}>MOOD</Text>
                <Text style={styles.fieldVal}>{selectedEntry.mood || '😊 Happy'}</Text>

                <Text style={styles.fieldLabel}>GRATITUDE LINE</Text>
                <Text style={styles.fieldVal}>{selectedEntry.gratitude || 'Grateful for health & peace.'}</Text>

                <Text style={styles.fieldLabel}>PERSONAL REFLECTION NOTES</Text>
                <Text style={styles.fieldVal}>{selectedEntry.personalNotes || 'Restful day.'}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* 5-Tab Add/Edit Modal CENTERED DIALOG (Matching Web Screenshots 1, 2, 3, 4, 5) */}
      <Modal visible={isModalOpen} animationType="fade" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCenteredBg}>
            <View style={styles.modalCenteredCard}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>📔 {formData.id ? 'Edit Daily Diary Log' : 'Add Daily Diary Log'}</Text>
                  <Text style={styles.modalSub}>SECURE FAMILY HEALTH RECORDS INTEGRATION</Text>
                </View>
                <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.modalCloseBtn}>
                  <X size={18} color={COLORS.grayMuted} />
                </TouchableOpacity>
              </View>

              {/* 5 Form Tabs Bar */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
                {FORM_TABS.map(tab => (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
                    onPress={() => setActiveTab(tab.key)}
                  >
                    <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Form Content Body */}
              <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
                {/* DIARY LOG DATE HEADER BANNER */}
                <View style={styles.dateBoxBanner}>
                  <View>
                    <Text style={styles.dateBoxLabel}>DIARY LOG DATE</Text>
                    <Text style={styles.dateBoxSub}>Log will be attached to chosen date.</Text>
                  </View>
                  <TextInput
                    style={styles.dateInput}
                    value={formData.entryDate}
                    onChangeText={val => setFormData({ ...formData, entryDate: val })}
                    placeholder="YYYY-MM-DD"
                  />
                </View>

                {/* TAB 1: CLINICAL */}
                {activeTab === 'clinical' && (
                  <View style={styles.formSection}>
                    <Text style={styles.inputLabel}>SYMPTOMS</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.symptoms}
                      onChangeText={val => setFormData({ ...formData, symptoms: val })}
                      placeholder="e.g. fever, headache, bodyache..."
                    />

                    <Text style={styles.inputLabel}>DIAGNOSIS</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.diagnosis}
                      onChangeText={val => setFormData({ ...formData, diagnosis: val })}
                      placeholder="e.g. general viral, migraine..."
                    />

                    <Text style={styles.inputLabel}>DOCTOR VISIT NOTES</Text>
                    <TextInput
                      style={[styles.input, { height: 80 }]}
                      multiline
                      value={formData.doctorNotes}
                      onChangeText={val => setFormData({ ...formData, doctorNotes: val })}
                      placeholder="Write advice given by doctor or next visit date..."
                    />
                  </View>
                )}

                {/* TAB 2: MEDICINES */}
                {activeTab === 'medicines' && (
                  <View style={styles.formSection}>
                    <View style={styles.medHeaderRow}>
                      <Text style={styles.inputLabel}>ACTIVE PRESCRIPTIONS</Text>
                      <TouchableOpacity onPress={handleAddMedicineRow} style={styles.addMedBtn}>
                        <Plus size={12} color={COLORS.secondary} />
                        <Text style={styles.addMedBtnText}>+ ADD MEDICINE</Text>
                      </TouchableOpacity>
                    </View>

                    {formData.medicines.length === 0 ? (
                      <Text style={styles.emptySub}>No active medicines added. Tap "+ ADD MEDICINE" to log dosages.</Text>
                    ) : (
                      formData.medicines.map((med, idx) => (
                        <View key={idx} style={styles.medInputCard}>
                          <Text style={styles.inputLabel}>MEDICINE NAME</Text>
                          <TextInput
                            style={styles.input}
                            value={med.name}
                            onChangeText={val => handleUpdateMedicineRow(idx, 'name', val)}
                            placeholder="e.g. Paracetamol 650mg"
                          />
                          <Text style={[styles.inputLabel, { marginTop: 6 }]}>DOSAGE SCHEDULE & MEAL TIMING</Text>
                          <TextInput
                            style={styles.input}
                            value={med.dosage}
                            onChangeText={val => handleUpdateMedicineRow(idx, 'dosage', val)}
                            placeholder="1-0-1 (Morning & Night) | After Food"
                          />
                          <Text style={[styles.inputLabel, { marginTop: 6 }]}>FAMILY MEMBER TAG</Text>
                          <TextInput
                            style={styles.input}
                            value={med.memberName}
                            onChangeText={val => handleUpdateMedicineRow(idx, 'memberName', val)}
                            placeholder="e.g. Mother, Father, Myself"
                          />
                          <TouchableOpacity onPress={() => handleRemoveMedicineRow(idx)} style={styles.removeMedBtn}>
                            <Trash2 size={12} color={COLORS.rose} />
                            <Text style={styles.removeMedText}>Remove Medicine</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                )}

                {/* TAB 3: DIET & WATER */}
                {activeTab === 'diet' && (
                  <View style={styles.formSection}>
                    <Text style={styles.inputLabel}>DIET TYPE PLAN</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.dietType}
                      onChangeText={val => setFormData({ ...formData, dietType: val })}
                      placeholder="General / Standard Diet, BP (HYPERTENSION)..."
                    />

                    <Text style={styles.inputLabel}>WATER CONSUMPTION (LITRES)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(formData.waterIntake)}
                      onChangeText={val => setFormData({ ...formData, waterIntake: val })}
                      placeholder="2"
                    />

                    <Text style={styles.inputLabel}>DAILY MEALS LOGGED</Text>
                    <TextInput
                      style={[styles.input, { height: 80 }]}
                      multiline
                      value={formData.meals}
                      onChangeText={val => setFormData({ ...formData, meals: val })}
                      placeholder="Breakfast: oats & apple; Lunch: dal, brown rice..."
                    />
                  </View>
                )}

                {/* TAB 4: HARMONY */}
                {activeTab === 'harmony' && (
                  <View style={styles.formSection}>
                    <Text style={styles.inputLabel}>SELECT MOOD STATUS</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodRow}>
                      {MOOD_OPTIONS.map(m => {
                        const isSelected = formData.mood?.includes(m.label);
                        return (
                          <TouchableOpacity
                            key={m.label}
                            style={[styles.moodChip, isSelected && styles.moodChipSelected]}
                            onPress={() => setFormData({ ...formData, mood: `${m.label} ${m.emoji}` })}
                          >
                            <Text style={styles.moodEmoji}>{m.emoji}</Text>
                            <Text style={[styles.moodText, isSelected && styles.moodTextSelected]}>{m.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    <Text style={styles.inputLabel}>FAMILY INTERACTION NOTES</Text>
                    <TextInput
                      style={[styles.input, { height: 70 }]}
                      multiline
                      value={formData.harmonyNotes}
                      onChangeText={val => setFormData({ ...formData, harmonyNotes: val })}
                      placeholder="e.g. Shared a happy talk with children..."
                    />

                    <Text style={styles.inputLabel}>TODAY'S GRATITUDE LINE</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.gratitude}
                      onChangeText={val => setFormData({ ...formData, gratitude: val })}
                      placeholder="I am grateful for..."
                    />
                  </View>
                )}

                {/* TAB 5: REFLECTIONS */}
                {activeTab === 'reflections' && (
                  <View style={styles.formSection}>
                    <Text style={styles.inputLabel}>PERSONAL REFLECTIONS & DAILY THOUGHTS</Text>
                    <TextInput
                      style={[styles.input, { height: 110 }]}
                      multiline
                      value={formData.personalNotes}
                      onChangeText={val => setFormData({ ...formData, personalNotes: val })}
                      placeholder="Write down your thoughts, personal worries, reflection comments..."
                    />
                  </View>
                )}
              </ScrollView>

              {/* Modal Footer Buttons */}
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalOpen(false)}>
                  <Text style={styles.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEntry} disabled={isSaving}>
                  {isSaving ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveBtnText}>✓ SAVE LOG</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.primary },
  writeHeaderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  writeHeaderBtnText: { color: COLORS.white, fontWeight: '900', fontSize: 11 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  scroll: { padding: SPACING.md, paddingBottom: 40 },

  // Top Banner
  banner: {
    backgroundColor: '#4B1E5A', borderRadius: 20, padding: 18, marginBottom: 16,
  },
  bannerTag: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 8,
  },
  bannerTagText: { fontSize: 9, fontWeight: '900', color: '#FFB6C1', letterSpacing: 0.5 },
  bannerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white, marginBottom: 4 },
  bannerSub: { fontSize: 10, fontWeight: '700', color: '#FCE7F3', letterSpacing: 0.5, lineHeight: 15, marginBottom: 14 },
  bannerBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  pdfReportBtn: {
    backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  pdfReportBtnText: { fontSize: 10, fontWeight: '900', color: COLORS.primary },
  bannerWriteBtn: {
    backgroundColor: COLORS.softPink, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  bannerWriteBtnText: { fontSize: 10, fontWeight: '900', color: COLORS.secondary },

  // Search Box
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.white, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, ...SHADOWS.light,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textDark },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: COLORS.primary, marginBottom: 10 },

  // Timeline Scroll
  timelineScroll: { gap: 10, paddingBottom: 10 },
  timelineChip: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 12, minWidth: 150,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light,
  },
  timelineChipSelected: { borderColor: COLORS.secondary, backgroundColor: COLORS.softPink },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  timelineDate: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  timelineDateSelected: { color: COLORS.secondary },
  timelineDesc: { fontSize: 11, color: COLORS.grayMuted },
  emptyBox: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginTop: 10 },
  emptySub: { fontSize: 11, color: COLORS.grayMuted, textAlign: 'center', marginTop: 4 },

  // Detail View Cards
  detailContainer: { marginTop: 10 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  detailTitle: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  detailSub: { fontSize: 9, fontWeight: '800', color: COLORS.grayMuted, letterSpacing: 0.5 },
  updateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.softPink, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  updateBtnText: { fontSize: 10, fontWeight: '900', color: COLORS.secondary },
  card: {
    backgroundColor: COLORS.white, borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight, paddingBottom: 8 },
  cardTitle: { fontSize: 12, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.5 },
  fieldLabel: { fontSize: 9, fontWeight: '900', color: COLORS.grayMuted, letterSpacing: 0.5, marginTop: 8 },
  fieldVal: { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginTop: 2, lineHeight: 18 },
  dietBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  dietBadgeText: { fontSize: 10, fontWeight: '900', color: '#16A34A' },
  waterBarTrack: { height: 8, backgroundColor: COLORS.grayLight, borderRadius: 4, overflow: 'hidden', marginTop: 6 },
  waterBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
  waterText: { fontSize: 10, fontWeight: '800', color: COLORS.grayMuted, marginTop: 4, alignSelf: 'flex-end' },
  medRow: { marginTop: 6, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  medName: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  medDetails: { fontSize: 11, color: COLORS.grayMuted, marginTop: 1 },
  medMemberTag: { fontSize: 9, fontWeight: '800', color: COLORS.secondary, marginTop: 2 },

  // CENTERED DIALOG MODAL (Matching Web Screenshots 1, 2, 3, 4, 5)
  modalCenteredBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  modalCenteredCard: {
    width: '100%', maxWidth: 440, backgroundColor: COLORS.white,
    borderRadius: 24, padding: 20, maxHeight: '88%',
    ...SHADOWS.medium,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  modalSub: { fontSize: 9, fontWeight: '800', color: '#E91E63', letterSpacing: 0.5, marginTop: 2 },
  modalCloseBtn: { padding: 4 },
  tabBar: { gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: COLORS.grayLight },
  tabItemActive: { backgroundColor: '#8b1d6b' },
  tabText: { fontSize: 12, fontWeight: '700', color: COLORS.textDark },
  tabTextActive: { color: COLORS.white, fontWeight: '900' },
  formScroll: { paddingVertical: 14 },
  dateBoxBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFF0F5', borderRadius: 14, padding: 12, marginBottom: 14,
  },
  dateBoxLabel: { fontSize: 9, fontWeight: '900', color: '#E91E63', letterSpacing: 0.5 },
  dateBoxSub: { fontSize: 9, color: COLORS.grayMuted, marginTop: 2 },
  dateInput: {
    backgroundColor: COLORS.white, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    fontSize: 12, fontWeight: '800', color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.border,
  },
  formSection: { gap: 10 },
  inputLabel: { fontSize: 9, fontWeight: '900', color: COLORS.grayMuted, letterSpacing: 0.5 },
  input: {
    backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 13, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.border,
  },
  medHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addMedBtn: { backgroundColor: COLORS.softPink, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  addMedBtnText: { color: COLORS.secondary, fontSize: 10, fontWeight: '900' },
  medInputCard: { backgroundColor: COLORS.grayLight, padding: 12, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  removeMedBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-end' },
  removeMedText: { fontSize: 10, fontWeight: '800', color: COLORS.rose },
  moodRow: { gap: 8, paddingVertical: 4 },
  moodChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
  },
  moodChipSelected: { backgroundColor: COLORS.softPink, borderColor: COLORS.secondary },
  moodEmoji: { fontSize: 14 },
  moodText: { fontSize: 12, fontWeight: '700', color: COLORS.textDark },
  moodTextSelected: { fontWeight: '900', color: COLORS.secondary },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, marginTop: 6 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: COLORS.grayLight },
  cancelBtnText: { fontSize: 12, fontWeight: '800', color: COLORS.grayMuted },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, backgroundColor: '#8b1d6b' },
  saveBtnText: { fontSize: 12, fontWeight: '900', color: COLORS.white },
});
