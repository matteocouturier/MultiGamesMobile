import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

type Choice = 'rock' | 'paper' | 'scissors';
const EMOJI: Record<Choice, string> = { rock: '✊', paper: '✋', scissors: '✌️' };
const LABEL: Record<Choice, string> = { rock: 'Pierre', paper: 'Feuille', scissors: 'Ciseaux' };

interface CFState {
  phase: 'pick' | 'reveal' | 'ended';
  round: number; totalRounds: number;
  timeLeft: number; duration: number;
  myChoice: Choice | null;
  pickedCount: number; totalPlayers: number;
  reveal: { name: string; choice: Choice | null; roundPts: number }[] | null;
  leaderboard: { name: string; score: number; isMe: boolean }[];
  actions: string[];
}

export function ChifoumiView({ state }: { state: CFState }) {
  const { sendAction } = useStore();

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Manche ${state.round}/${state.totalRounds}`} color={theme.colors.textMuted} />
        <Pill label={`${state.pickedCount}/${state.totalPlayers} prêts`} color="#E67E22" />
      </View>

      {state.phase === 'reveal' && state.reveal ? (
        <Card style={{ gap: theme.spacing(1) }}>
          {state.reveal.map((r, i) => (
            <View key={i} style={styles.revRow}>
              <Body style={styles.revEmoji}>{r.choice ? EMOJI[r.choice] : '—'}</Body>
              <Body style={styles.revName}>{r.name}</Body>
              <Pill label={`+${r.roundPts}`} color={r.roundPts > 0 ? theme.colors.success : theme.colors.textMuted} />
            </View>
          ))}
        </Card>
      ) : (
        <Card style={styles.pickCard}>
          <Body style={styles.muted}>{state.myChoice ? 'Choix enregistré !' : 'Fais ton choix !'}</Body>
          <View style={styles.choices}>
            {(['rock', 'paper', 'scissors'] as Choice[]).map((c) => (
              <Pressable
                key={c}
                disabled={state.myChoice != null}
                onPress={() => sendAction('pick', { choice: c })}
                style={[styles.choice, state.myChoice === c && { borderColor: '#E67E22', backgroundColor: theme.colors.surfaceAlt }]}
              >
                <Title style={styles.choiceEmoji}>{EMOJI[c]}</Title>
                <Body style={styles.muted}>{LABEL[c]}</Body>
              </Pressable>
            ))}
          </View>
          <Body style={styles.timer}>⏱️ {state.timeLeft}s</Body>
        </Card>
      )}

      <Card style={styles.board}>
        {state.leaderboard.map((s, i) => (
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
  pickCard: { alignItems: 'center', gap: theme.spacing(1.5), paddingVertical: theme.spacing(2) },
  muted: { color: theme.colors.textMuted },
  choices: { flexDirection: 'row', gap: theme.spacing(1.5) },
  choice: { width: 90, height: 100, borderRadius: theme.radius.md, borderWidth: 2, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', gap: 4 },
  choiceEmoji: { fontSize: 40 },
  timer: { color: theme.colors.textMuted, fontWeight: '700' },
  revRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5) },
  revEmoji: { fontSize: 28 },
  revName: { flex: 1, color: theme.colors.text, fontWeight: '600' },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: theme.colors.text },
  score: { color: '#E67E22', fontWeight: '800' },
});
