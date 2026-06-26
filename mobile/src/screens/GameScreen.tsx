import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Body, Button, Screen } from '../components/ui';
import { theme } from '../theme';
import { useStore } from '../state/store';
import { GAME_VIEWS } from '../games/registry';

type EventInfo = { text: string; color: string };

// Resolve a toast (text + color) from a game event. Covers all games; new games
// can emit their own event types and add a case here.
function resolveEvent(event: { type: string; payload?: any } | null): EventInfo | null {
  if (!event) return null;
  const p = event.payload ?? {};
  switch (event.type) {
    case 'found':
      return { text: '✓ Mot trouvé !', color: theme.colors.success };
    case 'pass':
      return { text: '→ Passé', color: theme.colors.textMuted };
    case 'foul':
      return { text: '⚠ Faute !', color: theme.colors.warning };
    case 'ok':
      return { text: p.word ? `✓ ${p.word}` : '✓ Validé', color: theme.colors.success };
    case 'boom':
      return { text: `💥 ${p.name ?? ''} explose !`, color: theme.colors.danger };
    case 'invalid':
      return { text: `✗ ${p.reason ?? 'invalide'}`, color: theme.colors.warning };
    default:
      return null;
  }
}

export function GameScreen() {
  const { room, gameState, lastEvent, leaveRoom } = useStore();
  if (!room) return null;
  const View_ = GAME_VIEWS[room.gameId];

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Quitter" variant="ghost" small onPress={leaveRoom} />
        <Body style={styles.code}>Salon {room.code}</Body>
      </View>

      {gameState && View_ ? (
        <View_ state={gameState} />
      ) : (
        <Body style={styles.loading}>Préparation de la partie...</Body>
      )}

      <Toast event={lastEvent} />
    </Screen>
  );
}

function Toast({ event }: { event: { type: string } | null }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!event) return;
    opacity.setValue(0);
    translateY.setValue(20);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  }, [event, opacity, translateY]);

  if (!event) return null;
  const info = resolveEvent(event);
  if (!info) return null;

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]} pointerEvents="none">
      <View style={[styles.toastInner, { borderColor: info.color }]}>
        <Body style={[styles.toastText, { color: info.color }]}>{info.text}</Body>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing(1.5) },
  code: { color: theme.colors.textMuted, fontWeight: '700' },
  loading: { color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing(10) },
  toast: { position: 'absolute', left: 0, right: 0, top: '42%', alignItems: 'center' },
  toastInner: {
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(1.5),
    borderRadius: theme.radius.pill,
    borderWidth: 2,
  },
  toastText: { fontSize: theme.font.h2, fontWeight: '900' },
});
