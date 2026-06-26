import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Body, Button, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface PLState {
  phase: 'play' | 'result' | 'ended';
  round: number; totalRounds: number;
  timeLeft: number;
  myPot: number;
  myStatus: 'active' | 'banked' | 'busted';
  myTotal: number;
  players: { name: string; total: number; status: string; pot: number; isMe: boolean }[];
  actions: string[];
}

export function PressLuckView({ state }: { state: PLState }) {
  const { sendAction } = useStore();
  const active = state.actions.includes('roll');

  const statusText =
    state.myStatus === 'busted' ? '💥 Explosé ! Manche perdue' :
    state.myStatus === 'banked' ? '🏦 Sécurisé !' :
    state.phase === 'result' ? 'Manche terminée' : 'À toi de tenter !';

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Manche ${state.round}/${state.totalRounds}`} color={theme.colors.textMuted} />
        <Pill label={`⏱️ ${state.timeLeft}s`} color="#F1C40F" filled />
      </View>

      <Card style={[styles.potCard, state.myStatus === 'busted' && { borderColor: theme.colors.danger }]}>
        <Body style={styles.muted}>Butin de la manche</Body>
        <Title style={[styles.pot, state.myStatus === 'busted' && { color: theme.colors.danger }]}>
          {state.myStatus === 'busted' ? '0' : state.myPot}
        </Title>
        <Body style={styles.muted}>Total sécurisé : {state.myTotal}</Body>
        <Body style={styles.status}>{statusText}</Body>
      </Card>

      {active && (
        <View style={styles.btnRow}>
          <View style={styles.flex}><Button label="🎲 Encore !" onPress={() => sendAction('roll')} color="#E67E22" /></View>
          <View style={styles.flex}><Button label="🏦 Stop" onPress={() => sendAction('bank')} variant="success" /></View>
        </View>
      )}

      <Card style={styles.board}>
        {state.players.map((p, i) => (
          <View key={i} style={styles.row}>
            <Body style={[styles.name, p.isMe && { color: theme.colors.primary, fontWeight: '800' }]}>
              {p.status === 'busted' ? '💥 ' : p.status === 'banked' ? '🏦 ' : '🎲 '}{p.name}{p.isMe ? ' (toi)' : ''}
            </Body>
            <Body style={styles.total}>{p.total}</Body>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1.5) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  potCard: { alignItems: 'center', paddingVertical: theme.spacing(3), gap: theme.spacing(0.5), borderWidth: 1.5 },
  muted: { color: theme.colors.textMuted },
  pot: { fontSize: 56, fontWeight: '900', color: '#F1C40F' },
  status: { color: theme.colors.text, fontWeight: '700', marginTop: theme.spacing(0.5) },
  btnRow: { flexDirection: 'row', gap: theme.spacing(1.5) },
  flex: { flex: 1 },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: theme.colors.text },
  total: { color: '#F1C40F', fontWeight: '800' },
});
