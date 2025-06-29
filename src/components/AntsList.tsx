import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { Info, Settings, ChevronDown, ChevronRight } from 'lucide-react'
import React, { useState } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'

export const AntsList: React.FC = () => {
  const { currentPlayer, ants } = useGameStore()
  const { focusedAntId, actions: uiActions } = useUIStore()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(true)
  const sortedAnts = [...ants].sort((a, b) => {
    const aIsCurrentUser = a.id === currentPlayer?.antId
    const bIsCurrentUser = b.id === currentPlayer?.antId

    if (aIsCurrentUser && !bIsCurrentUser) return -1
    if (!aIsCurrentUser && bIsCurrentUser) return 1
    return 0
  })

  const handleAntClick = (antId: string) => {
    if (focusedAntId === antId) {
      uiActions.setFocusedAntId(null)
    } else {
      if (isMobile) {
        uiActions.setSidebarOpen(false)
      }

      uiActions.setFocusedAntId(antId)
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="bg-gray-800 rounded-lg border border-gray-700 mb-4">
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between px-4 py-2 bg-gray-700 text-gray-100 font-semibold focus:outline-none rounded-t-lg text-lg hover:bg-gray-600 transition-colors">
          <span>Ants ({ants.length})</span>
          {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4">
        <div className="space-y-2">
          {
            ants.length > 0 && (
              <div className="mb-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-500 rounded">
                <div className="flex items-center gap-2">
                  <Info className="h-8 w-8 text-blue-400" />
                  <span className="text-sm text-blue-300">
                    Click on any ant in the list below to zoom to its position on the grid
                  </span>
                </div>
              </div>
            )
          }

          {
            sortedAnts.map((ant, index) => {
              const isCurrentUser = ant.id === currentPlayer?.antId
              const isFocused = ant.id === focusedAntId
              const playerNumber = index + 1

              return (
                ant && ant.id && (
                  <div
                    key={ant.id}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${isCurrentUser ? 'border' : 'bg-gray-750'} ${isFocused ? 'ring-2 ring-blue-400' : ''}`}
                    style={isCurrentUser ? {
                      backgroundColor: `${currentPlayer.color}20`,
                      borderColor: currentPlayer.color
                    } : {}}
                    onClick={() => handleAntClick(ant.id)}>

                    <div
                      className="flex-1 flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded border border-gray-500"
                        style={{ backgroundColor: ant.color }} />
                      <span
                        className={`text-sm flex-1 ${isCurrentUser ? 'text-blue-400 font-medium' : 'text-gray-300'}`}
                        style={{ color: ant.color }}>
                        {isCurrentUser ? 'Your ant' : `Player ${playerNumber}'s ant`}
                      </span>
                    </div>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(event) => event.stopPropagation()}>
                          <Settings className="h-4 w-4 text-gray-400" />
                          <span className="sr-only">Ant Settings</span>
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent
                        className="w-auto"
                        side="right"
                        align="start"
                        onClick={(event) => event.stopPropagation()}>
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none">Ant Rules</h4>
                            <p className="text-sm text-muted-foreground">
                              Color-based turning rules.
                            </p>
                          </div>
                          <div className="grid gap-2">
                            {
                              ant.rules.map((rule, index) => (
                                <div key={index} className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Cell Color:</span>
                                    <div
                                      className="w-4 h-4 rounded-full border border-gray-400"
                                      style={{ backgroundColor: rule.cellColor }}
                                    />
                                    <span className="font-mono text-sm">{rule.cellColor}</span>
                                  </div>
                                  <span className="text-sm font-medium">
                                    {rule.turnDirection === 'LEFT' ? 'Turn Left' : 'Turn Right'}
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )
              )
            })
          }

          {
            ants.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">No ants placed yet</p>
              </div>
            )
          }
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
} 