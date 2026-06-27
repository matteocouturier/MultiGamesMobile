import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Body, Button, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface Cell { cat: string; value: string; points: number }
interface PBState {
  phase: 'play' | 'reveal' | 'ended';
  round: number;
  totalRounds: number;
  letter: string;
  categories: string[];
  timeLeft: number;
  myAnswers: string[];
  iSubmitted: boolean;
  submittedCount: number;
  totalPlayers: number;
  results: { id: string; name: string; cells: Cell[]; total: number }[] | null;
  leaderboard: { label: string; score: number }[];
  actions: string[];
}

export function PetitBacView({ state }: { state: PBState }) {
  const { sendAction } = useStore();
  const [answers, setAnswers] = useState<string[]>(state.categories.map(() => ''));

  // Reset the local form whenever a new round starts.
  useEffect(() => {
    setAnswers(state.categories.map(() => ''));
  }, [state.round, state.categories.length]);

  const setAt = (i: number, v: string) => setAnswers((a) => a.map((x, j) => (j === i ? v : x)));
  const submit = () => sendAction('submit', { answers });

  if (state.phase === 'reveal' && state.results) {
    return (
      <ScrollView contentContainerStyle={{ gap: theme.spacing(1.5), paddingBottom: 30 }}>
        <Title style={styles.center}>Manche {state.round} — Lettre {state.letter}</Title>
        {state.results.map((r) => (
          <Card key={r.id} style={{ gap: theme.spacing(0.5) }}>
            <View style={styles.resHeader}>
              <Body style={styles.resName}>{r.name}</Body>
              <Pill label={`+${r.total}`} color="#9B7BFF" filled />
            </View>
            {r.cells.map((c, i) => (
              <View key={i} style={styles.resRow}>
                <Body style={styles.resCat}>{c.cat}</Body>
                <Body style={styles.resVal}>{c.value || '—'}</Body>
                <Body style={[styles.resPts, { color: c.points === 2 ? theme.colors.success : c.points === 1 ? theme.colors.warning : theme.colors.textMuted }]}>
                  {c.points}
                </Body>
              </View>
            ))}
          </Card>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Manche ${state.round}/${state.totalRounds}`} color={theme.colors.textMuted} />
        <Pill label={`⏱️ ${state.timeLeft}s`} color={state.timeLeft <= 10 ? theme.colors.danger : '#9B7BFF'} filled />
      </View>

      <Card style={styles.letterCard}>
        <Body style={styles.muted}>Lettre</Body>
        <Title style={styles.letter}>{state.letter}</Title>
      </Card>

      <ScrollView contentContainerStyle={{ gap: theme.spacing(1) }}>
        {state.categories.map((cat, i) => (
          <View key={cat}>
            <Body style={styles.label}>{cat}</Body>
            <TextInput
              value={answers[i]}
              onChangeText={(v) => setAt(i, v)}
              editable={!state.iSubmitted}
              placeholder={`${cat} en ${state.letter}...`}
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, state.iSubmitted && { opacity: 0.5 }]}
              autoCorrect={false}
            />
          </View>
        ))}
      </ScrollView>

      {state.iSubmitted ? (
        <Body style={styles.waiting}>✓ Terminé — {state.submittedCount}/{state.totalPlayers} ont rendu</Body>
      ) : (
        <Button label="STOP — J'ai fini !" onPress={submit} color="#9B7BFF" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1.5) },
  center: { textAlign: 'center' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  letterCard: { alignItems: 'center', paddingVertical: theme.spacing(1.5) },
  letter: { fontSize: 48, fontWeight: '900', color: '#9B7BFF' },
  muted: { color: theme.colors.textMuted },
  label: { color: theme.colors.textMuted, marginBottom: 2, fontSize: theme.font.small },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    fontSize: theme.font.body,
    height: 48,
    paddingHorizontal: theme.spacing(1.5),
  },
  waiting: { textAlign: 'center', color: theme.colors.textMuted },
  resHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resName: { fontSize: theme.font.h3, fontWeight: '700', color: theme.colors.text },
  resRow: { flexDirection: 'row', alignItems: 'center' },
  resCat: { width: 90, color: theme.colors.textMuted, fontSize: theme.font.small },
  resVal: { flex: 1, color: theme.colors.text },
  resPts: { width: 24, textAlign: 'right', fontWeight: '800' },
});
