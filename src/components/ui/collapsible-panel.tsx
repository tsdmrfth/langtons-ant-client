import React, { useEffect, useRef, useState } from 'react'

interface CollapsiblePanelProps {
  title: string
  children: React.ReactNode
  defaultCollapsed?: boolean
  className?: string
  headerClassName?: string
  contentClassName?: string
  onToggle?: (collapsed: boolean) => void
  dependencies?: unknown[]
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  children,
  defaultCollapsed = false,
  className = '',
  headerClassName = '',
  contentClassName = '',
  onToggle
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [collapsed])

  const handleToggle = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    onToggle?.(newCollapsed)
  }

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 mb-4 ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center justify-between px-4 py-2 bg-gray-700 text-gray-100 font-semibold focus:outline-none rounded-t-lg ${collapsed ? 'rounded-b-lg' : ''} text-lg ${headerClassName}`}>
        <span>{title}</span>
        <span className="ml-2">{collapsed ? '+' : '-'}</span>
      </button>
      <div
        style={{
          maxHeight: collapsed ? 0 : contentHeight,
          overflow: 'hidden',
          transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
        <div ref={contentRef} className={`p-4 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  )
} 