import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface QuizState {
  phase: 'question' | 'reveal' | 'ended';
  questionIndex: number;
  totalQuestions: number;
  question: string;
  options: string[];
  timeLeft: number;
  duration: number;
  myAnswer: number | null;
  answeredCount: number;
  totalPlayers: number;
  correctIndex: number | null;
  iWasRight: boolean | null;
  leaderboard: { label: string; score: number }[];
  actions: string[];
}

const OPTION_COLORS = ['#FF5A5F', '#4C8DFF', '#FFC53D', '#34C759'];

export function QuizView({ state }: { state: QuizState }) {
  const { sendAction } = useStore();
  const reveal = state.phase === 'reveal';
  const ratio = Math.max(0, state.timeLeft / state.duration);

  const optStyle = (i: number) => {
    if (reveal) {
      if (i === state.correctIndex) return { backgroundColor: theme.colors.success, borderColor: theme.colors.success };
      if (i === state.myAnswer) return { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger };
      return { backgroundColor: theme.colors.surface, borderColor: theme.colors.border };
    }
    if (i === state.myAnswer) return { backgroundColor: OPTION_COLORS[i], borderColor: OPTION_COLORS[i] };
    return { backgroundColor: theme.colors.surface, borderColor: OPTION_COLORS[i] };
  };

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Question ${state.questionIndex}/${state.totalQuestions}`} color={theme.colors.textMuted} />
        <Pill label={`${state.answeredCount}/${state.totalPlayers} ont répondu`} color="#34C7C5" />
      </View>

      {!reveal && (
        <View style={styles.timerBarBg}>
          <View style={[styles.timerBar, { width: `${ratio * 100}%` }]} />
        </View>
      )}

      <Card style={styles.qCard}>
        <Title style={styles.qText}>{state.question}</Title>
      </Card>

      {reveal && (
        <Body style={[styles.verdict, { color: state.iWasRight ? theme.colors.success : theme.colors.danger }]}>
          {state.myAnswer == null ? '⏱️ Trop tard !' : state.iWasRight ? '✓ Bonne réponse !' : '✗ Raté !'}
        </Body>
      )}

      <View style={styles.grid}>
        {state.options.map((opt, i) => (
          <Pressable
            key={i}
            disabled={state.myAnswer != null || reveal}
            onPress={() => sendAction('answer', { index: i })}
            style={[styles.option, optStyle(i)]}
          >
            <Body style={styles.optionText}>{opt}</Body>
          </Pressable>
        ))}
      </View>

      <Card style={styles.board}>
        {state.leaderboard.slice(0, 5).map((r, i) => (
          <View key={i} style={styles.boardRow}>
            <Body style={styles.boardName}>
              {i + 1}. {r.label}
            </Body>
            <Body style={styles.boardScore}>{r.score}</Body>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1.5) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerBarBg: { height: 8, borderRadius: 4, backgroundColor: theme.colors.surface, overflow: 'hidden' },
  timerBar: { height: 8, borderRadius: 4, backgroundColor: '#34C7C5' },
  qCard: { paddingVertical: theme.spacing(3), alignItems: 'center' },
  qText: { fontSize: theme.font.h2, textAlign: 'center' },
  verdict: { textAlign: 'center', fontWeight: '800', fontSize: theme.font.h3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1.5), justifyContent: 'space-between' },
  option: {
    width: '48%',
    minHeight: 72,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(1.5),
  },
  optionText: { color: theme.colors.text, fontWeight: '700', textAlign: 'center', fontSize: theme.font.body },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  boardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  boardName: { color: theme.colors.text },
  boardScore: { color: '#34C7C5', fontWeight: '800' },
});
