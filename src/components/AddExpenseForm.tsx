import { useState, FormEvent } from 'react';
import { Card } from './SummaryCards';
import { ArrowLeft, Save } from 'lucide-react';
import { Expense } from '../types';

interface Props {
  onSave: (expense: Omit<Expense, 'id' | 'date' | 'type'>) => void;
  onCancel: () => void;
}

const CATEGORIES = [
  { name: 'Alimentación', icon: 'Utensils', emoji: '🍔' },
  { name: 'Transporte', icon: 'Bus', emoji: '🚌' },
  { name: 'Servicios públicos', icon: 'Zap', emoji: '💡' },
  { name: 'Ropa y compras', icon: 'ShoppingBag', emoji: '👕' },
  { name: 'Entretenimiento', icon: 'Film', emoji: '🎬' },
];

export function AddExpenseForm({ onSave, onCancel }: Props) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    onSave({
      amount: Number(amount),
      category: category.name,
      description: description || category.name,
      icon: category.icon,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onCancel}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Registrar Nuevo Gasto
        </h2>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Amount Field */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Monto del gasto (COP)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 dark:text-slate-500">
                $
              </span>
              <input
                autoFocus
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-6 pl-12 pr-4 text-4xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-800 tabular-nums"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Seleccionar Categoría
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                    category.name === cat.name
                      ? 'bg-blue-600/10 dark:bg-blue-600/20 border-blue-500 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl mb-2">{cat.emoji}</span>
                  <span className="text-[10px] font-bold uppercase text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Nota o descripción (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Almuerzo con amigos"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl py-4 px-4 text-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            <Save className="w-6 h-6" />
            <span className="text-lg">Guardar Gasto</span>
          </button>
        </form>
      </Card>

      <p className="mt-6 text-center text-slate-500 text-xs">
        Este gasto se descontará automáticamente de tu saldo disponible.
      </p>
    </div>
  );
}
