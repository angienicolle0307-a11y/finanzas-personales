import { useState, FormEvent } from 'react';
import { Wallet, ArrowRight, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface BudgetOnboardingProps {
  userName: string;
  userEmail: string;
  onSaveBudget: (budget: number) => Promise<void>;
  onSignOut: () => Promise<void>;
}

const SUGGESTED_BUDGETS = [1500000, 2500000, 3500000, 5000000];

export function BudgetOnboarding({
  userName,
  userEmail,
  onSaveBudget,
  onSignOut,
}: BudgetOnboardingProps) {
  const [budgetInput, setBudgetInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedBudget = Number(budgetInput);
  const isValid = !isNaN(parsedBudget) && parsedBudget > 0 && parsedBudget <= 1000000000000;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError('Ingresa un presupuesto mensual mayor a $0 COP.');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveBudget(parsedBudget);
    } catch {
      setError('No se pudo guardar tu presupuesto. Intenta de nuevo.');
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 flex flex-col justify-between px-4 py-8 sm:px-6 transition-colors">
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg">
          <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Mi Presupuesto</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800/60 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </header>

      <main className="max-w-xl w-full mx-auto my-auto py-12">
        <div className="bg-white dark:bg-[#1e293b]/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl dark:shadow-2xl space-y-8 transition-colors">
          <div className="space-y-2">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Primera configuración · {userEmail}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight [text-wrap:balance]">
              Hola{userName ? `, ${userName}` : ''}. ¿Cuál es tu presupuesto mensual?
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tu cuenta empieza completamente desde cero. Define el monto total que planeas administrar este mes en pesos colombianos (COP); luego podrás ajustarlo o registrar ingresos cuando lo necesites.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="initial-budget"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Presupuesto mensual (COP)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 dark:text-slate-500">
                  $
                </span>
                <input
                  id="initial-budget"
                  autoFocus
                  type="number"
                  min={1}
                  step="any"
                  required
                  placeholder="0"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl py-5 pl-11 pr-16 text-3xl font-bold text-slate-900 dark:text-white tabular-nums placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/60 focus:border-[#5B3DF5]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                  COP
                </span>
              </div>
              {isValid && (
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                  Presupuesto inicial: $ {parsedBudget.toLocaleString('es-CO')} COP
                </p>
              )}
            </div>

            <div className="space-y-2">
              <span className="block text-xs text-slate-500">Montos de referencia rápidos</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SUGGESTED_BUDGETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBudgetInput(preset.toString())}
                    className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 tabular-nums transition-colors"
                  >
                    $ {(preset / 1000000).toFixed(1).replace('.0', '')}M
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving || !isValid}
              className="w-full bg-[#5B3DF5] hover:bg-[#6c52f7] text-white font-semibold py-4 px-6 rounded-2xl shadow-lg shadow-[#5B3DF5]/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Guardar presupuesto y empezar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="text-center text-slate-500 dark:text-slate-600 text-xs py-4">
        <p>Solo tú puedes ver y administrar los datos de esta cuenta.</p>
      </footer>
    </div>
  );
}
