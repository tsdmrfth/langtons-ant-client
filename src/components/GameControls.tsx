import { CollapsiblePanel } from '@/components/ui/collapsible-panel'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import React, { useEffect, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

export const GameControls: React.FC = () => {
    const gameActions = useGameStore(state => state.actions)
    const uiActions = useUIStore(state => state.actions)
    const gameControlUpdateLoading = useUIStore(state => state.gameControlUpdateLoading)
    const grid = useGameStore(state => state.grid)
    const ants = useGameStore(state => state.ants)
    const [gridSize, setGridSize] = useState(grid.width)
    const [tickInterval, setTickInterval] = useState(250)
    const hasAnts = ants.length > 0

    useEffect(() => {
        setGridSize(grid.width)
    }, [grid.width])

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        uiActions.setGameControlUpdateLoading(true)
        gameActions.sendMessage({
            type: 'UPDATE_GAME_CONFIG',
            payload: {
                gridSize,
                tickInterval
            }
        })
    }

    return (
        <TooltipProvider>
            <CollapsiblePanel
                title="Game Controls"
                defaultCollapsed={true}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col">
                        <label className="text-gray-300 text-sm mb-1">Grid Size</label>
                        <input
                            min={1}
                            type="number"
                            value={gridSize}
                            onChange={e => setGridSize(Number(e.target.value))}
                            className="rounded px-2 py-1 bg-gray-900 text-gray-100 border border-gray-700" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-gray-300 text-sm mb-1">Tick Interval (ms)</label>
                        <input
                            type="number"
                            min={10}
                            value={tickInterval}
                            onChange={e => setTickInterval(Number(e.target.value))}
                            className="rounded px-2 py-1 bg-gray-900 text-gray-100 border border-gray-700"
                        />
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="submit"
                                disabled={gameControlUpdateLoading || hasAnts}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-20">
                                Update Game Config
                            </button>
                        </TooltipTrigger>
                        {hasAnts && (
                            <TooltipContent>
                                <p>Cannot update game config while ants are active</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </form>
            </CollapsiblePanel>
        </TooltipProvider>
    )
} 