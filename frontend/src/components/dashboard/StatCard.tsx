import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export function StatCard({ title, value, icon: Icon, color, trend }: { title: string; value: string | number; icon: any; color: string; trend?: { val: string; up: boolean } }) {
  return (
    <div className="card-simple">
      <div className="card-simple-inner p-3.5 sm:p-5 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-2.5 sm:mb-4">
          <p className="text-slate-600 dark:text-white/50 text-[9px] sm:text-[10px] font-black uppercase tracking-wider truncate mr-1">{title}</p>
          <div className="p-1.5 sm:p-2.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] shrink-0">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: color }} />
          </div>
        </div>
        <div>
          <p className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white truncate">{value}</p>
          {trend && (
            <span className={`text-[10px] sm:text-xs font-bold flex items-center gap-0.5 mt-1 ${trend.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend.val}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
