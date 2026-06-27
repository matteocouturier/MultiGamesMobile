import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface EQState {
  phase: 'question' | 'reveal' | 'ended';
  index: number; total: number;
  emojis: string; options: string[];
  timeLeft: number; duration: number;
  myAnswer: number | null;
  correctIndex: number | null;
  iWasRight: boolean | null;
  answeredCount: number; totalPlayers: number;
  leaderboard: { label: string; score: number }[];
  actions: string[];
}

export function EmojiQuizView({ state }: { state: EQState }) {
  const { sendAction } = useStore();
  const reveal = state.phase === 'reveal';
  const ratio = Math.max(0, state.timeLeft / state.duration);

  const optStyle = (i: number) => {
    if (reveal) {
      if (i === state.correctIndex) return { backgroundColor: theme.colors.success, borderColor: theme.colors.success };
      if (i === state.myAnswer) return { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger };
      return { backgroundColor: theme.colors.surface, borderColor: theme.colors.border };
    }
    if (i === state.myAnswer) return { backgroundColor: '#FF6B9D', borderColor: '#FF6B9D' };
    return { backgroundColor: theme.colors.surface, borderColor: '#FF6B9D' };
  };

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`${state.index}/${state.total}`} color={theme.colors.textMuted} />
        <Pill label={`${state.answeredCount}/${state.totalPlayers}`} color="#FF6B9D" />
      </View>
      {!reveal && <View style={styles.barBg}><View style={[styles.bar, { width: `${ratio * 100}%` }]} /></View>}

      <Card style={styles.qCard}><Title style={styles.emojis}>{state.emojis}</Title></Card>

      {reveal && (
        <Body style={[styles.verdict, { color: state.iWasRight ? theme.colors.success : theme.colors.danger }]}>
          {state.myAnswer == null ? '⏱️ Trop tard !' : state.iWasRight ? '✓ Bravo !' : '✗ Raté !'}
        </Body>
      )}

      <View style={styles.grid}>
        {state.options.map((opt, i) => (
          <Pressable key={i} disabled={state.myAnswer != null || reveal} onPress={() => sendAction('answer', { index: i })} style={[styles.option, optStyle(i)]}>
            <Body style={styles.optionText}>{opt}</Body>
          </Pressable>
        ))}
      </View>

      <Card style={styles.board}>
        {state.leaderboard.slice(0, 5).map((r, i) => (
          <View key={i} style={styles.row}><Body style={styles.name}>{i + 1}. {r.label}</Body><Body style={styles.score}>{r.score}</Body></View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1.5) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barBg: { height: 8, borderRadius: 4, backgroundColor: theme.colors.surface, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4, backgroundColor: '#FF6B9D' },
  qCard: { paddingVertical: theme.spacing(4), alignItems: 'center' },
  emojis: { fontSize: 56, textAlign: 'center' },
  verdict: { textAlign: 'center', fontWeight: '800', fontSize: theme.font.h3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1.5), justifyContent: 'space-between' },
  option: { width: '48%', minHeight: 64, borderRadius: theme.radius.md, borderWidth: 2, alignItems: 'center', justifyContent: 'center', padding: theme.spacing(1) },
  optionText: { color: theme.colors.text, fontWeight: '700', textAlign: 'center' },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: theme.colors.text },
  score: { color: '#FF6B9D', fontWeight: '800' },
});
