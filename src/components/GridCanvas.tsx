import { useToast } from '@/hooks/use-toast'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import { Crosshair, Minus, Plus } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const SPACING = 100
const GRID_LINE_WIDTH = 1

export const GridCanvas: React.FC = () => {
  const grid = useGameStore(state => state.grid)
  const newCells = useGameStore(state => state.newCells)
  const allCells = useGameStore(state => state.grid.cells)
  const historicalCells = useGameStore(state => state.historicalCells)
  const ants = useGameStore(state => state.ants)
  const placeAnt = useGameStore(state => state.actions.placeAnt)
  const flipTile = useGameStore(state => state.actions.flipTile)
  const isPlacingAnt = useUIStore(state => state.isPlacingAnt)
  const isFlippingTile = useUIStore(state => state.isFlippingTile)
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
  const didRenderHistoricalCells = useRef(false)
  const wheelTimeoutRef = useRef<NodeJS.Timeout>()
  const gridProps = useMemo(() => ({
    cellSize: 20,
    minScale: 0.1,
    maxScale: 10,
    lineColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  }), [])
  const cellSize = useMemo(() => {
    if (canvasSize.width === 0 || grid.width === 0 || grid.height === 0) {
      return 0
    }
    const size = Math.min(canvasSize.width, canvasSize.height) - SPACING
    return size / Math.max(grid.width, grid.height)
  }, [canvasSize.width, canvasSize.height, grid.width, grid.height])
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
    const context = canvasRef.getContext('2d', { alpha: false })

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
    const context = cellsCanvasRef.current?.getContext('2d', { alpha: false })

    if (!context || !cellsCanvasRef.current || canvasSize.width === 0) {
      return
    }

    const canvas = cellsCanvasRef.current
    const didSizeChange = canvasSize.width !== prevCanvasSize.current.width
      || canvasSize.height !== prevCanvasSize.current.height
      || cellSize !== prevCellSize.current
    let cellsToDraw = (didSizeChange || shouldClearCellsCanvas.current) ? allCells : newCells

    console.log(didSizeChange, 'didSizeChange', shouldClearCellsCanvas.current, 'shouldClearCellsCanvas.current')

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
    const context = antsCanvasRef.current?.getContext('2d', { alpha: false })

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
      context.lineWidth = 2
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

  const handleZoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
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
  }, [handleZoom, transform.scale, transform.translateX, transform.translateY])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: event.clientX, y: event.clientY })
    setLastTransform({ scale: transform.scale, translateX: transform.translateX, translateY: transform.translateY })
  }, [transform.scale, transform.translateX, transform.translateY])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return

    shouldClearCellsCanvas.current = true
    const deltaX = (e.clientX - dragStart.x) / transform.scale
    const deltaY = (e.clientY - dragStart.y) / transform.scale
    setTransform(prev => ({
      ...prev,
      translateX: lastTransform.translateX + deltaX,
      translateY: lastTransform.translateY + deltaY,
    }))
  }, [isDragging, dragStart, lastTransform, transform.scale])

  const handleMouseUp = useCallback(() => {
    setTimeout(() => {
      setIsDragging(false)
    }, 100)
  }, [])

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
      console.log('#####', prevCanvasSize.current.width, prevCanvasSize.current.height, 'prevCanvasSize.current', canvasSize.width, canvasSize.height, 'canvasSize')
      prevCanvasSize.current = canvasSize
      prevCellSize.current = cellSize
    }

    requestAnimationFrame(draw)
  }, [drawCells, drawAnts, canvasSize, cellSize])

  useEffect(() => {
    return () => {
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current)
      }
    }
  }, [])

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
      <div className="absolute top-6 right-6 z-50 flex flex-col gap-2 bg-gray-800 bg-opacity-90 rounded-lg shadow-lg p-2">
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