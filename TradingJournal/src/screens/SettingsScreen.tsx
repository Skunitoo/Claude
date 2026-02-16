import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { getSetting, setSetting } from '../db/queries';

export default function SettingsScreen() {
  const [maxTrades, setMaxTrades] = useState('2');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const val = await getSetting('maxTradesPerDay');
      if (val) setMaxTrades(val);
    } catch {
      // DB not ready
    }
  }

  async function handleSave() {
    const n = parseInt(maxTrades, 10);
    if (isNaN(n) || n < 0) {
      Alert.alert('Validation', 'Max trades per day must be a non-negative integer');
      return;
    }
    try {
      await setSetting('maxTradesPerDay', String(n));
      Alert.alert('Saved', 'Settings saved successfully');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save');
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.label}>Max Trades Per Day</Text>
      <Text style={styles.hint}>
        Days exceeding this limit will show a "Breach" badge on the calendar.
      </Text>
      <TextInput
        style={styles.input}
        value={maxTrades}
        onChangeText={setMaxTrades}
        keyboardType="numeric"
        placeholderTextColor="#666"
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Trading Calendar Journal</Text>
        <Text style={styles.infoText}>Version 1.0.0</Text>
        <Text style={styles.infoText}>All data stored locally on device.</Text>
        <Text style={styles.infoText}>No cloud, no login, no tracking.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  label: {
    color: '#ccc',
    fontSize: 15,
    marginBottom: 4,
  },
  hint: {
    color: '#777',
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  infoBox: {
    marginTop: 40,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  infoTitle: {
    color: '#bb86fc',
    fontSize: 16,
    marginBottom: 8,
  },
  infoText: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
  },
});
