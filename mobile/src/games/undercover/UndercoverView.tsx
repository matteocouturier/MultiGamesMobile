import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Body, Button, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface UPlayer {
  id: string;
  name: string;
  alive: boolean;
  isMe: boolean;
  clue: string | null;
  submittedClue: boolean;
  voted: boolean;
  role: 'civil' | 'undercover' | null;
}
interface UState {
  phase: 'reveal' | 'clue' | 'vote' | 'result' | 'ended';
  round: number;
  myWord: string;
  amIAlive: boolean;
  players: UPlayer[];
  iSubmittedClue: boolean;
  myVote: string | null;
  lastEliminated: { name: string; role: 'civil' | 'undercover'; word: string } | null;
  actions: string[];
}

const ACCENT = '#E8556D';

export function UndercoverView({ state }: { state: UState }) {
  const { sendAction } = useStore();
  const [clue, setClue] = useState('');

  const submitClue = () => {
    const w = clue.trim();
    if (w) sendAction('clue', { word: w });
    setClue('');
  };

  return (
    <View style={styles.root}>
      {/* Your secret word is always visible */}
      <Card style={styles.wordCard}>
        <Body style={styles.muted}>Ton mot secret</Body>
        <Title style={[styles.word, { color: ACCENT }]}>{state.myWord}</Title>
        {!state.amIAlive && <Pill label="Éliminé" color={theme.colors.danger} />}
      </Card>

      {state.phase === 'reveal' && (
        <Body style={styles.info}>🤫 Mémorise ton mot... La manche commence !</Body>
      )}

      {state.phase === 'result' && state.lastEliminated && (
        <Card style={styles.elimCard}>
          <Title style={styles.elimName}>{state.lastEliminated.name} est éliminé</Title>
          <Body style={[styles.elimRole, { color: state.lastEliminated.role === 'undercover' ? ACCENT : theme.colors.success }]}>
            C'était un {state.lastEliminated.role === 'undercover' ? '🕵️ Undercover !' : '🛡️ Civil'} — mot : « {state.lastEliminated.word} »
          </Body>
        </Card>
      )}

      {/* Clue input */}
      {state.phase === 'clue' && state.amIAlive && !state.iSubmittedClue && (
        <View style={styles.inputRow}>
          <TextInput
            value={clue}
            onChangeText={setClue}
            placeholder="Ton indice (un mot)..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={submitClue}
          />
          <Button label="Envoyer" onPress={submitClue} color={ACCENT} small />
        </View>
      )}
      {state.phase === 'clue' && (state.iSubmittedClue || !state.amIAlive) && (
        <Body style={styles.info}>En attente des indices des autres joueurs...</Body>
      )}
      {state.phase === 'vote' && (
        <Body style={styles.info}>
          {state.amIAlive ? '🗳️ Vote pour éliminer un suspect' : 'Vote en cours...'}
        </Body>
      )}

      {/* Players */}
      <ScrollView contentContainerStyle={{ gap: theme.spacing(1) }}>
        {state.players.map((p) => {
          const canVote = state.phase === 'vote' && state.amIAlive && !state.myVote && p.alive && !p.isMe;
          const votedThis = state.myVote === p.id;
          return (
            <Pressable key={p.id} disabled={!canVote} onPress={() => sendAction('vote', { targetId: p.id })}>
              <Card
                style={[
                  styles.playerCard,
                  votedThis && { borderColor: ACCENT },
                  !p.alive && { opacity: 0.4 },
                ]}
              >
                <View style={styles.pLeft}>
                  <Body style={styles.pName}>
                    {p.name}
                    {p.isMe ? ' (toi)' : ''}
                  </Body>
                  {p.clue != null && <Body style={styles.pClue}>« {p.clue} »</Body>}
                  {p.role && (
                    <Body style={{ color: p.role === 'undercover' ? ACCENT : theme.colors.success, fontSize: theme.font.small }}>
                      {p.role === 'undercover' ? '🕵️ Undercover' : '🛡️ Civil'}
                    </Body>
                  )}
                </View>
                {!p.alive && <Body>💀</Body>}
                {state.phase === 'clue' && p.alive && <Body>{p.submittedClue ? '✓' : '…'}</Body>}
                {state.phase === 'vote' && p.alive && <Body>{p.voted ? '🗳️' : ''}</Body>}
                {canVote && <Pill label="Voter" color={ACCENT} />}
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1.5) },
  wordCard: { alignItems: 'center', paddingVertical: theme.spacing(2), gap: theme.spacing(0.5) },
  word: { fontSize: 38, fontWeight: '900' },
  muted: { color: theme.colors.textMuted },
  info: { textAlign: 'center', color: theme.colors.textMuted },
  elimCard: { alignItems: 'center', gap: theme.spacing(0.5), borderColor: ACCENT, borderWidth: 1.5 },
  elimName: { fontSize: theme.font.h3 },
  elimRole: { textAlign: 'center', fontWeight: '700' },
  inputRow: { flexDirection: 'row', gap: theme.spacing(1), alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderColor: ACCENT,
    borderWidth: 1.5,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    fontSize: theme.font.h3,
    height: 52,
    paddingHorizontal: theme.spacing(2),
  },
  playerCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5) },
  pLeft: { flex: 1, gap: 2 },
  pName: { fontSize: theme.font.body, fontWeight: '700', color: theme.colors.text },
  pClue: { color: theme.colors.text, fontStyle: 'italic' },
});
