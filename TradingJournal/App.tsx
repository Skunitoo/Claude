import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getDatabase } from './src/db/init';
import CalendarScreen from './src/screens/CalendarScreen';
import DayEditScreen from './src/screens/DayEditScreen';
import WeekSummaryScreen from './src/screens/WeekSummaryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

type Tab = 'calendar' | 'week' | 'settings';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? 36 : 50;

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [editDate, setEditDate] = useState<string | null>(null);
  // refreshKey forces screens to reload data when returning from DayEdit
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        await getDatabase();
        setDbReady(true);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to initialize database');
      }
    })();
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <StatusBar style="light" />
        <Text style={styles.errorText}>DB Error: {error}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.center}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  function handleDayPress(date: string) {
    setEditDate(date);
  }

  function handleBackFromEdit() {
    setEditDate(null);
    setRefreshKey((k) => k + 1);
  }

  // If editing a day, show full-screen DayEditScreen
  if (editDate) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.statusBarSpacer} />
        <Header title="Edit Day" onBack={handleBackFromEdit} />
        <DayEditScreen date={editDate} onBack={handleBackFromEdit} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.statusBarSpacer} />
      <Header title={activeTab === 'calendar' ? 'Trading Calendar' : activeTab === 'week' ? 'Week Summary' : 'Settings'} />
      <View style={styles.content}>
        {activeTab === 'calendar' && (
          <CalendarScreen key={`cal-${refreshKey}`} onDayPress={handleDayPress} />
        )}
        {activeTab === 'week' && (
          <WeekSummaryScreen key={`week-${refreshKey}`} />
        )}
        {activeTab === 'settings' && (
          <SettingsScreen />
        )}
      </View>
      <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

function Header({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backBtn} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

function TabBar({ activeTab, onTabPress }: { activeTab: Tab; onTabPress: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'calendar', label: 'Calendar', icon: 'Cal' },
    { key: 'week', label: 'Week', icon: 'Wk' },
    { key: 'settings', label: 'Settings', icon: 'Set' },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, active ? styles.tabActive : undefined]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabLabel, active ? styles.tabActive : undefined]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 12,
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
    padding: 20,
    textAlign: 'center',
  },
  statusBarSpacer: {
    height: STATUS_BAR_HEIGHT,
    backgroundColor: '#1e1e1e',
  },
  header: {
    height: 48,
    backgroundColor: '#1e1e1e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#bb86fc',
    fontSize: 18,
  },
  backBtn: {
    width: 70,
  },
  backText: {
    color: '#bb86fc',
    fontSize: 15,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    height: 56,
    backgroundColor: '#1e1e1e',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 16,
    color: '#888',
  },
  tabLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  tabActive: {
    color: '#bb86fc',
  },
});
