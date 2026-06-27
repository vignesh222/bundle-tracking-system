import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, TextInput, Platform,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { logTransition } from '../api/transition.api';
import { enqueueTransition, getQueue, removeFromQueue } from '../utils/offlineQueue';
import api from '../api/axiosInstance';

const STAGE_ORDER = ['cutting', 'stitching', 'finishing', 'packing'];
const STAGE_COLORS = {
  cutting: '#3b82f6',
  stitching: '#8b5cf6',
  finishing: '#f59e0b',
  packing: '#10b981',
};

const goToScan = (navigation) =>
  navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }));

export default function LogTransitionScreen({ route, navigation }) {
  const [bundle, setBundle] = useState(route.params.bundle);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);

  const currentIdx = STAGE_ORDER.indexOf(bundle.currentStage);
  const nextStage = STAGE_ORDER[currentIdx + 1];
  const isPacked = bundle.status === 'packed';

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => setIsOnline(state.isConnected ?? true));
    getQueue().then(q => setQueueCount(q.length));
    return () => unsub();
  }, []);

  const handleSync = async () => {
    const queue = await getQueue();
    if (queue.length === 0) {
      Alert.alert('Queue Empty', 'No pending transitions to sync');
      return;
    }
    let synced = 0;
    for (const item of queue) {
      try {
        await api.post('/transitions', { bundleId: item.bundleId, toStage: item.toStage, notes: item.notes });
        await removeFromQueue(item.id);
        synced++;
      } catch {}
    }
    const remaining = await getQueue();
    setQueueCount(remaining.length);
    Alert.alert('Sync Complete', `${synced} of ${queue.length} transitions synced`);
  };

  const handleLog = async () => {
    if (!nextStage) return;
    setSubmitting(true);
    const payload = { bundleId: bundle.bundleId, toStage: nextStage, notes };

    if (!isOnline) {
      await enqueueTransition(payload);
      const q = await getQueue();
      setQueueCount(q.length);
      Alert.alert(
        'Saved Offline',
        `Transition queued (${q.length} pending). Will sync when back online.`,
        [{ text: 'OK', onPress: () => goToScan(navigation) }]
      );
      setSubmitting(false);
      return;
    }

    try {
      const res = await logTransition(payload);
      // Update local bundle state with fresh data from the response
      const updatedBundle = res.data?.bundle || { ...bundle, currentStage: nextStage, status: nextStage === 'packing' ? 'packed' : bundle.status };
      setBundle(updatedBundle);
      setNotes('');
      Alert.alert(
        'Stage Logged!',
        `Bundle ${bundle.bundleId} moved to ${nextStage}`,
        [{ text: 'Scan Next', onPress: () => goToScan(navigation) }]
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to log transition');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline — transitions will be queued</Text>
          {queueCount > 0 && <Text style={styles.offlineCount}>{queueCount} pending</Text>}
        </View>
      )}

      {isOnline && queueCount > 0 && (
        <TouchableOpacity style={styles.syncBanner} onPress={handleSync}>
          <Text style={styles.syncText}>{queueCount} queued transitions — Tap to sync</Text>
        </TouchableOpacity>
      )}

      <View style={styles.bundleCard}>
        <Text style={styles.bundleId}>{bundle.bundleId}</Text>
        <Text style={styles.bundleStyle}>{bundle.styleId?.name} · {bundle.styleId?.code}</Text>
        <Text style={styles.bundleQty}>{bundle.quantity} pieces</Text>
      </View>

      <Text style={styles.sectionLabel}>Stage Progress</Text>
      <View style={styles.stageRow}>
        {STAGE_ORDER.map((stage, i) => {
          const done = i < currentIdx;
          const current = i === currentIdx;
          const isNext = i === currentIdx + 1;
          return (
            <React.Fragment key={stage}>
              {i > 0 && <View style={[styles.stageLine, (done || current) && styles.stageLineDone]} />}
              <View style={[styles.stageDot, done && styles.stageDotDone, current && { backgroundColor: STAGE_COLORS[stage], borderColor: STAGE_COLORS[stage] }, isNext && styles.stageDotNext]}>
                {done && <Text style={styles.stageDotCheck}>✓</Text>}
              </View>
            </React.Fragment>
          );
        })}
      </View>
      <View style={styles.stageLabelRow}>
        {STAGE_ORDER.map(stage => (
          <Text key={stage} style={[styles.stageLabel, stage === bundle.currentStage && { color: STAGE_COLORS[stage], fontWeight: '700' }]}>
            {stage.charAt(0).toUpperCase() + stage.slice(1)}
          </Text>
        ))}
      </View>

      <View style={styles.transitionCard}>
        {isPacked ? (
          <View style={styles.packedBadge}>
            <Text style={styles.packedText}>✓ Bundle Complete — Packed</Text>
          </View>
        ) : nextStage ? (
          <>
            <Text style={styles.transitionTitle}>Log Next Stage</Text>
            <View style={styles.transitionRow}>
              <View style={[styles.stageChip, { backgroundColor: STAGE_COLORS[bundle.currentStage] + '22', borderColor: STAGE_COLORS[bundle.currentStage] }]}>
                <Text style={[styles.stageChipText, { color: STAGE_COLORS[bundle.currentStage] }]}>{bundle.currentStage}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
              <View style={[styles.stageChip, { backgroundColor: STAGE_COLORS[nextStage] + '22', borderColor: STAGE_COLORS[nextStage] }]}>
                <Text style={[styles.stageChipText, { color: STAGE_COLORS[nextStage] }]}>{nextStage}</Text>
              </View>
            </View>

            <Text style={styles.notesLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={[styles.logBtn, { backgroundColor: STAGE_COLORS[nextStage] }]} onPress={handleLog} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.logBtnText}>
                  {isOnline ? `Log: ${nextStage.charAt(0).toUpperCase() + nextStage.slice(1)}` : `Queue for ${nextStage}`}
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16, paddingBottom: 40 },
  offlineBanner: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d', borderRadius: 10, padding: 12, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  offlineText: { color: '#92400e', fontWeight: '600', fontSize: 13 },
  offlineCount: { color: '#92400e', fontWeight: '700', fontSize: 12, backgroundColor: '#fcd34d', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  syncBanner: { backgroundColor: '#dbeafe', borderWidth: 1, borderColor: '#93c5fd', borderRadius: 10, padding: 12, marginBottom: 16, alignItems: 'center' },
  syncText: { color: '#1e40af', fontWeight: '600', fontSize: 13 },
  bundleCard: { backgroundColor: '#0f172a', borderRadius: 14, padding: 20, marginBottom: 20 },
  bundleId: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 1, fontFamily: Platform?.OS === 'ios' ? 'Courier' : 'monospace' },
  bundleStyle: { color: '#94a3b8', fontSize: 14, marginTop: 6 },
  bundleQty: { color: '#60a5fa', fontSize: 14, fontWeight: '600', marginTop: 4 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  stageRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingHorizontal: 8 },
  stageDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  stageDotDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  stageDotNext: { borderColor: '#2563eb', borderWidth: 2, borderStyle: 'dashed' },
  stageDotCheck: { color: '#fff', fontSize: 12, fontWeight: '800' },
  stageLine: { flex: 1, height: 2, backgroundColor: '#e2e8f0' },
  stageLineDone: { backgroundColor: '#10b981' },
  stageLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 },
  stageLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600', textAlign: 'center', width: 60, textTransform: 'capitalize' },
  transitionCard: { backgroundColor: '#fff', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  packedBadge: { backgroundColor: '#d1fae5', padding: 16, borderRadius: 10, alignItems: 'center' },
  packedText: { color: '#065f46', fontWeight: '700', fontSize: 16 },
  transitionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  transitionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 },
  stageChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  stageChipText: { fontWeight: '700', fontSize: 13, textTransform: 'capitalize' },
  arrow: { fontSize: 20, color: '#64748b', fontWeight: '700' },
  notesLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  notesInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc', minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  logBtn: { borderRadius: 12, padding: 16, alignItems: 'center' },
  logBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
