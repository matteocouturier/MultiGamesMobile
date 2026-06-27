import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface StroopState {
  phase: 'round' | 'reveal' | 'ended';
  round: number; totalRounds: number;
  wordLabel: string; inkHex: string;
  options: { key: string; label: string; hex: string }[];
  timeLeft: number; duration: number;
  winnerName: string | null;
  iWon: boolean;
  scores: { name: string; wins: number; isMe: boolean }[];
  actions: string[];
}

export function StroopView({ state }: { state: StroopState }) {
  const { sendAction } = useStore();

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Manche ${state.round}/${state.totalRounds}`} color={theme.colors.textMuted} />
        <Pill label={`⏱️ ${state.timeLeft}s`} color={state.timeLeft <= 3 ? theme.colors.danger : '#FF4D88'} filled />
      </View>

      <Card style={styles.wordCard}>
        {state.phase === 'reveal' ? (
          <Body style={styles.muted}>{state.winnerName ? `${state.winnerName} a trouvé !` : 'Personne !'}</Body>
        ) : (
          <Title style={[styles.word, { color: state.inkHex }]}>{state.wordLabel}</Title>
        )}
      </Card>

      <Body style={styles.hint}>Tape la COULEUR de l'encre, pas le mot écrit !</Body>

      <View style={styles.grid}>
        {state.options.map((o) => (
          <Pressable
            key={o.key}
            disabled={state.phase !== 'round'}
            onPress={() => sendAction('answer', { color: o.key })}
            style={[styles.swatch, { backgroundColor: o.hex }]}
          />
        ))}
      </View>

      <Card style={styles.board}>
        {state.scores.map((s, i) => (
          <View key={i} style={styles.row}>
            <Body style={[styles.name, s.isMe && { color: theme.colors.primary, fontWeight: '800' }]}>{s.name}{s.isMe ? ' (toi)' : ''}</Body>
            <Body style={styles.wins}>{'⭐'.repeat(s.wins) || '—'}</Body>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1.5) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordCard: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  word: { fontSize: 52, fontWeight: '900', letterSpacing: 2 },
  muted: { color: theme.colors.textMuted },
  hint: { textAlign: 'center', color: theme.colors.textMuted, fontSize: theme.font.small },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1.5), justifyContent: 'space-between' },
  swatch: { width: '48%', height: 80, borderRadius: theme.radius.md, borderWidth: 2, borderColor: '#ffffff22' },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: theme.colors.text },
  wins: { fontSize: theme.font.body },
});
