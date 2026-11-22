import { useState, MouseEvent } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Expense } from '../types';

const iconConfig: Record<string, { bg: string; emoji: string }> = {
  Utensils: { bg: 'bg-orange-500/10', emoji: '🍔' },
  Bus: { bg: 'bg-blue-500/10', emoji: '🚌' },
  Zap: { bg: 'bg-yellow-500/10', emoji: '💡' },
  ShoppingBag: { bg: 'bg-indigo-500/10', emoji: '👕' },
  Film: { bg: 'bg-purple-500/10', emoji: '🎬' },
  Wallet: { bg: 'bg-emerald-500/10', emoji: '💰' },
  Briefcase: { bg: 'bg-emerald-500/10', emoji: '💻' },
  Store: { bg: 'bg-emerald-500/10', emoji: '🏪' },
  TrendingUp: { bg: 'bg-emerald-500/10', emoji: '📈' },
  Gift: { bg: 'bg-emerald-500/10', emoji: '🎁' },
  Award: { bg: 'bg-emerald-500/10', emoji: '✨' },
  RefreshCcw: { bg: 'bg-emerald-500/10', emoji: '🔄' },
  Plus: { bg: 'bg-emerald-500/10', emoji: '➕' },
};

interface RecentMovementsProps {
  expenses: Expense[];
  onSelect: (e: Expense) => void;
  onEdit?: (e: Expense) => void;
  onDelete?: (e: Expense) => Promise<void>;
  limit?: number;
}

export function RecentMovements({
  expenses,
  onSelect,
  onEdit,
  onDelete,
  limit,
}: RecentMovementsProps) {
  const displayExpenses = limit ? expenses.slice(0, limit) : expenses;
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEditClick = (e: MouseEvent, expense: Expense) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(expense);
    } else {
      onSelect(expense);
    }
  };

  const handleDeleteRequest = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const handleCancelDelete = (e: MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  const handleConfirmDelete = async (e: MouseEvent, expense: Expense) => {
    e.stopPropagation();
    if (!onDelete) return;
    setDeletingId(expense.id);
    try {
      await onDelete(expense);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col flex-1 divide-y divide-slate-200 dark:divide-slate-800/50 overflow-hidden">
      {displayExpenses.map((expense) => {
        const isIncome = expense.type === 'INCOME';
        const config = iconConfig[expense.icon] || {
          bg: isIncome ? 'bg-emerald-500/10' : 'bg-slate-200 dark:bg-slate-800',
          emoji: isIncome ? '💵' : '💰',
        };
        const isConfirming = confirmDeleteId === expense.id;
        const isDeleting = deletingId === expense.id;

        return (
          <div
            key={expense.id}
            onClick={() => onSelect(expense)}
            className="py-4 flex items-center justify-between gap-3 group transition-all hover:bg-slate-100/80 dark:hover:bg-slate-800/50 px-3 -mx-3 rounded-2xl cursor-pointer"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div
                className={cn(
                  'w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-slate-200/70 dark:border-white/5 shrink-0',
                  config.bg,
                  'group-hover:scale-105 transition-transform'
                )}
              >
                {config.emoji}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {expense.category}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {expense.date} · {isIncome ? 'Ingreso' : 'Gasto'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isConfirming ? (
                <div
                  className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl px-2.5 py-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 mr-1">
                    ¿Borrar?
                  </span>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={(e) => handleConfirmDelete(e, expense)}
                    title="Confirmar eliminación"
                    className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleCancelDelete}
                    title="Cancelar"
                    className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-right">
                    <p
                      className={cn(
                        'font-bold text-sm tabular-nums',
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-500'
                      )}
                    >
                      {isIncome ? '+' : '-'} $ {expense.amount.toLocaleString('es-CO')}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[110px]">
                      {expense.description}
                    </p>
                  </div>

                  {(onEdit || onDelete) && (
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-80 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity ml-1">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={(e) => handleEditClick(e, expense)}
                          title="Editar movimiento"
                          aria-label={`Editar ${expense.description}`}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-500/15 dark:hover:bg-blue-600/20 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteRequest(e, expense.id)}
                          title="Eliminar movimiento"
                          aria-label={`Eliminar ${expense.description}`}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-500/15 dark:hover:bg-rose-600/20 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
