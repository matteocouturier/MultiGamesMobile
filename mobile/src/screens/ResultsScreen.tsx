import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { Body, Button, Card, Screen, Subtitle, Title } from '../components/ui';
import { theme } from '../theme';
import { useStore } from '../state/store';

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['#FFD24D', '#C9D2E0', '#E08A57'];

export function ResultsScreen() {
  const { results, room, myId, rematch, leaveRoom } = useStore();
  const isHost = room?.hostId === myId;
  const winner = results?.ranking[0];

  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [pop]);

  return (
    <Screen style={styles.center}>
      <Body style={styles.kicker}>PARTIE TERMINÉE</Body>

      <Animated.View style={{ transform: [{ scale: pop }], alignItems: 'center' }}>
        <View style={styles.winnerBadge}>
          <Body style={styles.crown}>👑</Body>
        </View>
        {winner && <Title style={styles.winnerName}>{winner.label}</Title>}
        {results?.summary && <Subtitle style={styles.summary}>{results.summary}</Subtitle>}
      </Animated.View>

      <ScrollView style={styles.rankScroll} contentContainerStyle={{ gap: theme.spacing(1.25), paddingVertical: theme.spacing(1) }} showsVerticalScrollIndicator={false}>
        {results?.ranking.map((r, i) => {
          const accent = RANK_COLORS[i] ?? theme.colors.border;
          return (
            <Card key={i} style={[styles.row, i === 0 && styles.winnerRow, { borderColor: i < 3 ? accent : theme.colors.border }]}>
              <Body style={[styles.rank, { color: accent }]}>{MEDALS[i] ?? `${i + 1}`}</Body>
              <Body style={[styles.label, i === 0 && { color: '#FFD24D' }]} numberOfLines={1}>{r.label}</Body>
              <Body style={[styles.score, { color: i === 0 ? '#FFD24D' : theme.colors.text }]}>{r.score}</Body>
            </Card>
          );
        })}
      </ScrollView>

      <View style={styles.actions}>
        {isHost && <Button label="🔁 Rejouer" onPress={rematch} />}
        <Button label="Quitter le salon" variant="ghost" onPress={leaveRoom} />
        {!isHost && <Body style={styles.muted}>En attente de l'hôte pour rejouer...</Body>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center' },
  kicker: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 4, textAlign: 'center', marginBottom: theme.spacing(2) },
  winnerBadge: {
    width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,210,77,0.15)', borderWidth: 1.5, borderColor: '#FFD24D',
    shadowColor: '#FFD24D', shadowOpacity: 0.7, shadowRadius: 28, shadowOffset: { width: 0, height: 0 }, marginBottom: theme.spacing(1.5),
  },
  crown: { fontSize: 52 },
  winnerName: { fontSize: 32, textAlign: 'center' },
  summary: { textAlign: 'center', marginTop: theme.spacing(0.5), marginBottom: theme.spacing(2) },
  rankScroll: { maxHeight: 280, marginTop: theme.spacing(1) },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2), borderWidth: 1.5, paddingVertical: theme.spacing(1.5) },
  winnerRow: { backgroundColor: 'rgba(255,210,77,0.08)' },
  rank: { fontSize: 24, width: 36, textAlign: 'center', fontWeight: '900' },
  label: { flex: 1, fontSize: theme.font.h3, fontWeight: '700', color: theme.colors.text },
  score: { fontSize: theme.font.h3, fontWeight: '900' },
  actions: { gap: theme.spacing(1), marginTop: theme.spacing(2.5) },
  muted: { textAlign: 'center', color: theme.colors.textMuted },
});
