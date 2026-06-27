import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket } from '../net/socket';
import { readJoinCode, clearJoinParam } from '../net/invite';
import { Ack, GameDefinition, GameEvent, GameResults, RoomState } from '../shared/types';

const NAME_KEY = 'multigames.playerName';

interface Store {
  connected: boolean;
  playerName: string;
  savedName: string;
  myId: string | null;
  catalog: GameDefinition[];
  room: RoomState | null;
  gameState: any | null;
  results: GameResults | null;
  lastEvent: GameEvent | null;
  error: string | null;
  pendingJoin: string | null;

  setPlayerName: (name: string) => void;
  refreshCatalog: () => void;
  createRoom: (gameId: string) => Promise<string | null>;
  joinRoom: (code: string) => Promise<string | null>;
  leaveRoom: () => void;
  setTeam: (teamId: string) => void;
  startGame: () => void;
  rematch: () => void;
  sendAction: (type: string, payload?: unknown) => void;
  clearError: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const socket = useMemo(() => getSocket(), []);
  const [connected, setConnected] = useState(socket.connected);
  const [playerName, setPlayerNameState] = useState('');
  const [savedName, setSavedName] = useState('');
  const [myId, setMyId] = useState<string | null>(socket.id ?? null);
  const [catalog, setCatalog] = useState<GameDefinition[]>([]);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [gameState, setGameState] = useState<any | null>(null);
  const [results, setResults] = useState<GameResults | null>(null);
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingJoin, setPendingJoin] = useState<string | null>(() => readJoinCode());
  const eventTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      setMyId(socket.id ?? null);
      socket.emit('catalog:list', (res: Ack<{ games: GameDefinition[] }>) => {
        if (res.ok) setCatalog(res.data.games);
      });
    };
    const onDisconnect = () => setConnected(false);
    const onRoom = (state: RoomState) => {
      setRoom(state);
      if (state.status !== 'finished') setResults(null);
      if (state.status === 'lobby') setGameState(null);
    };
    const onGameState = (p: { state: unknown }) => setGameState(p.state);
    const onGameEnded = (r: GameResults) => setResults(r);
    const onClosed = () => {
      setRoom(null);
      setGameState(null);
      setResults(null);
    };
    const onEvent = (e: GameEvent) => {
      setLastEvent({ ...e, payload: { ...(e.payload as object), _t: Date.now() } });
      if (eventTimer.current) clearTimeout(eventTimer.current);
      eventTimer.current = setTimeout(() => setLastEvent(null), 1600);
    };
    const onErr = (m: string) => setError(m);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:update', onRoom);
    socket.on('game:state', onGameState);
    socket.on('game:ended', onGameEnded);
    socket.on('room:closed', onClosed);
    socket.on('game:event', onEvent);
    socket.on('error:msg', onErr);
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:update', onRoom);
      socket.off('game:state', onGameState);
      socket.off('game:ended', onGameEnded);
      socket.off('room:closed', onClosed);
      socket.off('game:event', onEvent);
      socket.off('error:msg', onErr);
    };
  }, [socket]);

  // Load a previously saved pseudo (browser session / device) once at startup.
  useEffect(() => {
    AsyncStorage.getItem(NAME_KEY).then((n) => {
      if (n) setSavedName(n);
    });
  }, []);

  const setPlayerName = (name: string) => {
    const clean = name.trim();
    setPlayerNameState(clean);
    if (clean) {
      setSavedName(clean);
      AsyncStorage.setItem(NAME_KEY, clean).catch(() => {});
    }
  };

  const createRoom = (gameId: string) =>
    new Promise<string | null>((resolve) => {
      socket.emit('lobby:create', { playerName, gameId }, (res: Ack<{ code: string }>) => {
        if (res.ok) resolve(res.data.code);
        else {
          setError(res.error);
          resolve(null);
        }
      });
    });

  const joinRoom = (code: string) =>
    new Promise<string | null>((resolve) => {
      socket.emit(
        'lobby:join',
        { playerName, code: code.toUpperCase().trim() },
        (res: Ack<{ code: string }>) => {
          if (res.ok) resolve(res.data.code);
          else {
            setError(res.error);
            resolve(null);
          }
        }
      );
    });

  // Auto-join a shared salon: once the player has a pseudo and we're connected,
  // join the code carried by the invite link (?join=CODE), then forget it.
  useEffect(() => {
    if (!pendingJoin || !playerName || !connected || room) return;
    joinRoom(pendingJoin).finally(() => {
      setPendingJoin(null);
      clearJoinParam();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingJoin, playerName, connected, room]);

  const value: Store = {
    connected,
    playerName,
    savedName,
    myId,
    catalog,
    room,
    gameState,
    results,
    lastEvent,
    error,
    pendingJoin,
    setPlayerName,
    refreshCatalog: () =>
      socket.emit('catalog:list', (res: Ack<{ games: GameDefinition[] }>) => {
        if (res.ok) setCatalog(res.data.games);
      }),
    createRoom,
    joinRoom,
    leaveRoom: () => {
      socket.emit('lobby:leave');
      setRoom(null);
      setGameState(null);
      setResults(null);
    },
    setTeam: (teamId: string) => socket.emit('lobby:setTeam', { teamId }),
    startGame: () => socket.emit('lobby:start'),
    rematch: () => socket.emit('lobby:rematch'),
    sendAction: (type: string, payload?: unknown) => socket.emit('game:action', { type, payload }),
    clearError: () => setError(null),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
