import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface MemCard { value: string | null; matched: boolean }
interface MemState {
  phase: 'playing' | 'ended';
  cards: MemCard[];
  currentName: string;
  myTurn: boolean;
  scores: { name: string; pairs: number; isMe: boolean }[];
  actions: string[];
}

export function MemoryView({ state }: { state: MemState }) {
  const { sendAction } = useStore();

  return (
    <View style={styles.root}>
      <Body style={styles.turn}>
        {state.myTurn ? '➡️ À toi de jouer' : `Au tour de ${state.currentName}...`}
      </Body>

      <View style={styles.grid}>
        {state.cards.map((c, i) => {
          const faceUp = c.value != null;
          return (
            <Pressable
              key={i}
              disabled={!state.myTurn || faceUp}
              onPress={() => sendAction('flip', { index: i })}
              style={[styles.card, faceUp ? styles.cardUp : styles.cardDown, c.matched && styles.matched]}
            >
              <Title style={styles.symbol}>{faceUp ? c.value : '?'}</Title>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.board}>
        {state.scores.map((s, i) => (
          <View key={i} style={styles.row}>
            <Body style={[styles.name, s.isMe && { color: theme.colors.primary, fontWeight: '800' }]}>{s.name}{s.isMe ? ' (toi)' : ''}</Body>
            <Body style={styles.pairs}>{s.pairs} paire{s.pairs > 1 ? 's' : ''}</Body>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1.5) },
  turn: { textAlign: 'center', color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1), justifyContent: 'center' },
  card: { width: 70, height: 70, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  cardDown: { backgroundColor: '#2980B9', borderColor: '#2980B9' },
  cardUp: { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
  matched: { opacity: 0.45, borderColor: theme.colors.success },
  symbol: { fontSize: 34, color: theme.colors.white },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: theme.colors.text },
  pairs: { color: '#2980B9', fontWeight: '800' },
});
