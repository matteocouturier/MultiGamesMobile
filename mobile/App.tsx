import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from './src/state/store';
import { Body } from './src/components/ui';
import { theme } from './src/theme';
import { NameScreen } from './src/screens/NameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { GameScreen } from './src/screens/GameScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';

function Router() {
  const { playerName, room, results } = useStore();

  if (!playerName) return <NameScreen />;
  if (!room) return <HomeScreen />;
  if (room.status === 'finished' || results) return <ResultsScreen />;
  if (room.status === 'in_game') return <GameScreen />;
  return <LobbyScreen />;
}

function ErrorBanner() {
  const { error, clearError } = useStore();
  if (!error) return null;
  return (
    <Pressable style={styles.banner} onPress={clearError}>
      <Body style={styles.bannerText}>{error} (toucher pour fermer)</Body>
    </Pressable>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
          <View style={styles.fill}>
            <Router />
            <ErrorBanner />
          </View>
        </SafeAreaView>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  fill: { flex: 1 },
  banner: {
    position: 'absolute',
    top: theme.spacing(1),
    left: theme.spacing(2),
    right: theme.spacing(2),
    backgroundColor: theme.colors.danger,
    borderRadius: theme.radius.md,
    padding: theme.spacing(1.5),
  },
  bannerText: { color: theme.colors.white, textAlign: 'center', fontWeight: '600' },
});
