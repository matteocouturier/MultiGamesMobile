import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { ClientToServerEvents, ServerToClientEvents } from '../shared/events';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Resolve the server URL. On a real device, localhost points to the phone, so
 * we derive the dev machine's IP from the Expo host when available. Override
 * via app.json -> extra.serverUrl or the EXPO_PUBLIC_SERVER_URL env var.
 */
export function resolveServerUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_SERVER_URL;
  if (fromEnv) return fromEnv;

  // When the web build is served by the game server itself, talk to the same
  // origin — works on any domain (644.fr, an IP, localhost) with no config.
  if (typeof window !== 'undefined' && window.location?.origin?.startsWith('http')) {
    return window.location.origin;
  }

  const configured = (Constants.expoConfig?.extra as any)?.serverUrl as string | undefined;

  // Try to reuse the Metro/Expo host IP so physical devices can reach the LAN.
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).expoGoConfig?.debuggerHost;
  if (hostUri && configured?.includes('localhost')) {
    const host = String(hostUri).split(':')[0];
    return `http://${host}:4000`;
  }
  return configured ?? 'http://localhost:4000';
}

let socket: AppSocket | null = null;

export function getSocket(): AppSocket {
  if (!socket) {
    socket = io(resolveServerUrl(), {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
    });
  }
  return socket;
}
