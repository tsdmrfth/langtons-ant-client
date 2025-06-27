import { CollapsiblePanel } from '@/components/ui/collapsible-panel'
import { useGameStore } from '@/stores/gameStore'
import { useUIStore } from '@/stores/uiStore'
import React, { useEffect } from 'react'

export const CollapsibleRuleEditor: React.FC = () => {
  const { currentPlayer, selectedRules, actions } = useGameStore()
  const { isConnected } = useUIStore()

  useEffect(() => {
    setTimeout(() => {
      const listRef = document.querySelector('.space-y-3')

      if (listRef) {
        listRef.scrollTo({
          top: listRef.scrollHeight,
          behavior: 'smooth'
        })
      }
    }, 0)
  }, [selectedRules])

  if (!isConnected || !currentPlayer) {
    return null
  }

  const updateRuleDirection = (index: number, value: 'LEFT' | 'RIGHT') => {
    actions.setSelectedRules(selectedRules.map((rule, i) =>
      i === index ? { ...rule, turnDirection: value } : rule
    ))
  }

  const updateRules = () => {
    actions.changeAntRules(selectedRules)
  }

  return (
    <CollapsiblePanel
      title="Rule Editor"
      className="mb-4"
      defaultCollapsed={false}
      contentClassName="bg-gray-800 rounded-b-lg">
      <div className="space-y-4">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {
            selectedRules.map((rule, index) => (
              <div key={index} className="bg-gray-750 p-3 rounded border border-gray-600">
                <div className="grid grid-cols-2 gap-3 items-start">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Cell Color
                    </label>
                    <div className="w-8 h-8 rounded border border-gray-600" style={{ backgroundColor: rule.cellColor }}></div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Turn Direction
                    </label>
                    <select
                      value={rule.turnDirection}
                      onChange={(e) => updateRuleDirection(index, e.target.value as 'LEFT' | 'RIGHT')}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white">
                      <option value="LEFT">Turn Left</option>
                      <option value="RIGHT">Turn Right</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          }
        </div>

        <button
          onClick={updateRules}
          className="w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
          Update Rules
        </button>
      </div>
    </CollapsiblePanel>
  )
}
