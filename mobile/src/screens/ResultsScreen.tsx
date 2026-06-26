import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Body, Button, Card, Screen, Subtitle, Title } from '../components/ui';
import { theme } from '../theme';
import { useStore } from '../state/store';

const MEDALS = ['🥇', '🥈', '🥉'];

export function ResultsScreen() {
  const { results, room, myId, rematch, leaveRoom } = useStore();
  const isHost = room?.hostId === myId;

  return (
    <Screen style={styles.center}>
      <Title style={styles.heading}>Partie terminée</Title>
      {results?.summary && <Subtitle style={styles.summary}>{results.summary}</Subtitle>}

      <View style={styles.ranking}>
        {results?.ranking.map((r, i) => (
          <Card key={i} style={[styles.row, { borderColor: r.color ?? theme.colors.border }]}>
            <Body style={styles.medal}>{MEDALS[i] ?? `${i + 1}.`}</Body>
            <Body style={[styles.label, { color: r.color ?? theme.colors.text }]}>{r.label}</Body>
            <Body style={styles.score}>{r.score} pts</Body>
          </Card>
        ))}
      </View>

      <View style={styles.actions}>
        {isHost && <Button label="🔁 Rejouer" onPress={rematch} />}
        <Button label="Quitter le salon" variant="ghost" onPress={leaveRoom} />
        {!isHost && <Body style={styles.muted}>En attente de l'hôte pour rejouer...</Body>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center' },
  heading: { textAlign: 'center' },
  summary: { textAlign: 'center', marginBottom: theme.spacing(3) },
  ranking: { gap: theme.spacing(1.5), marginVertical: theme.spacing(2) },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2), borderWidth: 1.5 },
  medal: { fontSize: 26 },
  label: { flex: 1, fontSize: theme.font.h3, fontWeight: '700' },
  score: { fontSize: theme.font.h3, fontWeight: '800', color: theme.colors.text },
  actions: { gap: theme.spacing(1), marginTop: theme.spacing(2) },
  muted: { textAlign: 'center', color: theme.colors.textMuted },
});
