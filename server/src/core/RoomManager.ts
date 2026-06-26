import { generateRoomCode } from '../utils/code';
import { Room } from './Room';
import { registry } from './registry';
import { RoomTransport } from './transport';

export type TransportFactory = (code: string) => RoomTransport;

/** Owns all active rooms and the player -> room mapping. In-memory by design;
 *  swap this layer for Redis/DB later without touching games or the engine. */
export class RoomManager {
  private rooms = new Map<string, Room>();
  private playerRoom = new Map<string, string>();

  constructor(private transportFactory: TransportFactory) {}

  createRoom(gameId: string, hostId: string, hostName: string): Room {
    const module = registry.get(gameId);
    if (!module) throw new Error('Jeu inconnu');

    const code = generateRoomCode((c) => this.rooms.has(c));
    const room = new Room(code, module, this.transportFactory(code));
    room.onEmpty = () => this.rooms.delete(code);
    this.rooms.set(code, room);

    room.addPlayer(hostId, hostName);
    this.playerRoom.set(hostId, code);
    return room;
  }

  joinRoom(code: string, playerId: string, playerName: string): Room {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) throw new Error('Salon introuvable');
    if (room.status !== 'lobby') throw new Error('La partie a déjà commencé');
    if (room.isFull()) throw new Error('Salon complet');

    room.addPlayer(playerId, playerName);
    this.playerRoom.set(playerId, room.code);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  getRoomOfPlayer(playerId: string): Room | undefined {
    const code = this.playerRoom.get(playerId);
    return code ? this.rooms.get(code) : undefined;
  }

  leave(playerId: string): void {
    const room = this.getRoomOfPlayer(playerId);
    this.playerRoom.delete(playerId);
    room?.removePlayer(playerId);
  }

  /** Mark a player disconnected without removing them immediately (grace period
   *  handled by the socket layer). */
  setConnected(playerId: string, connected: boolean): void {
    this.getRoomOfPlayer(playerId)?.setConnected(playerId, connected);
  }

  stats() {
    return { rooms: this.rooms.size, players: this.playerRoom.size };
  }
}
