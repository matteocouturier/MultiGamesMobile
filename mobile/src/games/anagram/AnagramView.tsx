import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Body, Button, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface AGState {
  phase: 'round' | 'reveal' | 'ended';
  round: number; totalRounds: number;
  scrambled: string;
  timeLeft: number; duration: number;
  solution: string | null;
  winnerName: string | null;
  iWon: boolean;
  scores: { name: string; wins: number; isMe: boolean }[];
  actions: string[];
}

export function AnagramView({ state }: { state: AGState }) {
  const { sendAction } = useStore();
  const [word, setWord] = useState('');
  const submit = () => { const w = word.trim(); if (w) sendAction('submit', { word: w }); setWord(''); };
  const ratio = Math.max(0, state.timeLeft / state.duration);

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Manche ${state.round}/${state.totalRounds}`} color={theme.colors.textMuted} />
        <Pill label={`⏱️ ${state.timeLeft}s`} color={state.timeLeft <= 5 ? theme.colors.danger : '#F39C12'} filled />
      </View>

      <Card style={styles.letterCard}>
        {state.phase === 'reveal' ? (
          <>
            <Title style={styles.solution}>{state.solution}</Title>
            <Body style={styles.muted}>{state.winnerName ? `${state.winnerName} a trouvé !` : 'Personne n’a trouvé'}</Body>
          </>
        ) : (
          <View style={styles.tiles}>
            {state.scrambled.split('').map((c, i) => (
              <View key={i} style={styles.tile}><Title style={styles.tileText}>{c}</Title></View>
            ))}
          </View>
        )}
      </Card>

      {state.phase === 'round' && (
        <View style={styles.inputRow}>
          <TextInput
            value={word}
            onChangeText={setWord}
            placeholder="Le mot..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            autoCorrect={false}
            autoCapitalize="none"
            autoFocus
            returnKeyType="send"
            onSubmitEditing={submit}
          />
          <Button label="OK" onPress={submit} color="#F39C12" small />
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
  letterCard: { alignItems: 'center', justifyContent: 'center', minHeight: 160, gap: theme.spacing(1) },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1), justifyContent: 'center' },
  tile: { width: 44, height: 52, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: '#F39C12', alignItems: 'center', justifyContent: 'center' },
  tileText: { fontSize: 26, fontWeight: '900', color: theme.colors.text },
  solution: { fontSize: 40, fontWeight: '900', color: '#F39C12' },
  muted: { color: theme.colors.textMuted },
  inputRow: { flexDirection: 'row', gap: theme.spacing(1), alignItems: 'center' },
  input: { flex: 1, backgroundColor: theme.colors.surface, borderColor: '#F39C12', borderWidth: 1.5, borderRadius: theme.radius.md, color: theme.colors.text, fontSize: theme.font.h3, height: 52, paddingHorizontal: theme.spacing(2) },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: theme.colors.text },
  wins: { fontSize: theme.font.body },
});
