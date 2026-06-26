import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Body, Button, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface NGState {
  phase: 'question' | 'reveal' | 'ended';
  round: number; totalRounds: number;
  question: string; unit: string;
  timeLeft: number; duration: number;
  myGuess: number | null;
  answeredCount: number; totalPlayers: number;
  answer: number | null;
  guesses: { name: string; value: number; dist: number }[] | null;
  leaderboard: { name: string; score: number; isMe: boolean }[];
  actions: string[];
}

export function NumberGuessView({ state }: { state: NGState }) {
  const { sendAction } = useStore();
  const [val, setVal] = useState('');
  const guess = () => { const n = parseInt(val, 10); if (Number.isFinite(n)) sendAction('guess', { value: n }); setVal(''); };

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Question ${state.round}/${state.totalRounds}`} color={theme.colors.textMuted} />
        <Pill label={`${state.answeredCount}/${state.totalPlayers}`} color="#1ABC9C" />
      </View>

      <Card style={styles.qCard}><Title style={styles.q}>{state.question}</Title></Card>

      {state.phase === 'reveal' ? (
        <ScrollView contentContainerStyle={{ gap: theme.spacing(0.5) }}>
          <Title style={styles.answer}>Réponse : {state.answer} {state.unit}</Title>
          {state.guesses?.map((g, i) => (
            <View key={i} style={styles.gRow}>
              <Body style={styles.gName}>{i === 0 ? '🥇 ' : ''}{g.name}</Body>
              <Body style={styles.gVal}>{g.value} <Body style={styles.muted}>(écart {g.dist})</Body></Body>
            </View>
          ))}
        </ScrollView>
      ) : (
        <>
          {state.myGuess != null ? (
            <Body style={styles.locked}>Ta réponse : {state.myGuess} — en attente des autres ⏱️ {state.timeLeft}s</Body>
          ) : (
            <View style={styles.inputRow}>
              <TextInput
                value={val}
                onChangeText={(t) => setVal(t.replace(/[^0-9]/g, '').slice(0, 7))}
                placeholder="Ton nombre..."
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="number-pad"
                style={styles.input}
                returnKeyType="send"
                onSubmitEditing={guess}
              />
              <Button label="OK" onPress={guess} color="#1ABC9C" small />
            </View>
          )}
          <Card style={styles.board}>
            {state.leaderboard.map((s, i) => (
              <View key={i} style={styles.row}>
                <Body style={[styles.name, s.isMe && { color: theme.colors.primary, fontWeight: '800' }]}>{i + 1}. {s.name}{s.isMe ? ' (toi)' : ''}</Body>
                <Body style={styles.score}>{s.score}</Body>
              </View>
            ))}
          </Card>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1.5) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qCard: { paddingVertical: theme.spacing(3), alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  q: { fontSize: theme.font.h2, textAlign: 'center' },
  answer: { textAlign: 'center', color: '#1ABC9C', marginBottom: theme.spacing(1) },
  muted: { color: theme.colors.textMuted, fontSize: theme.font.small },
  inputRow: { flexDirection: 'row', gap: theme.spacing(1), alignItems: 'center' },
  input: { flex: 1, backgroundColor: theme.colors.surface, borderColor: '#1ABC9C', borderWidth: 1.5, borderRadius: theme.radius.md, color: theme.colors.text, fontSize: theme.font.h2, fontWeight: '800', textAlign: 'center', height: 56 },
  locked: { textAlign: 'center', color: theme.colors.textMuted },
  gRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderColor: theme.colors.border },
  gName: { color: theme.colors.text, fontWeight: '600' },
  gVal: { color: theme.colors.text },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: theme.colors.text },
  score: { color: '#1ABC9C', fontWeight: '800' },
});
