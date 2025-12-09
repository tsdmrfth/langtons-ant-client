import { toast } from '@/hooks/use-toast'
import webSocketService from '@/services/WebSocketSingleton'
import { Ant, GameStateSnapshotPayload, Grid, OutgoingMessage, PlaceAntOutgoingPayload, Player, Rule, RuleChangeOutgoingPayload, ServerGridDiff, TileFlipOutgoingPayload } from '@/types/game'
import { validatePosition, validateRules } from '@/utils/errorHandling'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

const COLOR_WHITE = '#FFFFFF'

const flattenCells = (diff: ServerGridDiff): Record<string, string> => {
    const flat: Record<string, string> = {}
    Object.values(diff).forEach(chunk => {
        Object.entries(chunk).forEach(([key, color]) => {
            flat[key] = color
        })
    })
    return flat
}

interface GameStore {
    newCells: Record<string, string>
    historicalCells?: Record<string, string> | null
    grid: {
        width: number
        height: number
        cells: Record<string, string>
    }
    ants: Ant[]
    players: Record<string, Player>
    currentPlayer: Player | null
    selectedRules: Rule[]
    tickInterval: number
    actions: {
        setInitialState: (state: { grid: Grid, ants: Ant[], players: Record<string, Player> }) => void
        setCurrentPlayer: (player: Player) => void
        setSelectedRules: (rules: Rule[]) => void
        updateGameState: (snapshot: GameStateSnapshotPayload) => void
        addPlayer: (player: Player) => void
        removePlayer: (playerId: string, cells: ServerGridDiff) => void
        sendMessage: (message: OutgoingMessage) => void
        placeAnt: (position: { x: number, y: number }) => void
        updateAntsList: (playerId: string, ant: Ant, cells: ServerGridDiff) => void
        changeAntRules: (rules: Rule[]) => void
        flipTile: (position: { x: number, y: number }) => void
        mergeGridCells: (cells: Record<string, string>) => void
        handleRuleChangeResponse: (playerId: string, rules: Rule[]) => void,
        insertNewCells: (cells: ServerGridDiff) => void
    }
}

