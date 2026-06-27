import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Body, Button, Card, Pill, Screen, Subtitle, Title } from '../components/ui';
import { theme } from '../theme';
import { useStore } from '../state/store';
import { shareInvite } from '../net/invite';
import { PublicPlayer, TeamInfo } from '../shared/types';

export function LobbyScreen() {
  const { room, myId, leaveRoom, setTeam, startGame } = useStore();
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (shareTimer.current) clearTimeout(shareTimer.current); }, []);
  if (!room) return null;

  const isHost = room.hostId === myId;
  const me = room.players.find((p) => p.id === myId);
  const slotsLeft = room.game.maxPlayers - room.players.length;

  const onShare = async () => {
    const res = await shareInvite(room.code);
    if (res === 'copied') setShareMsg('🔗 Lien copié !');
    else if (res === 'shared') setShareMsg(null);
    else if (res === 'none') setShareMsg('Partage indisponible');
    if (shareTimer.current) clearTimeout(shareTimer.current);
    shareTimer.current = setTimeout(() => setShareMsg(null), 2200);
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        <Button label="← Quitter" variant="ghost" small onPress={leaveRoom} />
        <Pill label={room.game.name} color={room.game.color} filled />
      </View>

      <Card style={styles.codeCard}>
        <Body style={styles.codeLabel}>Code du salon</Body>
        <Title style={styles.code}>{room.code}</Title>
        <Body style={styles.codeHint}>Partage ce code pour inviter tes amis</Body>
        <Button label="📤 Partager le salon" variant="ghost" small onPress={onShare} style={styles.shareBtn} />
        {shareMsg && <Body style={styles.shareMsg}>{shareMsg}</Body>}
      </Card>

      <View style={styles.countRow}>
        <Subtitle>
          {room.players.length}/{room.game.maxPlayers} joueurs
        </Subtitle>
        <Subtitle>
          {room.players.length < room.game.minPlayers
            ? `Encore ${room.game.minPlayers - room.players.length} pour démarrer`
            : 'Prêt à lancer ✓'}
        </Subtitle>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        {room.game.teamBased ? (
          <TeamsView room={room} myId={myId} me={me} onPick={setTeam} />
        ) : (
          <PlayersList players={room.players} hostId={room.hostId} myId={myId} />
        )}

        {/* Empty seats — only for non-team games, capped to keep it tidy. */}
        {!room.game.teamBased && slotsLeft > 0 && (
          <View style={styles.slots}>
            {Array.from({ length: Math.min(slotsLeft, 3) }).map((_, i) => (
              <Card key={`slot-${i}`} style={styles.slot}>
                <Body style={styles.slotText}>· En attente d'un joueur ·</Body>
              </Card>
            ))}
            {slotsLeft > 3 && (
              <Body style={styles.moreSlots}>
                + {slotsLeft - 3} place{slotsLeft - 3 > 1 ? 's' : ''} libre{slotsLeft - 3 > 1 ? 's' : ''}
              </Body>
            )}
          </View>
        )}
      </ScrollView>

      {/* Fade so scrolled content disappears cleanly behind the action bar. */}
      <LinearGradient
        colors={['transparent', theme.colors.bg]}
        style={styles.footerFade}
        pointerEvents="none"
      />
      <View style={styles.footer}>
        {isHost ? (
          <Button
            label={room.canStart ? '🚀 Lancer la partie' : 'En attente de joueurs...'}
            onPress={startGame}
            disabled={!room.canStart}
          />
        ) : (
          <Body style={styles.waitHost}>En attente que l'hôte lance la partie...</Body>
        )}
      </View>
    </Screen>
  );
}

