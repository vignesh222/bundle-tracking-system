import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  ScrollView, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { getBundle } from '../api/bundle.api';

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('manual');
  const scannedRef = useRef(false);

  // Reset to a clean state every time this screen comes into focus (after logging a stage)
  useFocusEffect(
    useCallback(() => {
      setManualId('');
      setMode('manual');
      scannedRef.current = false;
    }, [])
  );

  const lookupBundle = async (bundleId) => {
    if (!bundleId.trim()) {
      Alert.alert('Error', 'Please enter a Bundle ID');
      return;
    }
    setLoading(true);
    try {
      const res = await getBundle(bundleId.trim().toUpperCase());
      navigation.navigate('LogTransition', { bundle: res.data });
    } catch (err) {
      Alert.alert('Bundle Not Found', err.response?.data?.message || `No bundle with ID "${bundleId}"`);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setMode('manual');
    lookupBundle(data);
    setTimeout(() => { scannedRef.current = false; }, 2000);
  };

  const startCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan barcodes');
        return;
      }
    }
    setMode('camera');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>Scan Bundle</Text>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, mode !== 'camera' && styles.tabActive]} onPress={() => setMode('manual')}>
          <Text style={[styles.tabText, mode !== 'camera' && styles.tabTextActive]}>Manual Entry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, mode === 'camera' && styles.tabActive]} onPress={startCamera}>
          <Text style={[styles.tabText, mode === 'camera' && styles.tabTextActive]}>Camera Scan</Text>
        </TouchableOpacity>
      </View>

      {mode === 'camera' ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'] }}
          />
          <View style={styles.scanOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>Point at a barcode or QR code</Text>
          </View>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('manual')}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.manualContainer}>
          <Text style={styles.sectionLabel}>Enter Bundle ID</Text>
          <TextInput
            style={styles.input}
            value={manualId}
            onChangeText={t => setManualId(t.toUpperCase())}
            placeholder="e.g. CK001-B001"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => lookupBundle(manualId)}
          />
          <TouchableOpacity style={styles.lookupBtn} onPress={() => lookupBundle(manualId)} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.lookupBtnText}>Look Up Bundle</Text>}
          </TouchableOpacity>

          <View style={styles.demoIdsCard}>
            <Text style={styles.demoLabel}>Demo Bundle IDs</Text>
            {['CK001-B001', 'CK001-B002', 'FS002-B001', 'CT003-B001'].map(id => (
              <TouchableOpacity key={id} style={styles.demoIdRow} onPress={() => {
                setManualId(id);
                lookupBundle(id);
              }}>
                <Text style={styles.demoIdText}>{id}</Text>
                <Text style={styles.demoIdArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 20 },
  tabs: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 10, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 7 },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontWeight: '600', color: '#64748b', fontSize: 14 },
  tabTextActive: { color: '#0f172a' },
  cameraContainer: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  camera: { height: 320 },
  scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 200, height: 150, borderWidth: 2, borderColor: '#2563eb', borderRadius: 12, backgroundColor: 'transparent' },
  scanHint: { color: '#fff', fontSize: 13, marginTop: 16, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  cancelBtn: { position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  manualContainer: {},
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 16, color: '#0f172a', backgroundColor: '#fff', marginBottom: 12, fontWeight: '600', letterSpacing: 1 },
  lookupBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 24 },
  lookupBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  demoIdsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  demoLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  demoIdRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  demoIdText: { fontSize: 14, fontWeight: '600', color: '#0f172a', fontFamily: Platform?.OS === 'ios' ? 'Courier' : 'monospace' },
  demoIdArrow: { color: '#2563eb', fontWeight: '700' },
});
