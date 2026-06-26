import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Body, Button, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface HLState {
  phase: 'playing' | 'result' | 'ended';
  round: number;
  totalRounds: number;
  low: number;
  high: number;
  max: number;
  lastGuess: { name: string; value: number; hint: 'higher' | 'lower' } | null;
  secret: number | null;
  winnerName: string | null;
  iWon: boolean;
  scores: { name: string; wins: number; isMe: boolean }[];
  actions: string[];
}

export function HigherLowerView({ state }: { state: HLState }) {
  const { sendAction } = useStore();
  const [val, setVal] = useState('');

  const guess = () => {
    const n = parseInt(val, 10);
    if (Number.isFinite(n)) sendAction('guess', { value: n });
    setVal('');
  };

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Manche ${state.round}/${state.totalRounds}`} color={theme.colors.textMuted} />
        <Pill label={`Entre ${state.low + 1} et ${state.high - 1}`} color="#5BC0EB" filled />
      </View>

      <Card style={styles.hintCard}>
        {state.phase === 'result' ? (
          <>
            <Title style={styles.big}>🎯 {state.secret}</Title>
            <Body style={styles.muted}>
              {state.winnerName ? `${state.winnerName} a trouvé !` : 'Manche terminée'}
            </Body>
          </>
        ) : state.lastGuess ? (
          <>
            <Title style={styles.big}>{state.lastGuess.value}</Title>
            <Body style={[styles.hint, { color: state.lastGuess.hint === 'higher' ? theme.colors.success : theme.colors.danger }]}>
              {state.lastGuess.hint === 'higher' ? '⬆️ Plus grand !' : '⬇️ Plus petit !'}
            </Body>
            <Body style={styles.muted}>proposé par {state.lastGuess.name}</Body>
          </>
        ) : (
          <>
            <Title style={styles.big}>?</Title>
            <Body style={styles.muted}>Lance une première proposition</Body>
          </>
        )}
      </Card>

      {state.phase === 'playing' && (
        <View style={styles.inputRow}>
          <TextInput
            value={val}
            onChangeText={(t) => setVal(t.replace(/[^0-9]/g, '').slice(0, 3))}
            placeholder="1-100"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="number-pad"
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={guess}
          />
          <Button label="Proposer" onPress={guess} color="#5BC0EB" small />
        </View>
      )}

      <Card style={styles.board}>
        {state.scores.map((s, i) => (
          <View key={i} style={styles.row}>
            <Body style={[styles.name, s.isMe && { color: theme.colors.primary, fontWeight: '800' }]}>
              {s.name}
              {s.isMe ? ' (toi)' : ''}
            </Body>
            <Body style={styles.wins}>{'⭐'.repeat(s.wins) || '—'}</Body>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(2) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hintCard: { alignItems: 'center', paddingVertical: theme.spacing(4), gap: theme.spacing(0.5) },
  big: { fontSize: 60, fontWeight: '900' },
  hint: { fontSize: theme.font.h2, fontWeight: '800' },
  muted: { color: theme.colors.textMuted },
  inputRow: { flexDirection: 'row', gap: theme.spacing(1), alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderColor: '#5BC0EB',
    borderWidth: 1.5,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    fontSize: theme.font.h2,
    fontWeight: '800',
    textAlign: 'center',
    height: 56,
  },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: theme.colors.text },
  wins: { fontSize: theme.font.body },
});