function TeamsView({
  room,
  myId,
  me,
  onPick,
}: {
  room: { teams: TeamInfo[]; players: PublicPlayer[]; hostId: string };
  myId: string | null;
  me?: PublicPlayer;
  onPick: (teamId: string) => void;
}) {
  return (
    <View style={{ gap: theme.spacing(1.5) }}>
      {room.teams.map((team) => {
        const members = room.players.filter((p) => p.teamId === team.id);
        const mine = me?.teamId === team.id;
        return (
          <Card key={team.id} style={[styles.teamCard, { borderColor: team.color }]}>
            <View style={styles.teamHeader}>
              <View style={styles.teamTitleRow}>
                <View style={[styles.dot, { backgroundColor: team.color }]} />
                <Body style={styles.teamName}>Équipe {team.name}</Body>
              </View>
              {!mine && (
                <Button label="Rejoindre" variant="ghost" small onPress={() => onPick(team.id)} />
              )}
            </View>
            {members.length === 0 && <Body style={styles.slotText}>Vide</Body>}
            {members.map((p) => (
              <PlayerRow key={p.id} player={p} hostId={room.hostId} myId={myId} color={team.color} />
            ))}
          </Card>
        );
      })}
    </View>
  );
}

function PlayersList({
  players,
  hostId,
  myId,
}: {
  players: PublicPlayer[];
  hostId: string;
  myId: string | null;
}) {
  return (
    <Card style={{ gap: theme.spacing(1) }}>
      {players.map((p) => (
        <PlayerRow key={p.id} player={p} hostId={hostId} myId={myId} />
      ))}
    </Card>
  );
}

function PlayerRow({
  player,
  hostId,
  myId,
  color = theme.colors.primary,
}: {
  player: PublicPlayer;
  hostId: string;
  myId: string | null;
  color?: string;
}) {
  return (
    <View style={styles.playerRow}>
      <View style={[styles.avatar, { backgroundColor: color + '33', borderColor: color }]}>
        <Body style={{ fontWeight: '800', color }}>{player.name.charAt(0).toUpperCase()}</Body>
      </View>
      <Body style={[styles.playerName, !player.connected && { opacity: 0.4 }]}>
        {player.name}
        {player.id === myId ? ' (toi)' : ''}
      </Body>
      {player.id === hostId && <Pill label="Hôte" color={theme.colors.warning} />}
      {!player.connected && <Pill label="déconnecté" color={theme.colors.danger} />}
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing(2) },
  codeCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing(3.5),
    marginBottom: theme.spacing(2),
    borderColor: theme.colors.borderStrong,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
  },
  codeLabel: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 3 },
  code: {
    fontSize: 54,
    letterSpacing: 12,
    fontWeight: '900',
    marginVertical: theme.spacing(1),
    color: theme.colors.white,
    textShadowColor: 'rgba(139,92,246,0.6)',
    textShadowRadius: 18,
  },
  codeHint: { color: theme.colors.textMuted, fontSize: theme.font.small },
  shareBtn: { marginTop: theme.spacing(1.5), borderColor: theme.colors.primary },
  shareMsg: { color: theme.colors.success, fontSize: theme.font.small, marginTop: theme.spacing(1), fontWeight: '700' },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing(1.5) },
  teamCard: { borderWidth: 1.5, gap: theme.spacing(1) },
  teamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1) },
  dot: { width: 14, height: 14, borderRadius: 7 },
  teamName: { fontSize: theme.font.h3, fontWeight: '700' },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5) },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: { flex: 1, fontSize: theme.font.body, color: theme.colors.text },
  slots: { gap: theme.spacing(1), marginTop: theme.spacing(1.5) },
  slot: {
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingVertical: theme.spacing(1.25),
  },
  slotText: { color: theme.colors.textMuted, fontStyle: 'italic' },
  moreSlots: { textAlign: 'center', color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: theme.spacing(0.5) },
  footerFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
  },
  footer: {
    position: 'absolute',
    left: theme.spacing(2.5),
    right: theme.spacing(2.5),
    bottom: theme.spacing(4),
  },
  waitHost: { textAlign: 'center', color: theme.colors.textMuted },
});
