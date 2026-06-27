import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Body, Button, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface RState {
  phase: 'play' | 'ended';
  target: number; timeLeft: number;
  problem: string; myTeamCorrect: number;
  amIActive: boolean; activeName: string;
  leaderboard: { name: string; color: string; score: number; isMine: boolean }[];
  actions: string[];
}

const ACCENT = '#38BDF8';

export function RelaisCalculView({ state }: { state: RState }) {
  const { sendAction } = useStore();
  const [val, setVal] = useState('');
  const send = () => { const n = parseInt(val, 10); if (Number.isFinite(n)) sendAction('answer', { value: n }); setVal(''); };

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Objectif : ${state.target}`} color={theme.colors.textMuted} />
        <Pill label={`⏱️ ${state.timeLeft}s`} color={ACCENT} filled />
      </View>

      <Card style={styles.progressCard}>
        <Body style={styles.muted}>Votre progression</Body>
        <Title style={styles.progress}>{state.myTeamCorrect} / {state.target}</Title>
        <View style={styles.barBg}><View style={[styles.bar, { width: `${Math.min(100, (state.myTeamCorrect / state.target) * 100)}%` }]} /></View>
      </Card>

      <Card style={styles.problemCard}>
        <Pill label={state.amIActive ? 'À toi !' : `${state.activeName} calcule`} color={ACCENT} filled={state.amIActive} />
        <Title style={styles.problem}>{state.problem} = ?</Title>
      </Card>

      {state.amIActive ? (
        <View style={styles.inputRow}>
          <TextInput
            value={val}
            onChangeText={(t) => setVal(t.replace(/[^0-9-]/g, '').slice(0, 6))}
            placeholder="Résultat..."
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="number-pad"
            style={styles.input}
            autoFocus
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <Button label="OK" onPress={send} color={ACCENT} small />
        </View>
      ) : (
        <Body style={styles.waiting}>🤝 Laisse {state.activeName} répondre, puis ce sera ton tour !</Body>
      )}

      <Card style={styles.board}>
        {state.leaderboard.map((t, i) => (
          <View key={i} style={styles.row}>
            <Body style={[styles.name, { color: t.color }]}>Équipe {t.name}{t.isMine ? ' (vous)' : ''}</Body>
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
  progressCard: { alignItems: 'center', gap: theme.spacing(0.5), paddingVertical: theme.spacing(1.5) },
  muted: { color: theme.colors.textMuted },
  progress: { fontSize: 30, color: ACCENT },
  barBg: { width: '90%', height: 10, borderRadius: 5, backgroundColor: theme.colors.surface, overflow: 'hidden', marginTop: 4 },
  bar: { height: 10, borderRadius: 5, backgroundColor: ACCENT },
  problemCard: { alignItems: 'center', gap: theme.spacing(1), paddingVertical: theme.spacing(2.5) },
  problem: { fontSize: 40, fontWeight: '900' },
  inputRow: { flexDirection: 'row', gap: theme.spacing(1), alignItems: 'center' },
  input: { flex: 1, backgroundColor: theme.colors.surface, borderColor: ACCENT, borderWidth: 1.5, borderRadius: theme.radius.md, color: theme.colors.text, fontSize: theme.font.h2, fontWeight: '800', textAlign: 'center', height: 56 },
  waiting: { textAlign: 'center', color: theme.colors.textMuted },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontWeight: '700' },
  score: { color: theme.colors.text, fontWeight: '800' },
});
