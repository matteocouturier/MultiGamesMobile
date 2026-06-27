import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface ReflexState {
  phase: 'arming' | 'go' | 'result' | 'ended';
  round: number;
  totalRounds: number;
  myFalseStart: boolean;
  winnerName: string | null;
  iWon: boolean;
  lastReactionMs: number | null;
  scores: { name: string; wins: number; isMe: boolean }[];
  actions: string[];
}

export function ReflexView({ state }: { state: ReflexState }) {
  const { sendAction } = useStore();

  const zone = (() => {
    if (state.phase === 'go') return { bg: theme.colors.success, big: 'TAPE !', sub: 'Vite !' };
    if (state.phase === 'arming')
      return state.myFalseStart
        ? { bg: theme.colors.danger, big: 'Faux départ ✗', sub: 'Attends la prochaine manche' }
        : { bg: theme.colors.surfaceAlt, big: 'Attends…', sub: 'Ne tape pas avant le signal' };
    if (state.phase === 'result')
      return {
        bg: theme.colors.surfaceAlt,
        big: state.winnerName ? `🏆 ${state.winnerName}` : 'Personne !',
        sub: state.lastReactionMs != null ? `${state.lastReactionMs} ms` : 'Manche nulle',
      };
    return { bg: theme.colors.surfaceAlt, big: '', sub: '' };
  })();

  const canTap = state.actions.includes('tap');

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Manche ${state.round}/${state.totalRounds}`} color={theme.colors.textMuted} />
        {state.iWon && state.phase === 'result' && <Pill label="Gagné !" color={theme.colors.success} filled />}
      </View>

      <Pressable
        style={[styles.zone, { backgroundColor: zone.bg }]}
        disabled={!canTap}
        onPress={() => sendAction('tap')}
      >
        <Title style={styles.zoneBig}>{zone.big}</Title>
        <Body style={styles.zoneSub}>{zone.sub}</Body>
      </Pressable>

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
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 30 },
  zone: {
    flex: 1,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
  },
  zoneBig: { fontSize: 44, fontWeight: '900', textAlign: 'center', color: theme.colors.white },
  zoneSub: { color: theme.colors.white, opacity: 0.9, textAlign: 'center' },
  board: { gap: theme.spacing(0.5) },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: theme.colors.text },
  wins: { fontSize: theme.font.body },
});
