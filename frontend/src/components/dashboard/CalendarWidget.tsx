import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

export function CalendarWidget({ selectedDate, onSelectDate, currentMonth, setCurrentMonth }: { selectedDate: string, onSelectDate: (d: string) => void, currentMonth: Date, setCurrentMonth: (d: Date) => void }) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const handlePrev = () => setCurrentMonth(new Date(year, month - 1, 1))
  const handleNext = () => setCurrentMonth(new Date(year, month + 1, 1))

  const monthName = currentMonth.toLocaleDateString('pt-BR', { month: 'long' })

  return (
    <div className="w-full select-none">
       <div className="flex items-center justify-between mb-6">
         <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-900 dark:text-white">
           <Calendar className="w-4 h-4 text-orange-500" /> {monthName} {year}
         </h3>
         <div className="flex gap-1">
           <button onClick={handlePrev} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="w-4 h-4" /></button>
           <button onClick={handleNext} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="w-4 h-4" /></button>
         </div>
       </div>
       <div className="grid grid-cols-7 gap-1 text-center mb-2">
         {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
           <div key={d} className="text-[9px] font-black text-slate-400 uppercase">{d}</div>
         ))}
       </div>
       <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
         {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
         {Array.from({ length: daysInMonth }).map((_, i) => {
           const day = i + 1;
           const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
           const isSelected = selectedDate === dateStr;
           const isToday = new Date().toISOString().split('T')[0] === dateStr;
           
           return (
             <button
               key={day}
               onClick={() => onSelectDate(dateStr)}
               className={`w-8 h-8 mx-auto rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                 isSelected 
                   ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/20' 
                   : isToday
                   ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                   : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
               }`}
             >
               {day}
             </button>
           );
         })}
       </div>
    </div>
  )
}
