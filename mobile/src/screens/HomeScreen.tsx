import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
          <Body style={styles.kicker}>BIENVENUE</Body>
          <Title style={styles.brand}>Salut {playerName} 👋</Title>
          <Subtitle>{catalog.length} mini-jeux à jouer ensemble</Subtitle>
        </View>
        <Button label="Rejoindre" variant="ghost" small onPress={() => setJoinMode(true)} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {catalog.length === 0 && <Body style={styles.empty}>Chargement des jeux...</Body>}
        {catalog.map((g) => (
          <Pressable key={g.id} onPress={() => setSelected(g)} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
            <View style={[styles.gameCard, { borderColor: g.color + '40' }]}>
              <LinearGradient
                colors={[g.color + '33', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.6 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.iconBubble, { backgroundColor: g.color, shadowColor: g.color }]}>
                <Body style={styles.icon}>{g.icon}</Body>
              </View>
              <View style={styles.gameInfo}>
                <Body style={styles.gameName}>{g.name}</Body>
                <Body style={styles.gameTag}>{g.tagline}</Body>
                <View style={styles.gameMeta}>
                  <Pill label={`${g.minPlayers}-${g.maxPlayers} joueurs`} color={g.color} />
                  {g.teamBased && <Pill label={`Équipes de ${g.teamSize}`} color={theme.colors.textMuted} />}
                </View>
              </View>
              <Body style={[styles.chevron, { color: g.color }]}>›</Body>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Sheet visible={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <View style={[styles.sheetIcon, { backgroundColor: selected.color, shadowColor: selected.color }]}>
              <Body style={{ fontSize: 40 }}>{selected.icon}</Body>
            </View>
            <Title style={styles.sheetTitle}>{selected.name}</Title>
            <Body style={styles.sheetDesc}>{selected.description}</Body>
            <Button label="Créer un salon" loading={busy} onPress={onCreate} color={selected.color} />
            <Button label="Annuler" variant="ghost" onPress={() => setSelected(null)} />
          </>
        )}
      </Sheet>

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

function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing(2.5) },
  kicker: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 3, marginBottom: 2 },
  brand: { fontSize: 30 },
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing(6) },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
    padding: theme.spacing(1.75),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  iconBubble: {
    width: 62,
    height: 62,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  icon: { fontSize: 30 },
  gameInfo: { flex: 1, gap: 3 },
  gameName: { fontSize: theme.font.h3, fontWeight: '800', color: theme.colors.text },
  gameTag: { fontSize: theme.font.small, color: theme.colors.textMuted },
  gameMeta: { flexDirection: 'row', gap: theme.spacing(1), marginTop: 4, flexWrap: 'wrap' },
  chevron: { fontSize: 30, fontWeight: '300' },
  backdrop: { flex: 1, backgroundColor: '#000000BB' },
  sheet: {
    backgroundColor: '#1A1338',
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing(3),
    paddingTop: theme.spacing(1.5),
    gap: theme.spacing(1.25),
    borderTopWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  sheetHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: theme.colors.borderStrong, marginBottom: theme.spacing(1.5) },
  sheetIcon: { alignSelf: 'center', width: 74, height: 74, borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  sheetTitle: { fontSize: theme.font.h2, textAlign: 'center' },
  sheetDesc: { color: theme.colors.textMuted, textAlign: 'center', marginBottom: theme.spacing(1), lineHeight: 22 },
  codeInput: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 10,
    textAlign: 'center',
    height: 68,
    marginBottom: theme.spacing(0.5),
  },
});
