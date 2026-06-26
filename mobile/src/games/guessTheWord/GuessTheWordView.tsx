import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Body, Button, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface TeamScore {
  teamId: string;
  name: string;
  color: string;
  score: number;
}
interface GTWState {
  phase: 'transition' | 'turn' | 'ended';
  myRole: 'describer' | 'guesser' | 'referee' | 'spectator';
  myTeamId: string | null;
  scores: TeamScore[];
  activeTeamId: string;
  activeTeamName: string;
  activeTeamColor: string;
  round: number;
  totalRounds: number;
  turnIndex: number;
  totalTurns: number;
  timeLeft: number;
  turnDuration: number;
  describerName: string;
  guesserName: string;
  word: string | null;
  foundThisTurn: number;
  actions: string[];
}

const ROLE_LABEL: Record<GTWState['myRole'], string> = {
  describer: 'Tu fais deviner',
  guesser: 'Tu devines',
  referee: 'Tu arbitres',
  spectator: 'Spectateur',
};

export function GuessTheWordView({ state }: { state: GTWState }) {
  const { sendAction } = useStore();
  const has = (a: string) => state.actions.includes(a);

  return (
    <View style={styles.root}>
      {/* Scoreboard */}
      <View style={styles.scoreRow}>
        {state.scores.map((t) => (
          <Card
            key={t.teamId}
            style={[
              styles.scoreCard,
              { borderColor: t.color, opacity: t.teamId === state.activeTeamId ? 1 : 0.5 },
            ]}
          >
            <Body style={[styles.scoreName, { color: t.color }]}>{t.name}</Body>
            <Title style={styles.scoreVal}>{t.score}</Title>
          </Card>
        ))}
      </View>

      <View style={styles.metaRow}>
        <Pill label={`Manche ${state.round}/${state.totalRounds}`} color={theme.colors.textMuted} />
        <Pill label={ROLE_LABEL[state.myRole]} color={state.activeTeamColor} filled />
      </View>

      {state.phase === 'turn' && <Timer state={state} />}

      {/* Main area */}
      <View style={styles.main}>
        {state.phase === 'transition' ? (
          <Transition state={state} onReady={() => sendAction('ready')} canReady={has('ready')} />
        ) : (
          <TurnArea state={state} />
        )}
      </View>

      {/* Action bar */}
      <View style={styles.actions}>
        {has('found') && (
          <Button label="✓ Trouvé" variant="success" onPress={() => sendAction('found')} />
        )}
        <View style={styles.actionRow}>
          {has('pass') && (
            <View style={styles.flex}>
              <Button label="→ Passer" variant="ghost" onPress={() => sendAction('pass')} />
            </View>
          )}
          {has('foul') && (
            <View style={styles.flex}>
              <Button label="⚠ Faute" variant="warning" onPress={() => sendAction('foul')} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function Timer({ state }: { state: GTWState }) {
  const ratio = Math.max(0, state.timeLeft / state.turnDuration);
  const color =
    state.timeLeft <= 10 ? theme.colors.danger : state.timeLeft <= 25 ? theme.colors.warning : theme.colors.success;
  return (
    <View style={styles.timerWrap}>
      <View style={styles.timerBarBg}>
        <View style={[styles.timerBar, { width: `${ratio * 100}%`, backgroundColor: color }]} />
      </View>
      <Body style={[styles.timerText, { color }]}>{state.timeLeft}s</Body>
    </View>
  );
}

function Transition({
  state,
  onReady,
  canReady,
}: {
  state: GTWState;
  onReady: () => void;
  canReady: boolean;
}) {
  return (
    <Card style={styles.transitionCard}>
      <Body style={styles.transTitle}>Au tour de l'équipe</Body>
      <Title style={{ color: state.activeTeamColor }}>{state.activeTeamName}</Title>
      <View style={styles.rolesBox}>
        <Body style={styles.roleLine}>🗣️ {state.describerName} fait deviner</Body>
        <Body style={styles.roleLine}>🤔 {state.guesserName} devine</Body>
      </View>
      {canReady ? (
        <Button label="Commencer le tour" onPress={onReady} color={state.activeTeamColor} />
      ) : (
        <Body style={styles.muted}>La partie démarre dans un instant...</Body>
      )}
    </Card>
  );
}

function TurnArea({ state }: { state: GTWState }) {
  if (state.myRole === 'guesser') {
    return (
      <Card style={styles.wordCard}>
        <Body style={styles.muted}>Écoute ton coéquipier et</Body>
        <Title style={styles.bigWord}>Devine ! 🤔</Title>
        <Body style={styles.muted}>{state.describerName} te fait deviner le mot</Body>
      </Card>
    );
  }
  // describer & referee see the word
  return (
    <Card style={styles.wordCard}>
      <Body style={styles.muted}>
        {state.myRole === 'describer' ? 'Fais deviner ce mot :' : 'Mot à deviner (arbitre) :'}
      </Body>
      <Title style={styles.bigWord}>{state.word ?? '—'}</Title>
      <Body style={styles.muted}>
        {state.foundThisTurn} trouvé{state.foundThisTurn > 1 ? 's' : ''} ce tour
      </Body>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(2) },
  scoreRow: { flexDirection: 'row', gap: theme.spacing(1.5) },
  scoreCard: { flex: 1, alignItems: 'center', borderWidth: 1.5, paddingVertical: theme.spacing(1.5) },
  scoreName: { fontWeight: '700', fontSize: theme.font.small },
  scoreVal: { fontSize: 34 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerWrap: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5) },
  timerBarBg: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  timerBar: { height: 12, borderRadius: 6 },
  timerText: { fontWeight: '800', width: 44, textAlign: 'right' },
  main: { flex: 1, justifyContent: 'center' },
  wordCard: { alignItems: 'center', paddingVertical: theme.spacing(5), gap: theme.spacing(1) },
  bigWord: { fontSize: 40, textAlign: 'center', fontWeight: '900' },
  muted: { color: theme.colors.textMuted, textAlign: 'center' },
  transitionCard: { alignItems: 'center', gap: theme.spacing(1.5), paddingVertical: theme.spacing(4) },
  transTitle: { color: theme.colors.textMuted },
  rolesBox: { gap: theme.spacing(0.5), marginVertical: theme.spacing(1) },
  roleLine: { color: theme.colors.text, fontSize: theme.font.h3, textAlign: 'center' },
  actions: { gap: theme.spacing(1) },
  actionRow: { flexDirection: 'row', gap: theme.spacing(1.5) },
  flex: { flex: 1 },
});
