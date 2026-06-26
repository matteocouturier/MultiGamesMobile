import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface PState {
  phase: 'question' | 'reveal' | 'ended';
  index: number; total: number;
  question: string; options: string[];
  timeLeft: number; duration: number;
  myVote: number | null;
  votedCount: number; totalPlayers: number;
  counts: number[] | null;
  leaderboard: { name: string; score: number; isMe: boolean }[];
  actions: string[];
}

export function PopularView({ state }: { state: PState }) {
  const { sendAction } = useStore();
  const reveal = state.phase === 'reveal';
  const maxCount = state.counts ? Math.max(1, ...state.counts) : 1;

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`${state.index}/${state.total}`} color={theme.colors.textMuted} />
        <Pill label={`${state.votedCount}/${state.totalPlayers}`} color="#27AE60" />
      </View>

      <Card style={styles.qCard}><Title style={styles.q}>{state.question}</Title></Card>

      <View style={styles.options}>
        {state.options.map((opt, i) => {
          const chosen = state.myVote === i;
          const count = state.counts?.[i] ?? 0;
          const ratio = reveal ? count / maxCount : 0;
          return (
            <Pressable
              key={i}
              disabled={state.myVote != null || reveal}
              onPress={() => sendAction('vote', { option: i })}
              style={[styles.option, chosen && { borderColor: '#27AE60', borderWidth: 2 }]}
            >
              {reveal && <View style={[styles.fill, { width: `${ratio * 100}%` }]} />}
              <Body style={styles.optionText}>{opt}</Body>
              {reveal && <Body style={styles.count}>{count}</Body>}
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.board}>
        {state.leaderboard.slice(0, 5).map((s, i) => (
          <View key={i} style={styles.row}>
            <Body style={[styles.name, s.isMe && { color: theme.colors.primary, fontWeight: '800' }]}>{i + 1}. {s.name}{s.isMe ? ' (toi)' : ''}</Body>
            <Body style={styles.score}>{s.score}</Body>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1.5) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qCard: { paddingVertical: theme.spacing(3), alignItems: 'center' },
  q: { fontSize: theme.font.h2, textAlign: 'center' },
  options: { gap: theme.spacing(1) },
  option: {
    minHeight: 58, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface, justifyContent: 'center', paddingHorizontal: theme.spacing(2),
    overflow: 'hidden',
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#27AE6033' },
  optionText: { color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '600' },
  count: { position: 'absolute', right: theme.spacing(2), color: '#27AE60', fontWeight: '800' },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: theme.colors.text },
  score: { color: '#27AE60', fontWeight: '800' },
});
