import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  getDayEntry,
  upsertDayEntry,
  deleteDayEntry,
  getTradeTimesForDay,
  setTradeTimesForDay,
  DayEntry,
} from '../db/queries';
import { isValidTime, parseFloatOrNull } from '../utils/date';

interface Props {
  date: string;
  onBack: () => void;
}

export default function DayEditScreen({ date, onBack }: Props) {
  const [tradesCount, setTradesCount] = useState('0');
  const [rResult, setRResult] = useState('');
  const [pnlPercent, setPnlPercent] = useState('');
  const [note, setNote] = useState('');
  const [heldPlan, setHeldPlan] = useState(false);
  const [outOfSetup, setOutOfSetup] = useState(false);
  const [movedSL, setMovedSL] = useState(false);
  const [revengeTrade, setRevengeTrade] = useState(false);
  const [tradeTimes, setTradeTimes] = useState<string[]>([]);
  const [newTime, setNewTime] = useState('');
  const [isExisting, setIsExisting] = useState(false);

  useEffect(() => {
    loadEntry();
  }, [date]);

  async function loadEntry() {
    try {
      const entry = await getDayEntry(date);
      if (entry) {
        setIsExisting(true);
        setTradesCount(String(entry.tradesCount));
        setRResult(entry.rResult !== null ? String(entry.rResult) : '');
        setPnlPercent(entry.pnlPercent !== null ? String(entry.pnlPercent) : '');
        setNote(entry.note ?? '');
        setHeldPlan(entry.heldPlan);
        setOutOfSetup(entry.outOfSetup);
        setMovedSL(entry.movedSL);
        setRevengeTrade(entry.revengeTrade);
      }
      const times = await getTradeTimesForDay(date);
      setTradeTimes(times.map((t) => t.time));
    } catch {
      // ignore
    }
  }

  async function handleSave() {
    const tc = parseInt(tradesCount, 10);
    if (isNaN(tc) || tc < 0) {
      Alert.alert('Validation', 'Trades count must be >= 0');
      return;
    }

    const entry: DayEntry = {
      date,
      tradesCount: tc,
      rResult: parseFloatOrNull(rResult),
      pnlPercent: parseFloatOrNull(pnlPercent),
      note: note.trim() || null,
      heldPlan,
      outOfSetup,
      movedSL,
      revengeTrade,
    };

    try {
      await upsertDayEntry(entry);
      await setTradeTimesForDay(date, tradeTimes);
      onBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save');
    }
  }

  async function handleDelete() {
    Alert.alert('Delete', `Delete entry for ${date}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDayEntry(date);
            onBack();
          } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Failed to delete');
          }
        },
      },
    ]);
  }

  function addTradeTime() {
    const t = newTime.trim();
    if (!isValidTime(t)) {
      Alert.alert('Validation', 'Time must be in HH:MM format (00:00 - 23:59)');
      return;
    }
    setTradeTimes([...tradeTimes, t]);
    setNewTime('');
  }

  function removeTradeTime(index: number) {
    setTradeTimes(tradeTimes.filter((_, i) => i !== index));
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.dateHeader}>{date}</Text>

      <Text style={styles.label}>Trades Count</Text>
      <TextInput
        style={styles.input}
        value={tradesCount}
        onChangeText={setTradesCount}
        keyboardType="numeric"
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>R Result</Text>
      <TextInput
        style={styles.input}
        value={rResult}
        onChangeText={setRResult}
        keyboardType="numeric"
        placeholder="e.g. 1.5 or -0.8"
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>PnL %</Text>
      <TextInput
        style={styles.input}
        value={pnlPercent}
        onChangeText={setPnlPercent}
        keyboardType="numeric"
        placeholder="e.g. 2.3 or -1.1"
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>Note</Text>
      <TextInput
        style={[styles.input, styles.noteInput]}
        value={note}
        onChangeText={setNote}
        multiline={true}
        numberOfLines={3}
        placeholder="Trading notes..."
        placeholderTextColor="#666"
      />

      <Text style={styles.sectionTitle}>Quality Checklist</Text>

      <CheckRow label="Held Plan" value={heldPlan} onToggle={setHeldPlan} positiveColor="#4caf50" />
      <CheckRow label="Out of Setup" value={outOfSetup} onToggle={setOutOfSetup} positiveColor="#f44336" />
      <CheckRow label="Moved SL" value={movedSL} onToggle={setMovedSL} positiveColor="#f44336" />
      <CheckRow label="Revenge Trade" value={revengeTrade} onToggle={setRevengeTrade} positiveColor="#f44336" />

      <Text style={styles.sectionTitle}>Trade Times</Text>
      {tradeTimes.map((t, i) => (
        <View key={i} style={styles.timeRow}>
          <Text style={styles.timeText}>{t}</Text>
          <TouchableOpacity onPress={() => removeTradeTime(i)} style={styles.removeBtn}>
            <Text style={styles.removeBtnText}>X</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.addTimeRow}>
        <TextInput
          style={[styles.input, styles.timeInput]}
          value={newTime}
          onChangeText={setNewTime}
          placeholder="HH:MM"
          placeholderTextColor="#666"
          maxLength={5}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addTradeTime}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
        {isExisting ? (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

function CheckRow({ label, value, onToggle, positiveColor }: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  positiveColor: string;
}) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={() => onToggle(!value)} activeOpacity={0.7}>
      <Text style={styles.checkLabel}>{label}</Text>
      <View style={[styles.checkbox, value ? { backgroundColor: positiveColor } : undefined]}>
        {value ? <Text style={styles.checkmark}>{'V'}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    padding: 16,
  },
  dateHeader: {
    fontSize: 22,
    color: '#bb86fc',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  noteInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 17,
    color: '#bb86fc',
    marginTop: 20,
    marginBottom: 10,
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  checkLabel: {
    color: '#ddd',
    fontSize: 15,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  timeText: {
    color: '#fff',
    fontSize: 16,
  },
  removeBtn: {
    backgroundColor: '#f44336',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  removeBtnText: {
    color: '#fff',
  },
  addTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  timeInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
  },
  addBtn: {
    backgroundColor: '#bb86fc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addBtnText: {
    color: '#121212',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#f44336',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});
