import { GamePlayer } from '../../core/game';

/** Mirrors the team presets defined in core/Room.ts so games can display names. */
export const TEAM_META = [
  { name: 'Rouge', color: '#FF5A5F' },
  { name: 'Bleu', color: '#4C8DFF' },
  { name: 'Vert', color: '#34C759' },
  { name: 'Jaune', color: '#FFC53D' },
];

export interface TeamGroup {
  id: string;
  name: string;
  color: string;
  members: GamePlayer[];
}

/** Group players by team in stable join order, attaching display name/color. */
export function getTeams(players: GamePlayer[]): TeamGroup[] {
  const order: string[] = [];
  for (const p of players) if (p.teamId && !order.includes(p.teamId)) order.push(p.teamId);
  return order.map((id, i) => ({
    id,
    name: TEAM_META[i]?.name ?? `Équipe ${i + 1}`,
    color: TEAM_META[i]?.color ?? '#888',
    members: players.filter((p) => p.teamId === id),
  }));
}
