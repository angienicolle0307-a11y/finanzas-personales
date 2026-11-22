import { ReactNode, useState, useEffect, FormEvent } from 'react';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  Tag,
  FileText,
  DollarSign,
  CreditCard,
  Save,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Card } from './SummaryCards';
import { Expense } from '../types';
import { formatCurrency, cn } from '../lib/utils';

export interface MovementUpdatePayload {
  amount: number;
  category: string;
  description: string;
  icon: string;
  isoDate: string;
  paymentMethod?: string;
  observations?: string;
}

interface Props {
  expense: Expense;
  monthlyBudget: number;
  initialEditMode?: boolean;
  onEditModeChange?: (editing: boolean) => void;
  onBack: () => void;
  onUpdate: (expense: Expense, updates: MovementUpdatePayload) => Promise<void>;
  onDelete: (expense: Expense) => Promise<void>;
}

const EXPENSE_CATEGORIES = [
  { name: 'Alimentación', icon: 'Utensils', emoji: '🍔' },
  { name: 'Transporte', icon: 'Bus', emoji: '🚌' },
  { name: 'Servicios públicos', icon: 'Zap', emoji: '💡' },
  { name: 'Ropa y compras', icon: 'ShoppingBag', emoji: '👕' },
  { name: 'Entretenimiento', icon: 'Film', emoji: '🎬' },
  { name: 'Otro', icon: 'DollarSign', emoji: '💰' },
];

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

const iconConfig: Record<string, { bg: string; emoji: string }> = {
  Utensils: { bg: 'bg-orange-500/10', emoji: '🍔' },
  Bus: { bg: 'bg-blue-500/10', emoji: '🚌' },
  Zap: { bg: 'bg-yellow-500/10', emoji: '💡' },
  ShoppingBag: { bg: 'bg-indigo-500/10', emoji: '👕' },
  Film: { bg: 'bg-purple-500/10', emoji: '🎬' },
  DollarSign: { bg: 'bg-slate-200 dark:bg-slate-800', emoji: '💰' },
  Wallet: { bg: 'bg-emerald-500/10', emoji: '💰' },
  Briefcase: { bg: 'bg-emerald-500/10', emoji: '💻' },
  Store: { bg: 'bg-emerald-500/10', emoji: '🏪' },
  TrendingUp: { bg: 'bg-emerald-500/10', emoji: '📈' },
  Gift: { bg: 'bg-emerald-500/10', emoji: '🎁' },
  Award: { bg: 'bg-emerald-500/10', emoji: '✨' },
  RefreshCcw: { bg: 'bg-emerald-500/10', emoji: '🔄' },
  Plus: { bg: 'bg-emerald-500/10', emoji: '➕' },
};

function getLocalIsoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  return (
    parsed.getFullYear() === y &&
    parsed.getMonth() === m - 1 &&
    parsed.getDate() === d
  );
}

