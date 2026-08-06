import { useState } from 'react'
import { HelpCircle, ChevronDown } from 'lucide-react'

export function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`transition-all duration-300 rounded-2xl border mb-3 overflow-hidden ${
      open 
        ? 'bg-violet-500/[0.04] border-violet-500/30 shadow-lg shadow-violet-500/5' 
        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.03]'
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left group"
      >
        <div className="flex items-center gap-3 pr-4">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
            open ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-white/[0.05] text-white/40 group-hover:text-white/70'
          }`}>
            <HelpCircle className="w-4 h-4" />
          </div>
          <span className={`text-[15px] font-bold transition-colors duration-300 ${
            open ? 'text-white' : 'text-white/80 group-hover:text-white'
          }`}>
            {question}
          </span>
        </div>
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
          open ? 'bg-violet-500/20 text-violet-300 rotate-180' : 'bg-white/[0.03] text-white/30 group-hover:text-white/60'
        }`}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      <div className={`transition-all duration-400 ease-in-out px-5 sm:px-6 overflow-hidden ${
        open ? 'max-h-[300px] opacity-100 pb-6' : 'max-h-0 opacity-0 pb-0'
      }`}>
        <div className="pt-2 border-t border-white/[0.04]">
          <p className="text-[14px] text-white/60 font-medium leading-relaxed pt-3">
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}
