import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface TFState {
  phase: 'question' | 'reveal' | 'ended';
  index: number; total: number;
  statement: string;
  timeLeft: number; duration: number;
  myAnswer: boolean | null;
  correct: boolean | null;
  iWasRight: boolean | null;
  answeredCount: number; totalPlayers: number;
  leaderboard: { label: string; score: number }[];
  actions: string[];
}

export function TrueFalseView({ state }: { state: TFState }) {
  const { sendAction } = useStore();
  const reveal = state.phase === 'reveal';
  const ratio = Math.max(0, state.timeLeft / state.duration);

  const btn = (val: boolean, label: string, color: string) => {
    const chosen = state.myAnswer === val;
    const isCorrect = reveal && state.correct === val;
    const bg = isCorrect ? theme.colors.success : reveal && chosen ? theme.colors.danger : chosen ? color : theme.colors.surface;
    return (
      <Pressable
        disabled={state.myAnswer != null || reveal}
        onPress={() => sendAction('answer', { value: val })}
        style={[styles.btn, { backgroundColor: bg, borderColor: color }]}
      >
        <Title style={styles.btnText}>{label}</Title>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`${state.index}/${state.total}`} color={theme.colors.textMuted} />
        <Pill label={`${state.answeredCount}/${state.totalPlayers}`} color="#2ECC71" />
      </View>
      {!reveal && <View style={styles.barBg}><View style={[styles.bar, { width: `${ratio * 100}%` }]} /></View>}

      <Card style={styles.qCard}><Title style={styles.q}>{state.statement}</Title></Card>

      {reveal && (
        <Body style={[styles.verdict, { color: state.iWasRight ? theme.colors.success : theme.colors.danger }]}>
          {state.myAnswer == null ? '⏱️ Trop tard !' : state.iWasRight ? '✓ Correct !' : '✗ Raté !'}
        </Body>
      )}

      <View style={styles.btnRow}>
        {btn(true, 'VRAI', '#2ECC71')}
        {btn(false, 'FAUX', '#FF5A5F')}
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
  bar: { height: 8, borderRadius: 4, backgroundColor: '#2ECC71' },
  qCard: { paddingVertical: theme.spacing(4), alignItems: 'center', minHeight: 150, justifyContent: 'center' },
  q: { fontSize: theme.font.h2, textAlign: 'center' },
  verdict: { textAlign: 'center', fontWeight: '800', fontSize: theme.font.h3 },
  btnRow: { flexDirection: 'row', gap: theme.spacing(1.5) },
  btn: { flex: 1, height: 90, borderRadius: theme.radius.lg, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: theme.colors.white, fontSize: theme.font.h2, fontWeight: '900' },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: theme.colors.text },
  score: { color: '#2ECC71', fontWeight: '800' },
});
