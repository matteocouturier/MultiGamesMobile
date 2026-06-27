import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Body, Button, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface WState {
  phase: 'clue' | 'guess' | 'reveal' | 'ended';
  turn: number; totalTurns: number;
  spectrum: { left: string; right: string };
  activeTeamName: string; activeTeamColor: string;
  myRole: 'psychic' | 'guesser' | 'spectator';
  psychicName: string; guesserName: string;
  target: number | null;
  clue: string | null;
  guess: number | null;
  points: number | null;
  leaderboard: { name: string; color: string; score: number; isMine: boolean }[];
  actions: string[];
}

const ACCENT = '#A78BFA';

export function WavelengthView({ state }: { state: WState }) {
  const { sendAction } = useStore();
  const [clue, setClue] = useState('');
  const [localGuess, setLocalGuess] = useState(50);
  const width = useRef(0);

  useEffect(() => { setClue(''); setLocalGuess(50); }, [state.turn]);

  const onLayout = (e: LayoutChangeEvent) => { width.current = e.nativeEvent.layout.width; };
  const onTrackPress = (e: { nativeEvent: { locationX: number } }) => {
    if (width.current > 0) setLocalGuess(Math.max(0, Math.min(100, Math.round((e.nativeEvent.locationX / width.current) * 100))));
  };

  const canGuess = state.actions.includes('guess');
  const canClue = state.actions.includes('clue');

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Tour ${state.turn}/${state.totalTurns}`} color={theme.colors.textMuted} />
        <Pill label={`Équipe ${state.activeTeamName}`} color={state.activeTeamColor} filled />
      </View>

      {/* Spectrum */}
      <Card style={styles.specCard}>
        <View style={styles.labels}>
          <Body style={styles.labelL}>{state.spectrum.left}</Body>
          <Body style={styles.labelR}>{state.spectrum.right}</Body>
        </View>
        <Pressable onLayout={onLayout} onPress={canGuess ? onTrackPress : undefined} style={styles.track}>
          <View style={styles.trackFill} />
          {/* Target marker (visible to psychic in clue phase, everyone at reveal) */}
          {state.target != null && <View style={[styles.marker, styles.targetMarker, { left: `${state.target}%` }]} />}
          {/* Guess marker */}
          {state.phase === 'reveal' && state.guess != null && <View style={[styles.marker, styles.guessMarker, { left: `${state.guess}%` }]} />}
          {canGuess && <View style={[styles.marker, styles.guessMarker, { left: `${localGuess}%` }]} />}
        </Pressable>
      </Card>

      {/* Role-specific area */}
      {state.phase === 'clue' && (
        canClue ? (
          <Card style={styles.actionCard}>
            <Body style={styles.muted}>🔮 Tu vois la cible. Donne UN indice à {state.guesserName} :</Body>
            <View style={styles.inputRow}>
              <TextInput value={clue} onChangeText={setClue} placeholder="Ton indice..." placeholderTextColor={theme.colors.textMuted} style={styles.input} autoFocus returnKeyType="send" onSubmitEditing={() => clue.trim() && sendAction('clue', { word: clue.trim() })} />
              <Button label="Go" onPress={() => clue.trim() && sendAction('clue', { word: clue.trim() })} color={ACCENT} small />
            </View>
          </Card>
        ) : (
          <Body style={styles.info}>🔮 {state.psychicName} réfléchit à un indice...</Body>
        )
      )}

      {state.phase === 'guess' && (
        <Card style={styles.actionCard}>
          <Body style={styles.muted}>Indice :</Body>
          <Title style={styles.clue}>« {state.clue} »</Title>
          {canGuess ? (
            <>
              <Body style={styles.guessVal}>{localGuess}</Body>
              <View style={styles.fineRow}>
                <Button label="−" onPress={() => setLocalGuess((v) => Math.max(0, v - 1))} variant="ghost" small />
                <View style={{ flex: 1 }}><Button label="Valider ma réponse" onPress={() => sendAction('guess', { value: localGuess })} color={ACCENT} /></View>
                <Button label="+" onPress={() => setLocalGuess((v) => Math.min(100, v + 1))} variant="ghost" small />
              </View>
            </>
          ) : (
            <Body style={styles.info}>{state.guesserName} place le curseur...</Body>
          )}
        </Card>
      )}

      {state.phase === 'reveal' && (
        <Card style={styles.actionCard}>
          <Body style={styles.muted}>Indice « {state.clue} » — cible {state.target}, réponse {state.guess}</Body>
          <Title style={[styles.points, { color: (state.points ?? 0) > 0 ? theme.colors.success : theme.colors.danger }]}>+{state.points} pts</Title>
        </Card>
      )}

      <Card style={styles.board}>
        {state.leaderboard.map((t, i) => (
          <View key={i} style={styles.row}>
            <Body style={[styles.name, { color: t.color }]}>Équipe {t.name}{t.isMine ? ' (vous)' : ''}</Body>
            <Body style={styles.score}>{t.score}</Body>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1.25) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  specCard: { gap: theme.spacing(1), paddingVertical: theme.spacing(2) },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  labelL: { color: theme.colors.text, fontWeight: '800' },
  labelR: { color: theme.colors.text, fontWeight: '800' },
  track: { height: 26, borderRadius: 13, backgroundColor: theme.colors.surfaceAlt, justifyContent: 'center', overflow: 'visible' },
  trackFill: { ...StyleSheet.absoluteFillObject, borderRadius: 13, borderWidth: 1, borderColor: theme.colors.borderStrong },
  marker: { position: 'absolute', top: -6, width: 4, height: 38, borderRadius: 2, marginLeft: -2 },
  targetMarker: { backgroundColor: '#FFD24D' },
  guessMarker: { backgroundColor: ACCENT, width: 6, marginLeft: -3 },
  actionCard: { gap: theme.spacing(1), alignItems: 'center', paddingVertical: theme.spacing(2) },
  muted: { color: theme.colors.textMuted, textAlign: 'center' },
  info: { textAlign: 'center', color: theme.colors.textMuted, paddingVertical: theme.spacing(1) },
  inputRow: { flexDirection: 'row', gap: theme.spacing(1), alignItems: 'center', alignSelf: 'stretch' },
  input: { flex: 1, backgroundColor: theme.colors.surface, borderColor: ACCENT, borderWidth: 1.5, borderRadius: theme.radius.md, color: theme.colors.text, fontSize: theme.font.h3, height: 50, paddingHorizontal: theme.spacing(2) },
  clue: { fontSize: theme.font.h2, color: ACCENT, textAlign: 'center' },
  guessVal: { fontSize: 44, fontWeight: '900', color: theme.colors.text },
  fineRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1), alignSelf: 'stretch' },
  points: { fontSize: 34 },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontWeight: '700' },
  score: { color: theme.colors.text, fontWeight: '800' },
});
