import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Body, Button, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface HState {
  phase: 'play' | 'reveal' | 'ended';
  round: number; totalRounds: number;
  masked: string[];
  guessed: string[];
  errors: number; maxErrors: number;
  word: string | null;
  leaderboard: { name: string; score: number; isMe: boolean }[];
  actions: string[];
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function HangmanView({ state }: { state: HState }) {
  const { sendAction } = useStore();
  const [guess, setGuess] = useState('');
  const play = state.phase === 'play';

  const tryWord = () => { const w = guess.trim(); if (w) sendAction('word', { word: w }); setGuess(''); };

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Manche ${state.round}/${state.totalRounds}`} color={theme.colors.textMuted} />
        <Pill label={`Erreurs ${state.errors}/${state.maxErrors}`} color={state.errors >= state.maxErrors - 2 ? theme.colors.danger : '#C0392B'} filled />
      </View>

      <Card style={styles.wordCard}>
        <Title style={styles.word}>{state.masked.join(' ')}</Title>
        {state.phase === 'reveal' && state.word && <Body style={styles.muted}>Le mot était : {state.word}</Body>}
      </Card>

      {play && (
        <>
          <View style={styles.keyboard}>
            {ALPHABET.map((c) => {
              const used = state.guessed.includes(c);
              return (
                <Pressable key={c} disabled={used} onPress={() => sendAction('letter', { char: c })} style={[styles.key, used && styles.keyUsed]}>
                  <Body style={[styles.keyText, used && { color: theme.colors.textMuted }]}>{c}</Body>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.inputRow}>
            <TextInput
              value={guess}
              onChangeText={setGuess}
              placeholder="Deviner le mot entier..."
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="send"
              onSubmitEditing={tryWord}
            />
            <Button label="Mot" onPress={tryWord} color="#C0392B" small />
          </View>
        </>
      )}

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
  wordCard: { alignItems: 'center', paddingVertical: theme.spacing(2.5), gap: theme.spacing(1) },
  word: { fontSize: 30, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  muted: { color: theme.colors.textMuted },
  keyboard: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  key: { width: 34, height: 42, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  keyUsed: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText: { color: theme.colors.text, fontWeight: '700', fontSize: theme.font.body },
  inputRow: { flexDirection: 'row', gap: theme.spacing(1), alignItems: 'center' },
  input: { flex: 1, backgroundColor: theme.colors.surface, borderColor: '#C0392B', borderWidth: 1.5, borderRadius: theme.radius.md, color: theme.colors.text, fontSize: theme.font.body, height: 48, paddingHorizontal: theme.spacing(1.5) },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: theme.colors.text },
  score: { color: '#C0392B', fontWeight: '800' },
});
