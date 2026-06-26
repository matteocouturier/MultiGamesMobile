import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface TCState {
  phase: 'pick' | 'reveal' | 'ended';
  round: number; totalRounds: number;
  timeLeft: number;
  myHand: number[];
  myPick: number | null;
  pickedCount: number; totalPlayers: number;
  reveal: { name: string; value: number; won: boolean }[] | null;
  leaderboard: { name: string; score: number; isMe: boolean }[];
  actions: string[];
}

export function TopCardView({ state }: { state: TCState }) {
  const { sendAction } = useStore();

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Manche ${state.round}/${state.totalRounds}`} color={theme.colors.textMuted} />
        <Pill label={state.phase === 'pick' ? `${state.pickedCount}/${state.totalPlayers} • ${state.timeLeft}s` : 'Résultat'} color="#8E44AD" filled />
      </View>

      {state.phase === 'reveal' && state.reveal ? (
        <Card style={{ gap: theme.spacing(1) }}>
          {state.reveal.map((r, i) => (
            <View key={i} style={styles.revRow}>
              <View style={[styles.cardChip, r.won && { borderColor: theme.colors.success, backgroundColor: theme.colors.success + '22' }]}>
                <Title style={styles.cardVal}>{r.value}</Title>
              </View>
              <Body style={styles.revName}>{r.name}</Body>
              {r.won && <Pill label="Gagne" color={theme.colors.success} filled />}
            </View>
          ))}
        </Card>
      ) : (
        <Card style={styles.handCard}>
          <Body style={styles.muted}>{state.myPick != null ? `Tu as joué le ${state.myPick}` : 'Choisis ta carte'}</Body>
          <View style={styles.hand}>
            {state.myHand.map((v) => (
              <Pressable
                key={v}
                disabled={state.myPick != null}
                onPress={() => sendAction('play', { value: v })}
                style={[styles.card, state.myPick === v && { borderColor: '#8E44AD', backgroundColor: '#8E44AD33' }]}
              >
                <Title style={styles.cardBig}>{v}</Title>
              </Pressable>
            ))}
          </View>
        </Card>
      )}

      <Card style={styles.board}>
        {state.leaderboard.map((s, i) => (
          <View key={i} style={styles.row}>
            <Body style={[styles.name, s.isMe && { color: theme.colors.primary, fontWeight: '800' }]}>{i + 1}. {s.name}{s.isMe ? ' (toi)' : ''}</Body>
            <Body style={styles.score}>{'⭐'.repeat(s.score) || '—'}</Body>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1.5) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  handCard: { gap: theme.spacing(1.5), paddingVertical: theme.spacing(2), alignItems: 'center' },
  muted: { color: theme.colors.textMuted },
  hand: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1), justifyContent: 'center' },
  card: { width: 56, height: 78, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceAlt, borderWidth: 2, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  cardBig: { fontSize: 32, fontWeight: '900', color: theme.colors.text },
  revRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5) },
  cardChip: { width: 40, height: 54, borderRadius: theme.radius.sm, borderWidth: 2, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  cardVal: { fontSize: 22, fontWeight: '900', color: theme.colors.text },
  revName: { flex: 1, color: theme.colors.text, fontWeight: '600' },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: theme.colors.text },
  score: { fontSize: theme.font.body },
});
