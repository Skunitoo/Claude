import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getDatabase } from './src/db/init';
import CalendarScreen from './src/screens/CalendarScreen';
import DayEditScreen from './src/screens/DayEditScreen';
import WeekSummaryScreen from './src/screens/WeekSummaryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CalendarStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1e1e1e' },
        headerTintColor: '#bb86fc',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="CalendarMain"
        component={CalendarScreen}
        options={{ title: 'Trading Calendar' }}
      />
      <Stack.Screen
        name="DayEdit"
        component={DayEditScreen}
        options={{ title: 'Edit Day' }}
      />
    </Stack.Navigator>
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Calendar: '📅',
    Week: '📊',
    Settings: '⚙️',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{icons[label] || '•'}</Text>
      <Text style={{ color: focused ? '#bb86fc' : '#888', fontSize: 10 }}>{label}</Text>
    </View>
  );
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
        setDbReady(true);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to initialize database');
      }
    }
    init();
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>DB Error: {error}</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.loadingText}>Loading...</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#1e1e1e',
              borderTopColor: '#333',
            },
            tabBarActiveTintColor: '#bb86fc',
            tabBarInactiveTintColor: '#888',
            tabBarShowLabel: false,
          }}
        >
          <Tab.Screen
            name="Calendar"
            component={CalendarStack}
            options={{
              tabBarIcon: ({ focused }) => <TabIcon label="Calendar" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Week"
            component={WeekSummaryScreen}
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: '#1e1e1e' },
              headerTintColor: '#bb86fc',
              title: 'Week Summary',
              tabBarIcon: ({ focused }) => <TabIcon label="Week" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: '#1e1e1e' },
              headerTintColor: '#bb86fc',
              title: 'Settings',
              tabBarIcon: ({ focused }) => <TabIcon label="Settings" focused={focused} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
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
});
