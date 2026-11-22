import { ReactNode, useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { BudgetSummary } from '../types';
import { Edit2, Check, X } from 'lucide-react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-[#1e293b]/50 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800/50 shadow-sm dark:shadow-xl p-6 transition-colors',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SummaryCards({
  summary,
  onBudgetChange,
}: {
  summary: BudgetSummary;
  onBudgetChange: (budget: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempBudget, setTempBudget] = useState(summary.monthlyBudget.toString());

  useEffect(() => {
    setTempBudget(summary.monthlyBudget.toString());
  }, [summary.monthlyBudget]);

  const handleSave = () => {
    const val = Number(tempBudget);
    if (!isNaN(val) && val > 0) {
      onBudgetChange(val);
      setIsEditing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Presupuesto Mensual */}
      <div
        className={cn(
          'bg-white dark:bg-[#1e293b]/50 backdrop-blur-sm p-6 rounded-3xl shadow-sm dark:shadow-xl border flex flex-col justify-between h-44 transition-all duration-300 group',
          isEditing
            ? 'border-blue-500/60 ring-2 ring-blue-500/20'
            : 'border-slate-200 dark:border-slate-800/50'
        )}
      >
        <div className="flex justify-between items-start">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-widest">
            Presupuesto Mensual
          </span>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={handleSave}
                className="p-1.5 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 dark:hover:bg-emerald-500/30 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setTempBudget(summary.monthlyBudget.toString());
                }}
                className="p-1.5 rounded-lg bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 dark:hover:bg-rose-500/30 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-400 dark:text-slate-500">$</span>
              <input
                autoFocus
                type="number"
                value={tempBudget}
                onChange={(e) => setTempBudget(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="bg-transparent text-3xl font-bold text-slate-900 dark:text-white w-full focus:outline-none tabular-nums"
              />
            </div>
          ) : (
            <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
              $ {summary.monthlyBudget.toLocaleString('es-CO')}{' '}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                COP
              </span>
            </p>
          )}
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[100%] rounded-full opacity-70 dark:opacity-50" />
          </div>
        </div>
      </div>

      {/* Total Gastado */}
      <div className="bg-white dark:bg-[#1e293b]/50 backdrop-blur-sm p-6 rounded-3xl shadow-sm dark:shadow-xl border border-slate-200 dark:border-slate-800/50 flex flex-col justify-between h-44 transition-colors">
        <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-widest">
          Total Gastado
        </span>
        <div className="space-y-3">
          <p className="text-3xl font-bold text-rose-600 dark:text-rose-500 tabular-nums">
            $ {summary.totalSpent.toLocaleString('es-CO')}{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400 uppercase">
              COP
            </span>
          </p>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Math.max(summary.spentPercentage, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Saldo Disponible */}
      <div className="bg-white dark:bg-[#1e293b]/50 backdrop-blur-sm p-6 rounded-3xl shadow-sm dark:shadow-xl border border-emerald-200 dark:border-emerald-500/20 flex flex-col justify-between h-44 ring-1 ring-emerald-500/20 transition-colors">
        <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-widest">
          Saldo Disponible
        </span>
        <div className="space-y-3">
          <p
            className={cn(
              'text-3xl font-bold tabular-nums',
              summary.availableBalance >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            $ {summary.availableBalance.toLocaleString('es-CO')}{' '}
            <span className="text-sm font-normal text-emerald-600/60 dark:text-emerald-400/50 uppercase">
              COP
            </span>
          </p>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70 font-medium tabular-nums">
            {Math.max(0, 100 - summary.spentPercentage).toFixed(0)}% del presupuesto restante
          </p>
        </div>
      </div>
    </div>
  );
}
