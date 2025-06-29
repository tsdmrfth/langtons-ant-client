import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface UIStore {
    isConnected: boolean
    connectionError: string | null
    sidebarOpen: boolean
    isPlacingAnt: boolean
    isFlippingTile: boolean
    gameControlUpdateLoading: boolean
    focusedAntId: string | null
    actions: {
        setConnectionState: (connected: boolean, error?: string) => void
        setSidebarOpen: (open: boolean) => void
        setIsPlacingAnt: (isPlacing: boolean) => void
        setIsFlippingTile: (isFlipping: boolean) => void
        setGameControlUpdateLoading: (loading: boolean) => void
        setFocusedAntId: (antId: string | null) => void
    }
}

export const useUIStore = create<UIStore>()(
    subscribeWithSelector((set) => ({
        isConnected: false,
        connectionError: null,
        sidebarOpen: true,
        isPlacingAnt: false,
        isFlippingTile: false,
        gameControlUpdateLoading: false,
        focusedAntId: null,
        actions: {
            setConnectionState: (connected: boolean, error?: string) => {
                set({ isConnected: connected, connectionError: error || null })
            },
            setSidebarOpen: (open: boolean) => {
                set({ sidebarOpen: open })
            },
            setIsPlacingAnt: (isPlacing: boolean) => {
                set({ isPlacingAnt: isPlacing, isFlippingTile: false })
            },
            setIsFlippingTile: (isFlipping: boolean) => {
                set({ isFlippingTile: isFlipping, isPlacingAnt: false })
            },
            setGameControlUpdateLoading: (loading: boolean) => {
                set({ gameControlUpdateLoading: loading })
            },
            setFocusedAntId: (antId: string | null) => {
                set({ focusedAntId: antId })
            }
        }
    }))
) 