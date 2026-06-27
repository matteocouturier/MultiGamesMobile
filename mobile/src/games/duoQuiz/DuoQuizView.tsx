import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface DState {
  phase: 'question' | 'reveal' | 'ended';
  index: number; total: number;
  question: string; options: string[];
  timeLeft: number; duration: number;
  amIActive: boolean; activeName: string;
  myTeamChoice: number | null; myTeamAnswered: boolean;
  correctIndex: number | null;
  teamWasRight: boolean | null;
  leaderboard: { name: string; color: string; score: number }[];
  actions: string[];
}

const ACCENT = '#22D3EE';

export function DuoQuizView({ state }: { state: DState }) {
  const { sendAction } = useStore();
  const reveal = state.phase === 'reveal';
  const ratio = Math.max(0, state.timeLeft / state.duration);

  const optStyle = (i: number) => {
    if (reveal) {
      if (i === state.correctIndex) return { backgroundColor: theme.colors.success, borderColor: theme.colors.success };
      if (i === state.myTeamChoice) return { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger };
      return { backgroundColor: theme.colors.surface, borderColor: theme.colors.border };
    }
    if (i === state.myTeamChoice) return { backgroundColor: ACCENT, borderColor: ACCENT };
    return { backgroundColor: theme.colors.surface, borderColor: ACCENT };
  };

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Question ${state.index}/${state.total}`} color={theme.colors.textMuted} />
        <Pill label={state.amIActive ? 'À toi de répondre !' : `${state.activeName} répond`} color={ACCENT} filled={state.amIActive} />
      </View>
      {!reveal && <View style={styles.barBg}><View style={[styles.bar, { width: `${ratio * 100}%` }]} /></View>}

      <Card style={styles.qCard}><Title style={styles.q}>{state.question}</Title></Card>

      {reveal && (
        <Body style={[styles.verdict, { color: state.teamWasRight ? theme.colors.success : theme.colors.danger }]}>
          {state.myTeamChoice == null ? '⏱️ Pas de réponse' : state.teamWasRight ? '✓ Bonne réponse !' : '✗ Raté !'}
        </Body>
      )}

      <View style={styles.grid}>
        {state.options.map((opt, i) => (
          <Pressable key={i} disabled={!state.amIActive || state.myTeamAnswered || reveal} onPress={() => sendAction('answer', { index: i })} style={[styles.option, optStyle(i), !state.amIActive && !reveal && { opacity: 0.6 }]}>
            <Body style={styles.optionText}>{opt}</Body>
          </Pressable>
        ))}
      </View>

      <Card style={styles.board}>
        {state.leaderboard.map((t, i) => (
          <View key={i} style={styles.row}>
            <Body style={[styles.name, { color: t.color }]}>Équipe {t.name}</Body>
            <Body style={styles.score}>{t.score}</Body>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1.5) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barBg: { height: 8, borderRadius: 4, backgroundColor: theme.colors.surface, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4, backgroundColor: ACCENT },
  qCard: { paddingVertical: theme.spacing(3), alignItems: 'center' },
  q: { fontSize: theme.font.h2, textAlign: 'center' },
  verdict: { textAlign: 'center', fontWeight: '800', fontSize: theme.font.h3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1.5), justifyContent: 'space-between' },
  option: { width: '48%', minHeight: 64, borderRadius: theme.radius.md, borderWidth: 2, alignItems: 'center', justifyContent: 'center', padding: theme.spacing(1) },
  optionText: { color: theme.colors.text, fontWeight: '700', textAlign: 'center' },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontWeight: '700' },
  score: { color: theme.colors.text, fontWeight: '800' },
});
