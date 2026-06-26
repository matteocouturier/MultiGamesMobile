import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Body, Button, Card, Pill, Screen, Subtitle, Title } from '../components/ui';
import { theme } from '../theme';
import { useStore } from '../state/store';
import { GameDefinition } from '../shared/types';

export function HomeScreen() {
  const { playerName, catalog, createRoom, joinRoom } = useStore();
  const [selected, setSelected] = useState<GameDefinition | null>(null);
  const [joinMode, setJoinMode] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const onCreate = async () => {
    if (!selected) return;
    setBusy(true);
    await createRoom(selected.id);
    setBusy(false);
    setSelected(null);
  };

  const onJoin = async () => {
    setBusy(true);
    await joinRoom(code);
    setBusy(false);
    setJoinMode(false);
    setCode('');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Title>Mini-jeux</Title>
          <Subtitle>Salut {playerName} 👋</Subtitle>
        </View>
        <Button label="Rejoindre" variant="ghost" small onPress={() => setJoinMode(true)} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {catalog.length === 0 && <Body style={styles.empty}>Chargement des jeux...</Body>}
        {catalog.map((g) => (
          <Pressable key={g.id} onPress={() => setSelected(g)}>
            <Card style={[styles.gameCard, { borderColor: g.color + '55' }]}>
              <View style={[styles.iconBubble, { backgroundColor: g.color + '22' }]}>
                <Body style={{ fontSize: 30 }}>{g.icon}</Body>
              </View>
              <View style={styles.gameInfo}>
                <Body style={styles.gameName}>{g.name}</Body>
                <Body style={styles.gameTag}>{g.tagline}</Body>
                <View style={styles.gameMeta}>
                  <Pill label={`${g.minPlayers}-${g.maxPlayers} joueurs`} color={g.color} />
                  {g.teamBased && <Pill label={`Équipes de ${g.teamSize}`} color={theme.colors.textMuted} />}
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      {/* Create sheet */}
      <Sheet visible={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <Title style={styles.sheetTitle}>
              {selected.icon} {selected.name}
            </Title>
            <Body style={styles.sheetDesc}>{selected.description}</Body>
            <Button label="Créer un salon" loading={busy} onPress={onCreate} color={selected.color} />
            <Button label="Annuler" variant="ghost" onPress={() => setSelected(null)} />
          </>
        )}
      </Sheet>

      {/* Join sheet */}
      <Sheet visible={joinMode} onClose={() => setJoinMode(false)}>
        <Title style={styles.sheetTitle}>Rejoindre un salon</Title>
        <Body style={styles.sheetDesc}>Entre le code à 6 lettres communiqué par l'hôte.</Body>
        <TextInput
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6))}
          placeholder="ABCDEF"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="characters"
          style={styles.codeInput}
        />
        <Button label="Rejoindre" loading={busy} disabled={code.length !== 6} onPress={onJoin} />
        <Button label="Annuler" variant="ghost" onPress={() => setJoinMode(false)} />
      </Sheet>
    </Screen>
  );
}

function Sheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>{children}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2.5),
  },
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing(6) },
  gameCard: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing(1.5), gap: theme.spacing(2) },
  iconBubble: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameInfo: { flex: 1, gap: theme.spacing(0.5) },
  gameName: { fontSize: theme.font.h3, fontWeight: '700', color: theme.colors.text },
  gameTag: { fontSize: theme.font.small, color: theme.colors.textMuted },
  gameMeta: { flexDirection: 'row', gap: theme.spacing(1), marginTop: theme.spacing(0.5), flexWrap: 'wrap' },
  backdrop: { flex: 1, backgroundColor: '#000000AA' },
  sheet: {
    backgroundColor: theme.colors.surfaceAlt,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.spacing(3),
    gap: theme.spacing(1.5),
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  sheetTitle: { fontSize: theme.font.h2 },
  sheetDesc: { color: theme.colors.textMuted, marginBottom: theme.spacing(1) },
  codeInput: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    height: 64,
    marginBottom: theme.spacing(1),
  },
});
