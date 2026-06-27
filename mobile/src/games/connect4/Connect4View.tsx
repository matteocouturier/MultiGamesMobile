import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Card, Pill } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

type Disc = 'R' | 'Y' | null;
interface C4State {
  phase: 'playing' | 'result' | 'ended';
  round: number; totalRounds: number;
  cols: number; rows: number;
  board: Disc[];
  myDisc: 'R' | 'Y' | null;
  currentName: string;
  myTurn: boolean;
  lastResult: { winnerName: string | null; draw: boolean; line: number[] | null } | null;
  scores: { name: string; disc: 'R' | 'Y'; wins: number; isMe: boolean }[];
  actions: string[];
}

const DISC_COLOR: Record<'R' | 'Y', string> = { R: '#E74C3C', Y: '#F1C40F' };

export function Connect4View({ state }: { state: C4State }) {
  const { sendAction } = useStore();
  const winLine = state.lastResult?.line ?? [];
  const cellSize = Math.floor(330 / state.cols);

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Manche ${state.round}/${state.totalRounds}`} color={theme.colors.textMuted} />
        <Pill label={state.myDisc ? 'Toi' : ''} color={state.myDisc ? DISC_COLOR[state.myDisc] : theme.colors.textMuted} filled />
      </View>

      <Body style={styles.turn}>
        {state.phase === 'result'
          ? state.lastResult?.draw ? '🤝 Match nul !' : `🏆 ${state.lastResult?.winnerName} gagne la manche`
          : state.myTurn ? '➡️ À toi : choisis une colonne' : `En attente de ${state.currentName}...`}
      </Body>

      <Card style={styles.boardCard}>
        {/* Column buttons */}
        <View style={styles.colRow}>
          {Array.from({ length: state.cols }).map((_, c) => (
            <Pressable key={c} disabled={!state.myTurn} onPress={() => sendAction('drop', { col: c })} style={[styles.colBtn, { width: cellSize }]}>
              <Body style={styles.colArrow}>{state.myTurn ? '▾' : ''}</Body>
            </Pressable>
          ))}
        </View>
        <View style={styles.grid}>
          {state.board.map((d, i) => {
            const win = winLine.includes(i);
            return (
              <View key={i} style={[styles.cell, { width: cellSize, height: cellSize }]}>
                <View style={[styles.disc, { width: cellSize - 10, height: cellSize - 10 }, d ? { backgroundColor: DISC_COLOR[d] } : styles.empty, win && styles.winDisc]} />
              </View>
            );
          })}
        </View>
      </Card>

      <Card style={styles.board}>
        {state.scores.map((s, i) => (
          <View key={i} style={styles.row}>
            <Body style={[styles.name, s.isMe && { fontWeight: '800' }]}>
              <Body style={{ color: DISC_COLOR[s.disc] }}>●</Body> {s.name}{s.isMe ? ' (toi)' : ''}
            </Body>
            <Body style={styles.wins}>{'⭐'.repeat(s.wins) || '—'}</Body>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  turn: { textAlign: 'center', color: theme.colors.text, fontWeight: '700' },
  boardCard: { alignItems: 'center', padding: theme.spacing(1), backgroundColor: '#1B2A6B' },
  colRow: { flexDirection: 'row' },
  colBtn: { alignItems: 'center', justifyContent: 'center', height: 24 },
  colArrow: { color: theme.colors.white, fontSize: 18, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 330 },
  cell: { alignItems: 'center', justifyContent: 'center' },
  disc: { borderRadius: 999 },
  empty: { backgroundColor: '#0E1A4A' },
  winDisc: { borderWidth: 3, borderColor: theme.colors.white },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: theme.colors.text },
  wins: { fontSize: theme.font.body },
});
