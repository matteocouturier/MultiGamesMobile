import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Body, Button, Card, glass, Pill, Screen, Subtitle, ThemeToggle, Title } from '../components/ui';
import { theme } from '../theme';
import { useStore } from '../state/store';
import { GameDefinition } from '../shared/types';
import { CATEGORIES, GAME_CATEGORY } from '../games/categories';

export function HomeScreen() {
  const { playerName, catalog, createRoom, joinRoom } = useStore();
  const [selected, setSelected] = useState<GameDefinition | null>(null);
  const [joinMode, setJoinMode] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const [players, setPlayers] = useState<number | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const hasFilters = players != null || category != null;

  const filtered = useMemo(
    () =>
      catalog.filter((g) => {
        if (players != null && !(g.minPlayers <= players && g.maxPlayers >= players)) return false;
        if (category != null && GAME_CATEGORY[g.id] !== category) return false;
        return true;
      }),
    [catalog, players, category]
  );

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

  const clearFilters = () => {
    setPlayers(null);
    setCategory(null);
  };

  const catLabel = CATEGORIES.find((c) => c.key === category)?.label;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Body style={styles.kicker}>BIENVENUE</Body>
          <Title style={styles.brand} numberOfLines={1}>Salut {playerName} 👋</Title>
          <Subtitle>{filtered.length} mini-jeux disponibles</Subtitle>
        </View>
        <View style={styles.headerActions}>
          <ThemeToggle />
          <Button label="Rejoindre" variant="ghost" small onPress={() => setJoinMode(true)} />
        </View>
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <Pressable onPress={() => setFilterOpen(true)} style={({ pressed }) => [styles.filterBtn, hasFilters && styles.filterBtnActive, { opacity: pressed ? 0.85 : 1 }]}>
          <Text style={[styles.filterIcon, hasFilters && { color: theme.colors.white }]}>🎚️</Text>
          <Text style={[styles.filterLabel, hasFilters && { color: theme.colors.white }]}>Filtres</Text>
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeChips}>
          {players != null && (
            <Pressable onPress={() => setPlayers(null)}>
              <Pill label={`${players} joueurs ✕`} color={theme.colors.primary} filled />
            </Pressable>
          )}
          {category != null && (
            <Pressable onPress={() => setCategory(null)}>
              <Pill label={`${catLabel} ✕`} color={theme.colors.primary} filled />
            </Pressable>
          )}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {catalog.length === 0 && <Body style={styles.empty}>Chargement des jeux...</Body>}
        {catalog.length > 0 && filtered.length === 0 && (
          <View style={styles.noMatch}>
            <Body style={styles.noMatchEmoji}>🔍</Body>
            <Body style={styles.noMatchText}>Aucun jeu ne correspond à ces filtres</Body>
            <Button label="Réinitialiser les filtres" variant="ghost" small onPress={clearFilters} />
          </View>
        )}
        {filtered.map((g) => (
          <Pressable key={g.id} onPress={() => setSelected(g)} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
            <View style={[styles.gameCard, glass, { borderColor: g.color + '3A' }]}>
              <LinearGradient colors={[g.color + '2E', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.7 }} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={[g.color, g.color + 'B0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.iconBubble, { shadowColor: g.color }]}>
                <Body style={styles.icon}>{g.icon}</Body>
              </LinearGradient>
              <View style={styles.gameInfo}>
                <Body style={styles.gameName}>{g.name}</Body>
                <Body style={styles.gameTag}>{g.tagline}</Body>
                <View style={styles.gameMeta}>
                  <Pill label={`${g.minPlayers === g.maxPlayers ? g.minPlayers : `${g.minPlayers}-${g.maxPlayers}`} joueurs`} color={g.color} />
                  {g.teamBased && <Pill label={`Équipes de ${g.teamSize}`} color={theme.colors.textMuted} />}
                </View>
              </View>
              <View style={[styles.chevronWrap, { borderColor: g.color + '55' }]}>
                <Body style={[styles.chevron, { color: g.color }]}>›</Body>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Filters sheet */}
      <Sheet visible={filterOpen} onClose={() => setFilterOpen(false)}>
        <Title style={styles.sheetTitle}>Trouve ton jeu 🎯</Title>

        <Body style={styles.section}>VOUS ÊTES COMBIEN ?</Body>
        <View style={styles.chipWrap}>
          <Chip label="Tous" active={players == null} onPress={() => setPlayers(null)} />
          {[2, 3, 4, 5, 6, 7, 8].map((n) => (
            <Chip key={n} label={`${n}`} active={players === n} onPress={() => setPlayers(n)} />
          ))}
        </View>

        <Body style={styles.section}>CATÉGORIE</Body>
        <View style={styles.chipWrap}>
          <Chip label="Toutes" active={category == null} onPress={() => setCategory(null)} />
          {CATEGORIES.map((c) => (
            <Chip key={c.key} label={`${c.icon} ${c.label}`} active={category === c.key} onPress={() => setCategory(c.key)} />
          ))}
        </View>

        <View style={styles.sheetActions}>
          {hasFilters && <Button label="Réinitialiser" variant="ghost" small onPress={clearFilters} />}
          <View style={{ flex: 1 }}>
            <Button label={`Voir ${filtered.length} jeu${filtered.length > 1 ? 'x' : ''}`} onPress={() => setFilterOpen(false)} />
          </View>
        </View>
      </Sheet>

      {/* Create sheet */}
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

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.chipText, active && { color: theme.colors.white }]}>{label}</Text>
    </Pressable>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing(1.5) },
  headerText: { flex: 1, marginRight: theme.spacing(1) },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1) },
  kicker: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 3, marginBottom: 2 },
  brand: { fontSize: 30 },
  filterBar: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1), marginBottom: theme.spacing(2) },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: theme.spacing(1.75), height: 40, borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderStrong,
  },
  filterBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterIcon: { fontSize: 15 },
  filterLabel: { color: theme.colors.text, fontWeight: '800', fontSize: theme.font.small },
  activeChips: { gap: theme.spacing(0.75), alignItems: 'center', paddingRight: theme.spacing(1) },
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing(6) },
  noMatch: { alignItems: 'center', gap: theme.spacing(1), marginTop: theme.spacing(6) },
  noMatchEmoji: { fontSize: 44 },
  noMatchText: { color: theme.colors.textMuted },
  gameCard: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2), marginBottom: theme.spacing(1.75),
    padding: theme.spacing(2), borderRadius: theme.radius.lg, borderWidth: 1,
    backgroundColor: theme.colors.surface, overflow: 'hidden', ...theme.shadow.card,
  },
  iconBubble: {
    width: 66, height: 66, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    shadowOpacity: 0.7, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  icon: { fontSize: 31 },
  gameInfo: { flex: 1, gap: 4 },
  gameName: { fontSize: theme.font.h3, fontFamily: theme.fonts.display, fontWeight: '700', color: theme.colors.text, letterSpacing: -0.3 },
  gameTag: { fontSize: theme.font.small, color: theme.colors.textMuted },
  gameMeta: { flexDirection: 'row', gap: theme.spacing(1), marginTop: 5, flexWrap: 'wrap' },
  chevronWrap: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  chevron: { fontSize: 22, fontWeight: '500', marginTop: -2 },
  backdrop: { flex: 1, backgroundColor: '#000000BB' },
  sheet: {
    backgroundColor: theme.colors.sheet, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing(3), paddingTop: theme.spacing(1.5), gap: theme.spacing(1.25),
    borderTopWidth: 1, borderColor: theme.colors.borderStrong,
  },
  sheetHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: theme.colors.borderStrong, marginBottom: theme.spacing(1.5) },
  sheetIcon: { alignSelf: 'center', width: 74, height: 74, borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  sheetTitle: { fontSize: theme.font.h2, textAlign: 'center' },
  sheetDesc: { color: theme.colors.textMuted, textAlign: 'center', marginBottom: theme.spacing(1), lineHeight: 22 },
  section: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 2, marginTop: theme.spacing(0.5) },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1) },
  chip: {
    paddingHorizontal: theme.spacing(1.75), height: 42, borderRadius: theme.radius.pill,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderStrong,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.text, fontWeight: '700', fontSize: theme.font.body },
  sheetActions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1), marginTop: theme.spacing(1) },
  codeInput: {
    backgroundColor: theme.colors.surface, borderColor: theme.colors.borderStrong, borderWidth: 1,
    borderRadius: theme.radius.md, color: theme.colors.text, fontSize: 30, fontWeight: '900',
    letterSpacing: 10, textAlign: 'center', height: 68, marginBottom: theme.spacing(0.5),
  },
});
