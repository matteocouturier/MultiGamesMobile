import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Body, Button, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface WBPlayer {
  id: string;
  name: string;
  lives: number;
  alive: boolean;
  isCurrent: boolean;
}
interface WBState {
  phase: 'playing' | 'ended';
  fragment: string;
  timeLeft: number;
  turnDuration: number;
  currentPlayerId: string;
  currentPlayerName: string;
  myTurn: boolean;
  amIAlive: boolean;
  usedCount: number;
  players: WBPlayer[];
  actions: string[];
}

export function WordBombView({ state }: { state: WBState }) {
  const { sendAction } = useStore();
  const [word, setWord] = useState('');

  const submit = () => {
    const w = word.trim();
    if (!w) return;
    sendAction('submit', { word: w });
    setWord('');
  };

  const ratio = Math.max(0, state.timeLeft / state.turnDuration);
  const danger = state.timeLeft <= 5;
  const timerColor = danger ? theme.colors.danger : state.timeLeft <= 10 ? theme.colors.warning : theme.colors.success;

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`${state.usedCount} mots joués`} color={theme.colors.textMuted} />
        <Pill label={state.myTurn ? 'À toi !' : `Tour de ${state.currentPlayerName}`} color="#FF8A3D" filled />
      </View>

      {/* Bomb / fragment */}
      <Card style={[styles.bombCard, danger && { borderColor: theme.colors.danger }]}>
        <Body style={styles.bombEmoji}>{danger ? '💥' : '💣'}</Body>
        <Body style={styles.muted}>Un mot qui contient :</Body>
        <Title style={styles.fragment}>{state.fragment}</Title>
        <View style={styles.timerBarBg}>
          <View style={[styles.timerBar, { width: `${ratio * 100}%`, backgroundColor: timerColor }]} />
        </View>
        <Body style={[styles.timer, { color: timerColor }]}>{state.timeLeft}s</Body>
      </Card>

      {/* Input area */}
      {state.myTurn && state.amIAlive ? (
        <View style={styles.inputRow}>
          <TextInput
            value={word}
            onChangeText={setWord}
            placeholder="Ton mot..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="send"
            onSubmitEditing={submit}
          />
          <Button label="Envoyer" onPress={submit} color="#FF8A3D" small />
        </View>
      ) : (
        <Body style={styles.waiting}>
          {state.amIAlive ? `⏳ ${state.currentPlayerName} cherche un mot...` : '💀 Tu es éliminé — observe la fin !'}
        </Body>
      )}

      {/* Players */}
      <ScrollView style={styles.players} contentContainerStyle={{ gap: theme.spacing(1) }}>
        {state.players.map((p) => (
          <Card
            key={p.id}
            style={[
              styles.playerCard,
              p.isCurrent && { borderColor: '#FF8A3D' },
              !p.alive && { opacity: 0.4 },
            ]}
          >
            <Body style={styles.playerName}>
              {p.isCurrent ? '👉 ' : ''}
              {p.name}
            </Body>
            <Body style={styles.lives}>{p.alive ? '❤️'.repeat(p.lives) || '💔' : '💀'}</Body>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(2) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bombCard: { alignItems: 'center', gap: theme.spacing(0.5), paddingVertical: theme.spacing(3), borderWidth: 1.5 },
  bombEmoji: { fontSize: 44 },
  muted: { color: theme.colors.textMuted },
  fragment: { fontSize: 52, fontWeight: '900', letterSpacing: 4, marginVertical: theme.spacing(1) },
  timerBarBg: {
    width: '80%',
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    marginTop: theme.spacing(1),
  },
  timerBar: { height: 10, borderRadius: 5 },
  timer: { fontWeight: '800', marginTop: theme.spacing(0.5) },
  inputRow: { flexDirection: 'row', gap: theme.spacing(1), alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderColor: '#FF8A3D',
    borderWidth: 1.5,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    fontSize: theme.font.h3,
    height: 52,
    paddingHorizontal: theme.spacing(2),
  },
  waiting: { textAlign: 'center', color: theme.colors.textMuted, paddingVertical: theme.spacing(1) },
  players: { flex: 1 },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing(1.5),
  },
  playerName: { fontSize: theme.font.body, color: theme.colors.text, fontWeight: '600' },
  lives: { fontSize: theme.font.body },
});
