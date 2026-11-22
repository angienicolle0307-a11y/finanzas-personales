import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { BudgetSummary } from '../types';

export function BudgetProgress({ summary }: { summary: BudgetSummary }) {
  const { spentPercentage } = summary;
  const isWarning = spentPercentage > 80;
  const isDanger = spentPercentage > 95;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
            Progreso del presupuesto
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white font-display tabular-nums">
            {spentPercentage.toFixed(1)}%{' '}
            <span className="text-sm font-normal text-slate-500 lowercase">gastado</span>
          </p>
        </div>
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider tabular-nums">
          {Math.max(0, 100 - spentPercentage).toFixed(1)}% disponible
        </p>
      </div>

      <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(Math.max(spentPercentage, 0), 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full shadow-[0_0_15px_rgba(59,130,246,0.35)] transition-all',
            isDanger
              ? 'bg-rose-500 shadow-rose-500/40'
              : isWarning
                ? 'bg-amber-500 shadow-amber-500/40'
                : 'bg-blue-600'
          )}
        />
      </div>

      <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400 italic bg-slate-100 dark:bg-slate-900/40 p-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800/50 w-fit">
        {isDanger
          ? '⚠️ Estás muy cerca de agotar tu presupuesto.'
          : isWarning
            ? '🔔 Has gastado más del 80% de tu presupuesto.'
            : '✅ Tu ritmo de gasto es saludable para este mes.'}
      </div>
    </div>
  );
}
