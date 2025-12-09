import { useIsMobile } from '@/hooks/use-mobile'
import { useToast } from '@/hooks/use-toast'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { Crosshair, Minus, Plus } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const SPACING = 100
const GRID_LINE_WIDTH = 1

export const GridCanvas: React.FC = () => {
  const isMobile = useIsMobile()
  const grid = useGameStore(state => state.grid)
  const newCells = useGameStore(state => state.newCells)
  const allCells = useGameStore(state => state.grid.cells)
  const historicalCells = useGameStore(state => state.historicalCells)
  const ants = useGameStore(state => state.ants)
  const placeAnt = useGameStore(state => state.actions.placeAnt)
  const flipTile = useGameStore(state => state.actions.flipTile)
  const isPlacingAnt = useUIStore(state => state.isPlacingAnt)
  const isFlippingTile = useUIStore(state => state.isFlippingTile)
  const focusedAntId = useUIStore(state => state.focusedAntId)
  const setFocusedAntId = useUIStore(state => state.actions.setFocusedAntId)
  const { toast } = useToast()
  const gridCanvasRef = useRef<HTMLCanvasElement>(null)
  const cellsCanvasRef = useRef<HTMLCanvasElement>(null)
  const antsCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: grid.width, height: grid.height })
  const [transform, setTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [lastTransform, setLastTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0
  })
  const [touchStartDistance, setTouchStartDistance] = useState(0)
  const [touchStartScale, setTouchStartScale] = useState(1)
  const [touchStartPosition, setTouchStartPosition] = useState({ x: 0, y: 0 })
  const [hasMoved, setHasMoved] = useState(false)
  const didRenderHistoricalCells = useRef(false)
  const wheelTimeoutRef = useRef<NodeJS.Timeout>()
  const touchTimeoutRef = useRef<NodeJS.Timeout>()
  const animationFrameId = useRef<number>()
  const cellSize = useMemo(() => {
    if (canvasSize.width === 0 || grid.width === 0 || grid.height === 0) {
      return 0
    }
    const size = Math.min(canvasSize.width, canvasSize.height) - SPACING
    return Math.max(5, size / Math.max(grid.width, grid.height))
  }, [canvasSize.width, canvasSize.height, grid.width, grid.height])
  const gridProps = useMemo(() => {
    const minScale = Math.min(
      (canvasSize.width * 0.5) / (grid.width * cellSize),
      (canvasSize.height * 0.5) / (grid.height * cellSize)
    )
    return {
      minScale,
      maxScale: grid.width / 10,
      lineColor: '#e5e7eb',
      backgroundColor: '#ffffff',
    }
  }, [canvasSize.width, canvasSize.height, grid.width, grid.height, cellSize])
  const prevCanvasSize = useRef(canvasSize)
  const prevCellSize = useRef(cellSize)
  const shouldClearCellsCanvas = useRef(false)

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setCanvasSize({ width: Math.max(400, width), height: Math.max(300, height) })
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  const zoomToAnt = useCallback((antId: string) => {
    const ant = ants.find(ant => ant.id === antId)

    if (!ant || canvasSize.width === 0) {
      return
    }

    const gridWidth = grid.width * cellSize
    const gridHeight = grid.height * cellSize
    const antWorldX = (ant.position.x * cellSize) - gridWidth / 2
    const antWorldY = (ant.position.y * cellSize) - gridHeight / 2
    const targetScale = Math.min(gridProps.maxScale, Math.max(gridProps.minScale, 3))
    const targetTranslateX = -antWorldX
    const targetTranslateY = -antWorldY
    shouldClearCellsCanvas.current = true
    setTransform({
      scale: targetScale,
      translateX: targetTranslateX,
      translateY: targetTranslateY,
    })
  }, [ants, grid.width, grid.height, cellSize, canvasSize.width, gridProps.maxScale, gridProps.minScale])

  useEffect(() => {
    if (focusedAntId) {
      zoomToAnt(focusedAntId)
      setFocusedAntId(null)
    }
  }, [focusedAntId, zoomToAnt, setFocusedAntId])

  const drawGrid = useCallback(() => {
    const canvas = gridCanvasRef.current

    if (!canvas || canvasSize.width === 0) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    canvas.width = canvasSize.width
    canvas.height = canvasSize.height
    context.fillStyle = gridProps.backgroundColor
    context.fillRect(0, 0, canvasSize.width, canvasSize.height)
    context.save()
    context.translate(canvasSize.width / 2, canvasSize.height / 2)
    context.scale(transform.scale, transform.scale)
    context.translate(transform.translateX, transform.translateY)
    const gridWidth = grid.width * cellSize
    const gridHeight = grid.height * cellSize
    const offsetX = -gridWidth / 2
    const offsetY = -gridHeight / 2
    context.strokeStyle = gridProps.lineColor
    context.lineWidth = 1
    context.beginPath()

    for (let i = 0; i <= grid.width; i++) {
      const x = offsetX + i * cellSize
      context.moveTo(x, offsetY)
      context.lineTo(x, offsetY + gridHeight)
    }

    for (let i = 0; i <= grid.height; i++) {
      const y = offsetY + i * cellSize
      context.moveTo(offsetX, y)
      context.lineTo(offsetX + gridWidth, y)
    }

    context.stroke()
    context.restore()
  }, [canvasSize, transform, grid.width, grid.height, cellSize, gridProps])

  const drawCellsOnCanvas = useCallback((canvasRef: HTMLCanvasElement, cells: Record<string, string>) => {
    const context = canvasRef.getContext('2d')

    if (!context || canvasSize.width === 0) {
      return
    }

    const gridWidth = grid.width * cellSize
    const gridHeight = grid.height * cellSize
    const offsetX = -gridWidth / 2
    const offsetY = -gridHeight / 2
    context.save()
    context.translate(canvasSize.width / 2, canvasSize.height / 2)
    context.scale(transform.scale, transform.scale)
    context.translate(transform.translateX, transform.translateY)
    Object.entries(cells).forEach(([key, color]) => {
      const [x, y] = key.split(',').map(Number)

      if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
        context.fillStyle = color
        context.clearRect(offsetX + (x * cellSize), offsetY + (y * cellSize), cellSize, cellSize)
        context.fillRect(
          offsetX + (x * cellSize) + GRID_LINE_WIDTH,
          offsetY + (y * cellSize) + GRID_LINE_WIDTH,
          cellSize - GRID_LINE_WIDTH * 2,
          cellSize - GRID_LINE_WIDTH * 2
        )
      }
    })

    context.restore()
  }, [canvasSize, grid.width, grid.height, cellSize, transform])

  const drawCells = useCallback(async () => {
    const context = cellsCanvasRef.current?.getContext('2d')

    if (!context || !cellsCanvasRef.current || canvasSize.width === 0) {
      return
    }

    const canvas = cellsCanvasRef.current
    const didSizeChange = canvasSize.width !== prevCanvasSize.current.width
      || canvasSize.height !== prevCanvasSize.current.height
      || cellSize !== prevCellSize.current
    let cellsToDraw = (didSizeChange || shouldClearCellsCanvas.current) ? allCells : newCells

    if (didSizeChange || shouldClearCellsCanvas.current) {
      canvas.width = canvasSize.width
      canvas.height = canvasSize.height
      didRenderHistoricalCells.current = false
      context.clearRect(0, 0, canvas.width, canvas.height)
    }

    if (historicalCells && !didRenderHistoricalCells.current) {
      didRenderHistoricalCells.current = true
      cellsToDraw = { ...historicalCells, ...cellsToDraw }
    }

    drawCellsOnCanvas(canvas, cellsToDraw)
  }, [allCells, newCells, historicalCells, canvasSize.width, canvasSize.height, cellSize, drawCellsOnCanvas])

  const drawAnts = useCallback(() => {
    const context = antsCanvasRef.current?.getContext('2d')

    if (!context || !antsCanvasRef.current || canvasSize.width === 0) {
      return
    }

    const canvas = antsCanvasRef.current

    if (canvas.width !== canvasSize.width) {
      canvas.width = canvasSize.width
    }

    if (canvas.height !== canvasSize.height) {
      canvas.height = canvasSize.height
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    const gridWidth = grid.width * cellSize
    const gridHeight = grid.height * cellSize
    const offsetX = -gridWidth / 2
    const offsetY = -gridHeight / 2
    context.save()
    context.translate(canvasSize.width / 2, canvasSize.height / 2)
    context.scale(transform.scale, transform.scale)
    context.translate(transform.translateX, transform.translateY)

    ants.forEach(ant => {
      const x = offsetX + ant.position.x * cellSize + cellSize / 2
      const y = offsetY + ant.position.y * cellSize + cellSize / 2
      const radius = cellSize / 4

      context.fillStyle = ant.color
      context.beginPath()
      context.arc(x, y, radius, 0, 2 * Math.PI)
      context.fill()
      context.strokeStyle = '#000000'
      context.lineWidth = 1
      context.beginPath()
      context.arc(x, y, radius, 0, 2 * Math.PI)
      context.stroke()
      const directionAngleMap = {
        UP: -Math.PI / 2,
        RIGHT: 0,
        DOWN: Math.PI / 2,
        LEFT: Math.PI
      }[ant.direction]
      const arrowLength = radius * 0.6
      const arrowX = x + Math.cos(directionAngleMap) * arrowLength
      const arrowY = y + Math.sin(directionAngleMap) * arrowLength
      context.strokeStyle = '#000000'
      context.lineWidth = 2
      context.beginPath()
      context.moveTo(x, y)
      context.lineTo(arrowX, arrowY)
      context.stroke()
    })
    context.restore()
  }, [grid.width, grid.height, ants, cellSize, canvasSize, transform])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlacingAnt && !isFlippingTile || !gridCanvasRef.current || canvasSize.width === 0) return

    const canvas = gridCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const clickY = event.clientY - rect.top
    const gridWidth = grid.width * cellSize
    const gridHeight = grid.height * cellSize
    const offsetX = -gridWidth / 2
    const offsetY = -gridHeight / 2
    const worldX = (clickX - canvasSize.width / 2) / transform.scale - transform.translateX
    const worldY = (clickY - canvasSize.height / 2) / transform.scale - transform.translateY
    const gridX = Math.floor((worldX - offsetX) / cellSize)
    const gridY = Math.floor((worldY - offsetY) / cellSize)

    if (gridX < 0 || gridX >= grid.width || gridY < 0 || gridY >= grid.height) {
      toast({
        title: 'Invalid Position',
        description: 'Click position is outside the grid boundaries',
        variant: 'destructive'
      })
      return
    }

    if (isPlacingAnt) {
      placeAnt({ x: gridX, y: gridY })
    } else if (isFlippingTile) {
      flipTile({ x: gridX, y: gridY })
    }
  }

  const handleTouchClick = useCallback((event: TouchEvent) => {
    if (!isMobile || !isPlacingAnt && !isFlippingTile || !gridCanvasRef.current || canvasSize.width === 0) return

    const touch = event.touches[0]
    const canvas = gridCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clickX = touch.clientX - rect.left
    const clickY = touch.clientY - rect.top
    const gridWidth = grid.width * cellSize
    const gridHeight = grid.height * cellSize
    const offsetX = -gridWidth / 2
    const offsetY = -gridHeight / 2
    const worldX = (clickX - canvasSize.width / 2) / transform.scale - transform.translateX
    const worldY = (clickY - canvasSize.height / 2) / transform.scale - transform.translateY
    const gridX = Math.floor((worldX - offsetX) / cellSize)
    const gridY = Math.floor((worldY - offsetY) / cellSize)

    if (gridX < 0 || gridX >= grid.width || gridY < 0 || gridY >= grid.height) {
      toast({
        title: 'Invalid Position',
        description: 'Touch position is outside the grid boundaries',
        variant: 'destructive'
      })
      return
    }

    if (isPlacingAnt) {
      placeAnt({ x: gridX, y: gridY })
    } else if (isFlippingTile) {
      flipTile({ x: gridX, y: gridY })
    }
  }, [isMobile, isPlacingAnt, isFlippingTile, grid.width, grid.height, cellSize, canvasSize, transform, placeAnt, flipTile, toast])

  const handleZoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
    shouldClearCellsCanvas.current = true
    setTransform(prev => {
      const newScale = Math.max(
        gridProps.minScale,
        Math.min(gridProps.maxScale, prev.scale * (1 + delta))
      )

      if (centerX !== undefined && centerY !== undefined) {
        const worldX = (centerX - canvasSize.width / 2) / prev.scale - prev.translateX
        const worldY = (centerY - canvasSize.height / 2) / prev.scale - prev.translateY
        const newTranslateX = (centerX - canvasSize.width / 2) / newScale - worldX
        const newTranslateY = (centerY - canvasSize.height / 2) / newScale - worldY
        return {
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY,
        }
      }

      return { ...prev, scale: newScale }
    })
  }, [gridProps.minScale, gridProps.maxScale, canvasSize])

  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (isMobile) return

    event.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()

    if (!rect) {
      return
    }

    if (wheelTimeoutRef.current) {
      clearTimeout(wheelTimeoutRef.current)
    }

    shouldClearCellsCanvas.current = true
    wheelTimeoutRef.current = setTimeout(() => {
      setLastTransform({
        scale: transform.scale,
        translateX: transform.translateX,
        translateY: transform.translateY
      })
      shouldClearCellsCanvas.current = false
    }, 150)
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    const delta = event.deltaY > 0 ? -0.1 : 0.1
    handleZoom(delta, mouseX, mouseY)
  }, [handleZoom, transform.scale, transform.translateX, transform.translateY, isMobile])

  const getTouchDistance = useCallback((touches: TouchList) => {
    if (touches.length < 2) {
      return 0
    }

    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const getTouchCenter = useCallback((touches: TouchList) => {
    if (touches.length === 0) {
      return { x: 0, y: 0 }
    }

    if (touches.length === 1) {
      const rect = containerRef.current?.getBoundingClientRect()

      if (!rect) {
        return { x: 0, y: 0 }
      }

      return {
        x: touches[0].clientX - rect.left,
        y: touches[0].clientY - rect.top
      }
    }

    const x = (touches[0].clientX + touches[1].clientX) / 2
    const y = (touches[0].clientY + touches[1].clientY) / 2
    const rect = containerRef.current?.getBoundingClientRect()

    if (!rect) {
      return { x: 0, y: 0 }
    }

    return {
      x: x - rect.left,
      y: y - rect.top
    }
  }, [])

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!isMobile) return

    if (event.touches.length === 2) {
      event.preventDefault()
      const distance = getTouchDistance(event.touches)
      setTouchStartDistance(distance)
      setTouchStartScale(transform.scale)
      setHasMoved(false)
    } else if (event.touches.length === 1) {
      const touch = event.touches[0]
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      setTouchStartPosition({ x: touch.clientX, y: touch.clientY })
      setHasMoved(false)
      setLastTransform({ scale: transform.scale, translateX: transform.translateX, translateY: transform.translateY })
    }
  }, [isMobile, getTouchDistance, transform.scale, transform.translateX, transform.translateY])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isMobile) return

    if (event.touches.length === 2) {
      event.preventDefault()
      const distance = getTouchDistance(event.touches)
      const center = getTouchCenter(event.touches)

      if (touchStartDistance > 0) {
        setHasMoved(true)
        const scaleDelta = (distance - touchStartDistance) / touchStartDistance
        const newScale = Math.max(
          gridProps.minScale,
          Math.min(gridProps.maxScale, touchStartScale * (1 + scaleDelta * 0.5))
        )

        shouldClearCellsCanvas.current = true
        setTransform(prev => {
          const worldX = (center.x - canvasSize.width / 2) / prev.scale - prev.translateX
          const worldY = (center.y - canvasSize.height / 2) / prev.scale - prev.translateY
          const newTranslateX = (center.x - canvasSize.width / 2) / newScale - worldX
          const newTranslateY = (center.y - canvasSize.height / 2) / newScale - worldY

          return {
            scale: newScale,
            translateX: newTranslateX,
            translateY: newTranslateY,
          }
        })
      }
    } else if (event.touches.length === 1) {
      const touch = event.touches[0]
      const deltaX = Math.abs(touch.clientX - touchStartPosition.x)
      const deltaY = Math.abs(touch.clientY - touchStartPosition.y)
      const moveThreshold = 10

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        event.preventDefault()
        setHasMoved(true)
        setIsDragging(true)
        shouldClearCellsCanvas.current = true
        const deltaX = (touch.clientX - touchStartPosition.x) / transform.scale
        const deltaY = (touch.clientY - touchStartPosition.y) / transform.scale
        setTransform(prev => ({
          ...prev,
          translateX: lastTransform.translateX + deltaX,
          translateY: lastTransform.translateY + deltaY,
        }))
      }
    }
  }, [isMobile, getTouchDistance, getTouchCenter, touchStartDistance, touchStartScale, gridProps.minScale, gridProps.maxScale, canvasSize, touchStartPosition, transform.scale, lastTransform])

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!isMobile) return

    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
    }

    if (!hasMoved && event.touches.length === 0) {
      handleTouchClick(event)
    }

    touchTimeoutRef.current = setTimeout(() => {
      setIsDragging(false)
      setTouchStartDistance(0)
      setTouchStartScale(1)
      setTouchStartPosition({ x: 0, y: 0 })
      setHasMoved(false)
      shouldClearCellsCanvas.current = false
    }, 100)
  }, [isMobile, hasMoved, handleTouchClick])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (isMobile) return

    setIsDragging(true)
    setDragStart({ x: event.clientX, y: event.clientY })
    setLastTransform({ scale: transform.scale, translateX: transform.translateX, translateY: transform.translateY })
  }, [transform.scale, transform.translateX, transform.translateY, isMobile])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || isMobile) return

    shouldClearCellsCanvas.current = true
    const deltaX = (e.clientX - dragStart.x) / transform.scale
    const deltaY = (e.clientY - dragStart.y) / transform.scale
    setTransform(prev => ({
      ...prev,
      translateX: lastTransform.translateX + deltaX,
      translateY: lastTransform.translateY + deltaY,
    }))
  }, [isDragging, dragStart, lastTransform, transform.scale, isMobile])

  const handleMouseUp = useCallback(() => {
    if (isMobile) return

    setTimeout(() => {
      setIsDragging(false)
    }, 100)
  }, [isMobile])

  const centerView = useCallback(() => {
    shouldClearCellsCanvas.current = true
    setTransform({
      scale: 1,
      translateX: 0,
      translateY: 0,
    })
  }, [])

  const zoomIn = useCallback(() => handleZoom(0.1), [handleZoom])

  const zoomOut = useCallback(() => handleZoom(-0.1), [handleZoom])

  useEffect(() => {
    drawGrid()
  }, [drawGrid])

  useEffect(() => {
    const draw = () => {
      drawCells()
      drawAnts()
      prevCanvasSize.current = canvasSize
      prevCellSize.current = cellSize
      animationFrameId.current = requestAnimationFrame(draw)
    }

    animationFrameId.current = requestAnimationFrame(draw)

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [drawCells, drawAnts, canvasSize, cellSize])

  useEffect(() => {
    return () => {
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current)
      }
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isMobile) return

    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      className="relative w-full h-full min-h-[400px] bg-gray-50 overflow-hidden">

      <canvas
        ref={gridCanvasRef}
        className="absolute z-10 cursor-grab active:cursor-grabbing"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          display: 'block',
          margin: '0 auto'
        }} />

      <canvas
        ref={cellsCanvasRef}
        className="absolute z-20 pointer-events-none"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          margin: '0 auto'
        }} />

      <canvas
        ref={antsCanvasRef}
        className="absolute z-30 cursor-pointer"
        onClick={handleCanvasClick}
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          margin: '0 auto'
        }} />

      <ZoomControls
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        centerView={centerView}
        transform={transform} />
    </div>
  )
}

type ZoomControlProps = {
  zoomIn: () => void
  zoomOut: () => void
  centerView: () => void
  transform: {
    scale: number
    translateX: number
    translateY: number
  }
}

const ZoomControls: React.FC<ZoomControlProps> = ({ zoomIn, zoomOut, centerView, transform }) => {
  return (
    <>
      <div className="absolute top-6 right-6 z-40 flex flex-col gap-2 bg-gray-800 bg-opacity-90 rounded-lg shadow-lg p-2">
        <button
          onClick={zoomIn}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-600 hover:bg-yellow-600 text-white transition-colors focus:outline-none">
          <Plus size={20} />
        </button>
        <button
          onClick={zoomOut}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-600 hover:bg-yellow-600 text-white transition-colors focus:outline-none">
          <Minus size={20} />
        </button>
        <button
          onClick={centerView}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-600 hover:bg-yellow-600 text-white transition-colors focus:outline-none">
          <Crosshair size={20} />
        </button>
      </div>

      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg px-3 py-1 text-sm text-gray-600 z-40">
        {Math.round(transform.scale * 100)}%
      </div>
    </>
  )
}