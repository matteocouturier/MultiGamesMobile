import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Body, Button, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface MDState {
  phase: 'round' | 'reveal' | 'ended';
  round: number; totalRounds: number;
  problem: string;
  timeLeft: number; duration: number;
  answer: number | null;
  winnerName: string | null;
  iWon: boolean;
  scores: { name: string; wins: number; isMe: boolean }[];
  actions: string[];
}

export function MathDuelView({ state }: { state: MDState }) {
  const { sendAction } = useStore();
  const [val, setVal] = useState('');
  const send = () => { const n = parseInt(val, 10); if (Number.isFinite(n)) sendAction('answer', { value: n }); setVal(''); };

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Manche ${state.round}/${state.totalRounds}`} color={theme.colors.textMuted} />
        <Pill label={`⏱️ ${state.timeLeft}s`} color={state.timeLeft <= 5 ? theme.colors.danger : '#3498DB'} filled />
      </View>

      <Card style={styles.card}>
        {state.phase === 'reveal' ? (
          <>
            <Title style={styles.eq}>{state.problem} = {state.answer}</Title>
            <Body style={styles.muted}>{state.winnerName ? `${state.winnerName} a trouvé !` : 'Personne !'}</Body>
          </>
        ) : (
          <Title style={styles.eq}>{state.problem} = ?</Title>
        )}
      </Card>

      {state.phase === 'round' && (
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
          <Button label="OK" onPress={send} color="#3498DB" small />
        </View>
      )}

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
  root: { flex: 1, gap: theme.spacing(2) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { alignItems: 'center', justifyContent: 'center', minHeight: 150, gap: theme.spacing(1) },
  eq: { fontSize: 44, fontWeight: '900' },
  muted: { color: theme.colors.textMuted },
  inputRow: { flexDirection: 'row', gap: theme.spacing(1), alignItems: 'center' },
  input: { flex: 1, backgroundColor: theme.colors.surface, borderColor: '#3498DB', borderWidth: 1.5, borderRadius: theme.radius.md, color: theme.colors.text, fontSize: theme.font.h2, fontWeight: '800', textAlign: 'center', height: 56 },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: theme.colors.text },
  wins: { fontSize: theme.font.body },
});
