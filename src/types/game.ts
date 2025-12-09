export type Direction = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT'

export type Color = string

export interface Position {
  x: number
  y: number
}

export interface Ant {
  id: string
  position: Position
  direction: Direction
  color: Color
  rules: Rule[]
}

export interface Rule {
  currentColor: Color
  newColor: Color
  turnDirection: 'LEFT' | 'RIGHT'
}

export interface Grid {
  width: number
  height: number
  cells: Record<string, Color>
}

export interface GameState {
  grid: Grid
  ants: Ant[]
  players: Map<string, Player>
}

export interface Player {
  id: string
  color: Color
  antId: string | null
}

export interface GameConfig {
  gridWidth: number
  gridHeight: number
  tickInterval: number
  maxPlayers: number
  heartbeatInterval: number
}

export interface GameTickUpdate {
  cells: Record<string, Color>
  ants: Ant[]
}

export interface Ant {
  id: string
  position: Position
  direction: Direction
  color: Color
  rules: Rule[]
}

// ChunkKey -> CellKey -> Color
export type ClientGrid = Record<string, Color>
export type ServerGridDiff = Record<string, Record<string, Color>>

export interface PlayerJoinPayload {
  playerId: string
  color: Color
}

export interface PlayerLeavePayload {
  playerId: string
  cells: ServerGridDiff
  ants: Ant[]
}

// Incoming (Server -> Client)
export interface PlaceAntIncomingPayload {
  cells: ServerGridDiff
  ants: Ant[]
}

// Outgoing (Client -> Server)
export interface PlaceAntOutgoingPayload {
  position: Position
  rules: Rule[]
}

export interface RuleChangePayload {
  playerId: string
  rules: Rule[]
}

export interface RuleChangeOutgoingPayload {
  rules: Rule[]
}

// Incoming
export interface TileFlipIncomingPayload {
  cells: ServerGridDiff
}

// Outgoing
export interface TileFlipOutgoingPayload {
  position: Position
}

export interface GameStateSnapshotPayload {
  cells: ServerGridDiff
  ants: Ant[]
}

export interface ErrorPayload {
  message: string
}

// Client -> Server
export type OutgoingMessage =
  | { type: 'PLACE_ANT'; payload: PlaceAntOutgoingPayload }
  | { type: 'RULE_CHANGE'; payload: RuleChangeOutgoingPayload }
  | { type: 'TILE_FLIP'; payload: TileFlipOutgoingPayload }

// Server -> Client
export type IncomingMessage =
  | { type: 'PLAYER_JOIN'; payload: PlayerJoinPayload }
  | { type: 'PLAYER_LEAVE'; payload: PlayerLeavePayload }
  | { type: 'PLACE_ANT'; payload: PlaceAntIncomingPayload }
  | { type: 'RULE_CHANGE'; payload: RuleChangePayload }
  | { type: 'TILE_FLIP'; payload: TileFlipIncomingPayload }
  | { type: 'GAME_STATE_SNAPSHOT'; payload: GameStateSnapshotPayload }
  | { type: 'ERROR'; payload: ErrorPayload }

export type WebSocketMessage = OutgoingMessage | IncomingMessage