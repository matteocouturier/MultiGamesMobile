import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Body, Button, Card, Pill, Title } from '../../components/ui';
import { theme } from '../../theme';
import { useStore } from '../../state/store';

interface RevealTeam { id: string; name: string; color: string; answers: { name: string; word: string }[]; matched: boolean; points: number }
interface AState {
  phase: 'play' | 'reveal' | 'ended';
  round: number; totalRounds: number;
  prompt: string; timeLeft: number;
  myAnswer: string | null; iSubmitted: boolean;
  submittedCount: number; totalPlayers: number;
  myTeamName: string; teammateName: string;
  reveal: RevealTeam[] | null;
  leaderboard: { name: string; color: string; score: number }[];
  actions: string[];
}

export function AccordView({ state }: { state: AState }) {
  const { sendAction } = useStore();
  const [word, setWord] = useState('');
  const submit = () => { const w = word.trim(); if (w) sendAction('submit', { word: w }); setWord(''); };

  if (state.phase === 'reveal' && state.reveal) {
    return (
      <ScrollView contentContainerStyle={{ gap: theme.spacing(1.25), paddingBottom: 24 }}>
        <Title style={styles.center}>« {state.prompt} »</Title>
        {state.reveal.map((t) => (
          <Card key={t.id} style={[styles.revCard, { borderColor: t.color, borderWidth: 1.5 }]}>
            <View style={styles.revHead}>
              <Body style={[styles.revName, { color: t.color }]}>Équipe {t.name}</Body>
              <Pill label={t.matched ? '✓ +2' : '✗ +0'} color={t.matched ? theme.colors.success : theme.colors.textMuted} filled={t.matched} />
            </View>
            <View style={styles.revAnswers}>
              {t.answers.map((a, i) => (
                <View key={i} style={styles.answerChip}>
                  <Body style={styles.answerName}>{a.name}</Body>
                  <Body style={styles.answerWord}>{a.word || '—'}</Body>
                </View>
              ))}
            </View>
          </Card>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <Pill label={`Manche ${state.round}/${state.totalRounds}`} color={theme.colors.textMuted} />
        <Pill label={`⏱️ ${state.timeLeft}s`} color={state.timeLeft <= 8 ? theme.colors.danger : '#F472B6'} filled />
      </View>

      <Card style={styles.promptCard}>
        <Body style={styles.muted}>Avec {state.teammateName}, écrivez le même mot pour :</Body>
        <Title style={styles.prompt}>{state.prompt}</Title>
      </Card>

      {state.iSubmitted ? (
        <Body style={styles.waiting}>✓ « {state.myAnswer} » envoyé — {state.submittedCount}/{state.totalPlayers} ont répondu</Body>
      ) : (
        <View style={styles.inputRow}>
          <TextInput
            value={word}
            onChangeText={setWord}
            placeholder="Ton mot..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            autoCorrect={false}
            autoFocus
            returnKeyType="send"
            onSubmitEditing={submit}
          />
          <Button label="OK" onPress={submit} color="#F472B6" small />
        </View>
      )}

      <Card style={styles.board}>
        {state.leaderboard.map((t, i) => (
          <View key={i} style={styles.row}>
            <Body style={[styles.teamName, { color: t.color }]}>Équipe {t.name}</Body>
            <Body style={styles.score}>{t.score}</Body>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: theme.spacing(1.5) },
  center: { textAlign: 'center' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  promptCard: { alignItems: 'center', paddingVertical: theme.spacing(3), gap: theme.spacing(1) },
  muted: { color: theme.colors.textMuted, textAlign: 'center' },
  prompt: { fontSize: 30, textAlign: 'center', color: '#F472B6' },
  inputRow: { flexDirection: 'row', gap: theme.spacing(1), alignItems: 'center' },
  input: { flex: 1, backgroundColor: theme.colors.surface, borderColor: '#F472B6', borderWidth: 1.5, borderRadius: theme.radius.md, color: theme.colors.text, fontSize: theme.font.h3, height: 52, paddingHorizontal: theme.spacing(2) },
  waiting: { textAlign: 'center', color: theme.colors.textMuted },
  revCard: { gap: theme.spacing(1) },
  revHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revName: { fontWeight: '800', fontSize: theme.font.h3 },
  revAnswers: { flexDirection: 'row', gap: theme.spacing(1) },
  answerChip: { flex: 1, backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.sm, padding: theme.spacing(1), alignItems: 'center' },
  answerName: { color: theme.colors.textMuted, fontSize: theme.font.small },
  answerWord: { color: theme.colors.text, fontWeight: '700', fontSize: theme.font.h3 },
  board: { gap: theme.spacing(0.5), marginTop: 'auto' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  teamName: { fontWeight: '700' },
  score: { color: theme.colors.text, fontWeight: '800' },
});
