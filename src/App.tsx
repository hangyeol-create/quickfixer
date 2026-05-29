import { useState } from 'react'
import { motion } from 'motion/react'
import { Wrench, FileSpreadsheet, FileText } from 'lucide-react'
import MacToWinConverter from './components/MacToWinConverter'
import HwpToPdfConverter from './components/HwpToPdfConverter'
import { cn } from './lib/utils'

const tools = [
  { id: 'mac-to-win', label: 'Mac→Win 인코딩', icon: FileSpreadsheet, component: MacToWinConverter },
  { id: 'hwp-to-pdf', label: 'HWP → PDF',      icon: FileText,         component: HwpToPdfConverter },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('mac-to-win')
  const ActiveComponent = tools.find(t => t.id === activeTab)?.component

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-8 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-lg">
            <Wrench className="text-blue-400" size={18} />
          </div>
          <div>
            <h1 className="text-base font-bold leading-none">QuickFixer</h1>
            <p className="text-xs text-gray-500 mt-0.5">업무 효율 유틸리티 · 모든 처리는 브라우저 내에서</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-8 py-8">
        <div className="flex gap-1 mb-8 bg-gray-900 rounded-xl p-1">
          {tools.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all',
                activeTab === id
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {ActiveComponent && <ActiveComponent />}
        </motion.div>
      </main>
    </div>
  )
}
