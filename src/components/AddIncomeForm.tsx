import { useState, FormEvent } from 'react';
import { Card } from './SummaryCards';
import { ArrowLeft, Check, Save } from 'lucide-react';
import { Movement } from '../types';

interface Props {
  onSave: (income: Omit<Movement, 'id' | 'date' | 'type'> & { isoDate?: string }) => void;
  onCancel: () => void;
}

const INCOME_CATEGORIES = [
  { name: 'Salario', icon: 'Wallet', emoji: '💰' },
  { name: 'Trabajo independiente', icon: 'Briefcase', emoji: '💻' },
  { name: 'Negocio', icon: 'Store', emoji: '🏪' },
  { name: 'Inversiones', icon: 'TrendingUp', emoji: '📈' },
  { name: 'Regalo', icon: 'Gift', emoji: '🎁' },
  { name: 'Bonificación', icon: 'Award', emoji: '✨' },
  { name: 'Reembolso', icon: 'RefreshCcw', emoji: '🔄' },
  { name: 'Otro', icon: 'Plus', emoji: '➕' },
];

const PAYMENT_METHODS = [
  'Efectivo',
  'Cuenta bancaria',
  'Nequi',
  'Daviplata',
  'Tarjeta',
  'Otro',
];

export function AddIncomeForm({ onSave, onCancel }: Props) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [observations, setObservations] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    setSuccess(true);
    setTimeout(() => {
      onSave({
        amount: Number(amount),
        category: category.name,
        description: description || category.name,
        icon: category.icon,
        isoDate: date,
        paymentMethod,
        observations: observations.trim() || undefined,
      });
    }, 800);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20 animate-bounce">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">¡Éxito!</h2>
        <p className="text-emerald-600 dark:text-emerald-400 font-medium">
          ✅ Ingreso registrado correctamente.
        </p>
      </div>
    );
  }

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
          Registrar Nuevo Ingreso
        </h2>
      </div>

      <Card className="p-8 border-emerald-500/20 dark:border-emerald-500/10">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Amount Field */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Valor del ingreso (COP)
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
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-6 pl-12 pr-4 text-4xl font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-800 tabular-nums"
                required
              />
            </div>
            {amount && Number(amount) > 0 && (
              <p className="mt-2 text-emerald-600 dark:text-emerald-500/70 text-sm font-medium tabular-nums">
                $ {Number(amount).toLocaleString('es-CO')} COP
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Description Field */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                Descripción
              </label>
              <input
                type="text"
                placeholder="Ej. Salario mes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl py-4 px-4 text-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                required
              />
            </div>

            {/* Date Field */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl py-4 px-4 text-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                required
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Seleccionar Categoría
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {INCOME_CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                    category.name === cat.name
                      ? 'bg-emerald-600/10 dark:bg-emerald-600/20 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl mb-2">{cat.emoji}</span>
                  <span className="text-[10px] font-bold uppercase text-center leading-tight">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Medio de Pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl py-4 px-4 text-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method} className="bg-white dark:bg-slate-900">
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Observaciones (Opcional)
            </label>
            <textarea
              placeholder="Detalles adicionales..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl py-4 px-4 text-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all h-32 resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <Save className="w-6 h-6" />
              <span className="text-lg">Guardar Ingreso</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="sm:w-1/3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-400 font-bold py-5 rounded-2xl transition-all active:scale-95"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
