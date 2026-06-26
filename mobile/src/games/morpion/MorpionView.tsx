import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

type Cell = 'X' | 'O' | null;
interface MState {
  phase: 'playing' | 'result' | 'ended';
  round: number; totalRounds: number;
  board: Cell[];
  mySymbol: 'X' | 'O' | null;
  currentName: string;
  myTurn: boolean;
  lastResult: { winnerName: string | null; draw: boolean; line: number[] | null } | null;
  scores: { name: string; symbol: 'X' | 'O'; wins: number; isMe: boolean }[];
  actions: string[];
}

const SYMBOL_COLOR: Record<'X' | 'O', string> = { X: '#4C8DFF', O: '#FF5A5F' };

export function MorpionView({ state }: { state: MState }) {
  const { sendAction } = useStore();
  const winLine = state.lastResult?.line ?? [];

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Manche ${state.round}/${state.totalRounds}`} color={theme.colors.textMuted} />
        <Pill
          label={state.mySymbol ? `Tu es ${state.mySymbol}` : ''}
          color={state.mySymbol ? SYMBOL_COLOR[state.mySymbol] : theme.colors.textMuted}
          filled
        />
      </View>

      <Body style={styles.turn}>
        {state.phase === 'result'
          ? state.lastResult?.draw
            ? '🤝 Match nul !'
            : `🏆 ${state.lastResult?.winnerName} gagne la manche`
          : state.myTurn
          ? '➡️ À toi de jouer'
          : `En attente de ${state.currentName}...`}
      </Body>

      <Card style={styles.boardCard}>
        <View style={styles.grid}>
          {state.board.map((c, i) => {
            const win = winLine.includes(i);
            return (
              <Pressable
                key={i}
                disabled={!state.myTurn || !!c}
                onPress={() => sendAction('play', { cell: i })}
                style={[styles.cell, win && { backgroundColor: theme.colors.success + '44' }]}
              >
                <Title style={[styles.cellText, c ? { color: SYMBOL_COLOR[c] } : undefined]}>{c ?? ''}</Title>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.board}>
        {state.scores.map((s, i) => (
          <View key={i} style={styles.row}>
            <Body style={[styles.name, s.isMe && { fontWeight: '800' }]}>
              <Body style={{ color: SYMBOL_COLOR[s.symbol] }}>{s.symbol}</Body> {s.name}{s.isMe ? ' (toi)' : ''}
            </Body>
            <Body style={styles.wins}>{'⭐'.repeat(s.wins) || '—'}</Body>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1.5) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  turn: { textAlign: 'center', color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '700' },
  boardCard: { alignItems: 'center', paddingVertical: theme.spacing(2) },
  grid: { width: 300, height: 300, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: {
    width: 94, height: 94, borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  cellText: { fontSize: 50, fontWeight: '900' },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: theme.colors.text },
  wins: { fontSize: theme.font.body },
});
