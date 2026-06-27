import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Body, Button, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface BState {
  phase: 'play' | 'result' | 'ended';
  round: number; totalRounds: number;
  category: string; timeLeft: number;
  activeTeamName: string; isMyTurn: boolean;
  lastWord: string; usedCount: number;
  winnerName: string | null;
  teams: { name: string; color?: string; alive: boolean; wins: number; isMine: boolean }[];
  actions: string[];
}

export function BatailleView({ state }: { state: BState }) {
  const { sendAction } = useStore();
  const [word, setWord] = useState('');
  const submit = () => { const w = word.trim(); if (w) sendAction('submit', { word: w }); setWord(''); };

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Manche ${state.round}/${state.totalRounds}`} color={theme.colors.textMuted} />
        {state.phase === 'play' && <Pill label={`⏱️ ${state.timeLeft}s`} color={state.timeLeft <= 4 ? theme.colors.danger : '#FB923C'} filled />}
      </View>

      <Card style={styles.catCard}>
        <Body style={styles.muted}>Catégorie</Body>
        <Title style={styles.cat}>{state.category}</Title>
        {state.usedCount > 0 && <Body style={styles.muted}>{state.usedCount} mots cités{state.lastWord ? ` — dernier : « ${state.lastWord} »` : ''}</Body>}
      </Card>

      {state.phase === 'result' ? (
        <Body style={styles.turn}>🏆 L'équipe {state.winnerName} remporte la manche !</Body>
      ) : (
        <Body style={styles.turn}>{state.isMyTurn ? '🔥 À votre équipe de jouer !' : `Au tour de l'équipe ${state.activeTeamName}...`}</Body>
      )}

      {state.phase === 'play' && state.isMyTurn && (
        <View style={styles.inputRow}>
          <TextInput
            value={word}
            onChangeText={setWord}
            placeholder={`Un(e) ${state.category.toLowerCase()}...`}
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            autoCorrect={false}
            autoFocus
            returnKeyType="send"
            onSubmitEditing={submit}
          />
          <Button label="Go" onPress={submit} color="#FB923C" small />
        </View>
      )}

      <Card style={styles.board}>
        {state.teams.map((t, i) => (
          <View key={i} style={styles.row}>
            <Body style={[styles.name, { color: t.color ?? theme.colors.text }, !t.alive && { opacity: 0.4 }]}>
              {t.alive ? '🔥' : '💀'} Équipe {t.name}{t.isMine ? ' (vous)' : ''}
            </Body>
            <Body style={styles.wins}>{'⭐'.repeat(t.wins) || '—'}</Body>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1.5) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catCard: { alignItems: 'center', paddingVertical: theme.spacing(2.5), gap: theme.spacing(0.5) },
  muted: { color: theme.colors.textMuted, textAlign: 'center' },
  cat: { fontSize: 32, color: '#FB923C' },
  turn: { textAlign: 'center', color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '700' },
  inputRow: { flexDirection: 'row', gap: theme.spacing(1), alignItems: 'center' },
  input: { flex: 1, backgroundColor: theme.colors.surface, borderColor: '#FB923C', borderWidth: 1.5, borderRadius: theme.radius.md, color: theme.colors.text, fontSize: theme.font.h3, height: 52, paddingHorizontal: theme.spacing(2) },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontWeight: '700' },
  wins: { fontSize: theme.font.body },
});