export function ExpenseDetail({
  expense,
  monthlyBudget,
  initialEditMode = false,
  onEditModeChange,
  onBack,
  onUpdate,
  onDelete,
}: Props) {
  const isIncome = expense.type === 'INCOME';
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const showPaymentMethodField = isIncome || expense.paymentMethod !== undefined;
  const showObservationsField = isIncome || expense.observations !== undefined;

  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [amount, setAmount] = useState(expense.amount.toString());
  const [categoryName, setCategoryName] = useState(expense.category);
  const [iconName, setIconName] = useState(expense.icon);
  const [description, setDescription] = useState(expense.description);
  const [isoDate, setIsoDate] = useState(expense.isoDate || getLocalIsoDate());
  const [paymentMethod, setPaymentMethod] = useState(expense.paymentMethod || '');
  const [observations, setObservations] = useState(expense.observations || '');

  const resetFormToOriginal = () => {
    setError(null);
    setAmount(expense.amount.toString());
    setCategoryName(expense.category);
    setIconName(expense.icon);
    setDescription(expense.description);
    setIsoDate(expense.isoDate || getLocalIsoDate());
    setPaymentMethod(expense.paymentMethod || '');
    setObservations(expense.observations || '');
  };

  useEffect(() => {
    setIsEditing(initialEditMode);
    setConfirmingDelete(false);
    setSuccessMessage(null);
    resetFormToOriginal();
  }, [expense.id, initialEditMode]);

  useEffect(() => {
    if (!isEditing) {
      resetFormToOriginal();
    }
  }, [
    expense.amount,
    expense.category,
    expense.icon,
    expense.description,
    expense.isoDate,
    expense.paymentMethod,
    expense.observations,
  ]);

  const startEditing = () => {
    resetFormToOriginal();
    setConfirmingDelete(false);
    setSuccessMessage(null);
    setIsEditing(true);
    onEditModeChange?.(true);
  };

  const cancelEditing = () => {
    resetFormToOriginal();
    setIsEditing(false);
    onEditModeChange?.(false);
  };

  const paymentMethodOptions =
    paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)
      ? [paymentMethod, ...PAYMENT_METHODS]
      : PAYMENT_METHODS;

  const config = iconConfig[expense.icon] || {
    bg: isIncome ? 'bg-emerald-500/10' : 'bg-slate-200 dark:bg-slate-800',
    emoji: isIncome ? '💵' : '💰',
  };

  const budgetPercentage =
    monthlyBudget > 0 ? ((expense.amount / monthlyBudget) * 100).toFixed(1) : '0.0';
  const txCode = `TX-${expense.id.slice(-8).toUpperCase()}`;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const normalizedAmountStr = amount.trim();
    const parsedAmount = Number(normalizedAmountStr);
    if (
      normalizedAmountStr === '' ||
      isNaN(parsedAmount) ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      parsedAmount > 1000000000000
    ) {
      setError('Ingresa un valor numérico válido mayor a $0 COP.');
      return;
    }

    const trimmedCategory = categoryName.trim();
    if (!trimmedCategory) {
      setError('Selecciona una categoría para el movimiento.');
      return;
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      setError('La descripción del movimiento es obligatoria.');
      return;
    }

    if (!isValidIsoDate(isoDate)) {
      setError('Selecciona una fecha válida para el movimiento.');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(expense, {
        amount: parsedAmount,
        category: trimmedCategory,
        description: trimmedDesc,
        icon: iconName,
        isoDate,
        paymentMethod: showPaymentMethodField
          ? paymentMethod.trim() || undefined
          : expense.paymentMethod,
        observations: showObservationsField
          ? observations.trim() || undefined
          : expense.observations,
      });
      setIsEditing(false);
      onEditModeChange?.(false);
      setSuccessMessage('Cambios guardados correctamente.');
    } catch {
      setError('No se pudieron guardar los cambios. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsDeleting(true);
    try {
      await onDelete(expense);
    } catch {
      setError('No se pudo eliminar el movimiento. Intenta de nuevo.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        {!isEditing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startEditing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-600/15 hover:bg-blue-100 dark:hover:bg-blue-600/25 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 font-semibold text-sm transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        )}
      </div>

      {confirmingDelete && !isEditing && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                ¿Eliminar este {isIncome ? 'ingreso' : 'gasto'}?
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-200/80 mt-0.5">
                Se borrará permanentemente de tu historial
                {isIncome ? ' y se descontará del presupuesto mensual' : ''}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Sí, eliminar</span>
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setConfirmingDelete(false)}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {successMessage && !isEditing && (
        <div
          role="status"
          className="mb-6 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium"
        >
          {error}
        </div>
      )}

      {isEditing ? (
        <Card className="p-6 sm:p-8 border-slate-200 dark:border-slate-800/60">
          <form onSubmit={handleSave} noValidate className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-4">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Editar {isIncome ? 'Ingreso' : 'Gasto'}
              </h4>
              <button
                type="button"
                onClick={cancelEditing}
                aria-label="Cancelar edición"
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Valor (COP)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400 dark:text-slate-500">
                  $
                </span>
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-10 pr-4 text-2xl font-bold text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Categoría
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      setCategoryName(cat.name);
                      setIconName(cat.icon);
                    }}
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all',
                      categoryName === cat.name
                        ? 'bg-blue-600/10 dark:bg-blue-600/20 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    )}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="text-xs font-semibold truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
              {!categories.some((c) => c.name === categoryName) && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Categoría actual:{' '}
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">
                    {categoryName}
                  </span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  maxLength={200}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={isoDate}
                  onChange={(e) => setIsoDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>

            {showPaymentMethodField && (
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Medio de pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="" className="bg-white dark:bg-slate-900">
                    Sin especificar
                  </option>
                  {paymentMethodOptions.map((method) => (
                    <option key={method} value={method} className="bg-white dark:bg-slate-900">
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showObservationsField && (
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Observaciones (Opcional)
                </label>
                <textarea
                  maxLength={500}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 h-24 resize-none"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Guardar</span>
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={cancelEditing}
                className="sm:w-1/3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3.5 px-4 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden p-0 border-slate-200 dark:border-slate-800/40">
            <div className={cn('h-32 flex items-center justify-center text-6xl relative', config.bg)}>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 dark:to-[#1e293b]/80" />
              <span className="relative z-10 drop-shadow-2xl">{config.emoji}</span>
            </div>

            <div className="p-8 space-y-8">
              <div className="text-center">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">
                  {expense.category}
                </p>
                <h3
                  className={cn(
                    'text-4xl font-extrabold mb-2 tabular-nums',
                    isIncome
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-white'
                  )}
                >
                  {isIncome ? '+' : '-'} {formatCurrency(expense.amount)}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic">
                  "{expense.description}"
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-200 dark:border-slate-800/50">
                <div className="space-y-4">
                  <DetailItem
                    icon={<Calendar className="w-4 h-4" />}
                    label="Fecha y hora"
                    value={expense.date}
                  />
                  <DetailItem
                    icon={<Tag className="w-4 h-4" />}
                    label="Categoría"
                    value={expense.category}
                  />
                </div>
                <div className="space-y-4">
                  <DetailItem
                    icon={<DollarSign className="w-4 h-4" />}
                    label="Monto neto"
                    value={formatCurrency(expense.amount)}
                  />
                  <DetailItem
                    icon={<FileText className="w-4 h-4" />}
                    label="ID Transacción"
                    value={txCode}
                  />
                </div>
              </div>

              {(expense.paymentMethod || expense.observations) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200 dark:border-slate-800/50">
                  {expense.paymentMethod && (
                    <DetailItem
                      icon={<CreditCard className="w-4 h-4" />}
                      label="Medio de pago"
                      value={expense.paymentMethod}
                    />
                  )}
                  {expense.observations && (
                    <DetailItem
                      icon={<FileText className="w-4 h-4" />}
                      label="Observaciones"
                      value={expense.observations}
                    />
                  )}
                </div>
              )}
            </div>
          </Card>

          <div className="mt-8 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/10 rounded-2xl p-6 text-center">
            <p className="text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
              Impacto en el presupuesto
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Este movimiento equivale al{' '}
              <span className="text-slate-900 dark:text-white font-bold tabular-nums">
                {budgetPercentage}%
              </span>{' '}
              de tu presupuesto mensual total.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}
