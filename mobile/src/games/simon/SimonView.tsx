import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface SimonState {
  phase: 'show' | 'input' | 'result' | 'ended';
  length: number;
  sequence: number[] | null;
  myProgress: number;
  amIAlive: boolean;
  amIDone: boolean;
  players: { name: string; alive: boolean; done: boolean; isMe: boolean }[];
  actions: string[];
}

const PADS = ['#FF5A5F', '#34C759', '#4C8DFF', '#FFC53D'];

export function SimonView({ state }: { state: SimonState }) {
  const { sendAction } = useStore();
  const [active, setActive] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const seqKey = state.sequence ? state.sequence.join(',') : '';

  // Play the sequence animation when entering the "show" phase.
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (state.phase !== 'show' || !state.sequence) { setActive(null); return; }
    state.sequence.forEach((color, i) => {
      timers.current.push(setTimeout(() => setActive(color), i * 700 + 150));
      timers.current.push(setTimeout(() => setActive(null), i * 700 + 600));
    });
    return () => timers.current.forEach(clearTimeout);
  }, [seqKey, state.phase]);

  const canTap = state.actions.includes('tap');
  const flash = (i: number) => {
    setActive(i);
    setTimeout(() => setActive(null), 200);
    sendAction('tap', { color: i });
  };

  const header =
    state.phase === 'show' ? `👀 Mémorise ! (${state.length})` :
    state.phase === 'input' ? (state.amIDone ? '✓ Bien joué, attends les autres' : state.amIAlive ? `À toi ! (${state.myProgress}/${state.length})` : '💀 Éliminé') :
    state.phase === 'result' ? 'Manche terminée' : '';

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Séquence : ${state.length}`} color={theme.colors.textMuted} />
        {!state.amIAlive && <Pill label="Éliminé" color={theme.colors.danger} />}
      </View>

      <Body style={styles.header}>{header}</Body>

      <View style={styles.grid}>
        {PADS.map((hex, i) => (
          <Pressable
            key={i}
            disabled={!canTap}
            onPress={() => flash(i)}
            style={[styles.pad, { backgroundColor: hex, opacity: active === i ? 1 : 0.45 }]}
          />
        ))}
      </View>

      <Card style={styles.board}>
        {state.players.map((p, i) => (
          <View key={i} style={styles.row}>
            <Body style={[styles.name, p.isMe && { fontWeight: '800', color: theme.colors.primary }]}>{p.name}{p.isMe ? ' (toi)' : ''}</Body>
            <Body>{!p.alive ? '💀' : p.done ? '✓' : '…'}</Body>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1.5) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 30 },
  header: { textAlign: 'center', fontSize: theme.font.h3, fontWeight: '700', color: theme.colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1.5), justifyContent: 'center' },
  pad: { width: 150, height: 150, borderRadius: theme.radius.lg, borderWidth: 3, borderColor: '#ffffff22' },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: theme.colors.text },
});
