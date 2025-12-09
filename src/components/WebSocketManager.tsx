import { useToast } from '@/hooks/use-toast'
import webSocketService from '@/services/WebSocketSingleton'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { IncomingMessage } from '@/types/game'
import React, { useCallback, useEffect } from 'react'

export const WebSocketManager: React.FC = () => {
  const { actions: gameActions } = useGameStore()
  const { actions: uiActions } = useUIStore()
  const { toast } = useToast()

  const handleMessage = useCallback((message: IncomingMessage) => {
    switch (message.type) {
      case 'PLAYER_JOIN': {
        const { playerId, color } = message.payload
        gameActions.addPlayer({ id: playerId, color, antId: null })

        // Strategy: If we don't have a current player set, assume the first JOIN message is us.
        // This relies on the server sending the broadcast to the new client immediately.
        // There is no explicit WELCOME message in the provided API spec.
        if (!useGameStore.getState().currentPlayer) {
          gameActions.setCurrentPlayer({ id: playerId, color, antId: null })
        }
        break
      }

      case 'PLAYER_LEAVE': {
        const { playerId, cells } = message.payload
        gameActions.removePlayer(playerId, cells)
        break
      }

      case 'PLACE_ANT': {
        // Payload: { cells, ants }
        gameActions.updateGameState(message.payload)
        uiActions.setIsPlacingAnt(false)
        break
      }

      case 'GAME_STATE_SNAPSHOT':
        gameActions.updateGameState(message.payload)
        break

      case 'RULE_CHANGE': {
        const { playerId, rules } = message.payload
        gameActions.handleRuleChangeResponse(playerId, rules)
        break
      }

      case 'TILE_FLIP': {
        const { cells } = message.payload
        gameActions.insertNewCells(cells)
        break
      }

      case 'ERROR':
        toast({
          title: "An error occurred",
          description: message.payload.message,
          variant: "destructive"
        })
        break

      default:
        console.warn('Unhandled message type:', message.type)
        break
    }
  }, [gameActions, uiActions, toast])

  const handleConnectionChange = useCallback((state: string, error?: string) => {
    if (state === 'connected') {
      uiActions.setConnectionState(true)
      toast({
        title: "Connected",
        description: "Successfully connected to the game server. Place your ant and start the game!",
        variant: "default",
        duration: 4000
      })
    } else if (state === 'disconnected' || state === 'error') {
      uiActions.setConnectionState(false, error)
    }
  }, [uiActions, toast])

  useEffect(() => {
    webSocketService.setCallbacks({
      onMessage: handleMessage,
      onConnectionChange: handleConnectionChange
    })

    webSocketService.connect()
    return () => {
      webSocketService.disconnect()
    }
  }, [handleMessage, handleConnectionChange])

  return null
}