export const useGameStore = create<GameStore>()(
    subscribeWithSelector((set, get) => ({
        newCells: {},
        grid: {
            width: 100,
            height: 100,
            cells: {}
        },
        ants: [],
        players: {},
        currentPlayer: null,
        selectedRules: [],
        tickInterval: 250,
        actions: {
            setInitialState: (state: { grid: Grid, ants: Ant[], players: Record<string, Player> }) => {
                set({
                    grid: {
                        width: state.grid.width,
                        height: state.grid.height,
                        cells: state.grid.cells || {}
                    },
                    ants: state.ants || [],
                    players: state.players || {}
                })
            },
            setCurrentPlayer: (player: Player) => {
                set({ currentPlayer: player })
                set({
                    selectedRules: [
                        {
                            currentColor: COLOR_WHITE,
                            newColor: player.color,
                            turnDirection: 'LEFT',
                        },
                        {
                            currentColor: player.color,
                            newColor: COLOR_WHITE,
                            turnDirection: 'RIGHT',
                        },
                    ]
                })
            },
            setSelectedRules: (rules: Rule[]) => {
                set({ selectedRules: rules })
            },
            updateGameState: (snapshot: GameStateSnapshotPayload) => {
                const flatCells = flattenCells(snapshot.cells)
                set((state) => ({
                    grid: {
                        ...state.grid,
                        cells: {
                            ...state.grid.cells,
                            ...flatCells
                        }
                    },
                    ants: snapshot.ants || state.ants,
                    newCells: flatCells || {}
                }))
            },
            addPlayer: (player: Player) => {
                if (get().players[player.id]) {
                    return
                }

                set((state) => ({
                    players: { ...state.players, [player.id]: player }
                }))
            },
            removePlayer: (playerId: string, cells: ServerGridDiff) => {
                set((state) => {
                    const { [playerId]: removed, ...remaining } = state.players

                    if (!removed?.antId) {
                        return state
                    }

                    // Currently not clearing cells on player leave as per previous logic adjustment,
                    // but if we wanted to, we'd use flattenCells(cells).
                    const flatCells = flattenCells(cells)
                    // (Optional logic to clear cells would go here)

                    const ants = state.ants.filter((ant) => ant.id !== removed?.antId)
                    return {
                        players: remaining,
                        newCells: flatCells,
                        ants,
                        grid: state.grid,
                        historicalCells: state.historicalCells
                    }
                })
            },
            sendMessage: (message: OutgoingMessage) => {
                try {
                    webSocketService.sendMessage(message)
                } catch (error) {
                    throw new Error('Failed to send message to server')
                }
            },
            placeAnt: (position: { x: number, y: number }) => {
                const rules = get().selectedRules
                const { grid } = get()

                if (!rules) {
                    toast({
                        title: 'No rules selected',
                        description: 'Please select rules before placing an ant',
                        variant: 'destructive'
                    })
                    return
                }

                try {
                    validatePosition(position, grid.width, grid.height)
                    validateRules(rules)
                } catch (error) {
                    toast({
                        title: 'Invalid ant placement',
                        description: error instanceof Error ? error.message : 'Invalid position or rules',
                        variant: 'destructive'
                    })
                    return
                }

                const payload: PlaceAntOutgoingPayload = { position, rules }
                get().actions.sendMessage({ type: 'PLACE_ANT', payload })
            },
            updateAntsList: (playerId: string, ant: Ant, cells: ServerGridDiff) => {
                const flatCells = flattenCells(cells)
                set((state) => ({
                    players: {
                        ...state.players,
                        [playerId]: {
                            ...(state.players[playerId] || {}),
                            antId: ant.id
                        }
                    },
                    ants: [...state.ants, ant],
                    grid: {
                        ...state.grid,
                        cells: { ...state.grid.cells, ...flatCells }
                    },
                    currentPlayer: state.currentPlayer?.id === playerId ? {
                        ...state.currentPlayer,
                        antId: ant.id
                    } : state.currentPlayer,
                }))
            },
            changeAntRules: (rules: Rule[]) => {
                try {
                    validateRules(rules)
                } catch (error) {
                    toast({
                        title: 'Invalid rules',
                        description: error instanceof Error ? error.message : 'Please check your rule configuration',
                        variant: 'destructive'
                    })
                    return
                }

                const payload: RuleChangeOutgoingPayload = { rules }
                get().actions.sendMessage({ type: 'RULE_CHANGE', payload })
            },
            flipTile: (position: { x: number, y: number }) => {
                const { grid } = get()

                try {
                    validatePosition(position, grid.width, grid.height)
                } catch (error) {
                    toast({
                        title: 'Invalid tile position',
                        description: error instanceof Error ? error.message : 'Position is out of bounds',
                        variant: 'destructive'
                    })
                    return
                }

                const payload: TileFlipOutgoingPayload = { position }
                get().actions.sendMessage({ type: 'TILE_FLIP', payload })
            },
            mergeGridCells: (cells: Record<string, string>) => {
                set((state) => ({
                    historicalCells: { ...state.historicalCells, ...cells },
                    grid: {
                        ...state.grid,
                        cells: { ...state.grid.cells, ...state.newCells }
                    }
                }))
            },
            handleRuleChangeResponse: (playerId: string, rules: Rule[]) => {
                // Find ant via player's antId
                const player = get().players[playerId]
                if (!player || !player.antId) {
                    console.warn('Received rule change for unknown player/ant:', playerId)
                    return
                }
                const antId = player.antId

                set((state) => ({
                    ants: state.ants.map((ant) => {
                        if (ant.id === antId) {
                            return { ...ant, rules }
                        }
                        return ant
                    })
                }))

                if (get().currentPlayer?.id === playerId) {
                    toast({
                        title: 'Rules Updated',
                        description: 'Your ant\'s rules have been successfully updated.',
                        variant: 'default'
                    })
                } else {
                    toast({
                        title: 'Rules Updated',
                        description: 'Another player has updated their rules. You can see the new rules in the ants list.',
                        variant: 'default'
                    })
                }
            },
            insertNewCells: (cells: ServerGridDiff) => {
                const flatCells = flattenCells(cells)
                set((state) => ({
                    newCells: flatCells,
                    grid: {
                        ...state.grid,
                        cells: {
                            ...state.grid.cells,
                            ...flatCells
                        }
                    }
                }))
            }
        }
    }))
)
