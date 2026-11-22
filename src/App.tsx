import { useState, useMemo, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { SummaryCards, Card } from './components/SummaryCards';
import { ExpenseChart } from './components/ExpenseChart';
import { RecentMovements } from './components/RecentMovements';
import { BudgetProgress } from './components/BudgetProgress';
import { AddExpenseForm } from './components/AddExpenseForm';
import { AddIncomeForm } from './components/AddIncomeForm';
import { AssistantDrawer } from './components/AssistantDrawer';
import { ExpenseDetail, MovementUpdatePayload } from './components/ExpenseDetail';
import { AuthScreen } from './components/AuthScreen';
import { BudgetOnboarding } from './components/BudgetOnboarding';
import { ThemeToggle } from './components/ThemeToggle';
import {
  TrendingUp,
  Plus,
  List,
  X,
  DollarSign,
  MessageSquare,
  LogOut,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Expense, View, Movement, UserProfile } from './types';
import { cn } from './lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

function Modal({ isOpen, onClose, children, title }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 dark:bg-[#070b14]/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-[#1e293b] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white px-2">{title}</h3>
              <button
                onClick={onClose}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function formatCurrentMonthLabel(): string {
  const formatted = new Date().toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function generateMovementId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `mov_${Date.now()}_${rand}`;
}

function getLocalIsoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMovementDateLabel(isoDate: string): string {
  const todayIso = getLocalIsoDate();
  if (isoDate === todayIso) {
    return `Hoy, ${new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const parsed = new Date(year, month - 1, day);
  return parsed.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [expenses, setExpenses] = useState<Movement[]>([]);
  const [movementsLoaded, setMovementsLoaded] = useState(false);

  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [detailEditMode, setDetailEditMode] = useState(false);
  const [detailReturnView, setDetailReturnView] = useState<View>('DASHBOARD');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  useEffect(() => {
    if (!feedbackToast) return;
    const timer = setTimeout(() => setFeedbackToast(null), 3500);
    return () => clearTimeout(timer);
  }, [feedbackToast]);

  const currentMonth = useMemo(() => formatCurrentMonthLabel(), []);

  const selectedExpense = useMemo(
    () => expenses.find((e) => e.id === selectedExpenseId) || null,
    [expenses, selectedExpenseId]
  );

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        setProfile(null);
        setProfileLoaded(false);
        setExpenses([]);
        setMovementsLoaded(false);
        setCurrentView('DASHBOARD');
        setSelectedExpenseId(null);
        setDetailEditMode(false);
        setIsAssistantOpen(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to the authenticated user's private profile
  useEffect(() => {
    if (!authReady || !user) return;

    setProfileLoaded(false);
    const profilePath = `users/${user.uid}`;
    const profileRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      profileRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfile({
            uid: String(data.uid || user.uid),
            email: String(data.email || user.email || ''),
            displayName: String(data.displayName || user.displayName || ''),
            monthlyBudget: Number(data.monthlyBudget || 0),
            hasCompletedOnboarding: Boolean(data.hasCompletedOnboarding),
          });
        } else {
          setProfile(null);
        }
        setProfileLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, profilePath);
      }
    );

    return () => unsubscribe();
  }, [authReady, user]);

  // Subscribe to the authenticated user's private movements subcollection
  useEffect(() => {
    if (!authReady || !user) return;

    setMovementsLoaded(false);
    const movementsPath = `users/${user.uid}/movements`;
    const movementsQuery = query(
      collection(db, 'users', user.uid, 'movements'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      movementsQuery,
      (snapshot) => {
        const items: Movement[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const createdAtMs =
            d.createdAt && typeof d.createdAt.toMillis === 'function'
              ? d.createdAt.toMillis()
              : 0;
          return {
            id: String(d.id || docSnap.id),
            userId: String(d.userId || user.uid),
            amount: Number(d.amount || 0),
            category: String(d.category || 'Otro'),
            description: String(d.description || ''),
            date: String(d.date || ''),
            isoDate: d.isoDate ? String(d.isoDate) : undefined,
            dayOfMonth: typeof d.dayOfMonth === 'number' ? d.dayOfMonth : undefined,
            icon: String(d.icon || 'DollarSign'),
            type: d.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
            paymentMethod: d.paymentMethod ? String(d.paymentMethod) : undefined,
            observations: d.observations ? String(d.observations) : undefined,
            createdAtMs,
          };
        });

        items.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        setExpenses(items);
        setMovementsLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, movementsPath);
      }
    );

    return () => unsubscribe();
  }, [authReady, user]);

  const monthlyBudget = profile?.monthlyBudget ?? 0;

  const summary = useMemo(() => {
    const totalSpent = expenses
      .filter((e) => e.type === 'EXPENSE')
      .reduce((sum, e) => sum + e.amount, 0);
    const availableBalance = monthlyBudget - totalSpent;
    const spentPercentage = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

    return {
      monthlyBudget,
      totalSpent,
      availableBalance,
      spentPercentage,
    };
  }, [expenses, monthlyBudget]);

  const isPositive = summary.availableBalance >= 0;

  const accountDisplayName = useMemo(() => {
    if (profile?.displayName) return profile.displayName;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'Usuario';
  }, [profile, user]);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleInitialBudgetSave = async (initialBudget: number) => {
    if (!user) return;
    const safeBudget = Number(initialBudget);
    if (isNaN(safeBudget) || safeBudget <= 0) return;

    const path = `users/${user.uid}`;
    const userRef = doc(db, 'users', user.uid);
    const safeName = (
      user.displayName ||
      user.email?.split('@')[0] ||
      'Usuario'
    ).slice(0, 100);
    const safeEmail = (user.email || '').slice(0, 254);

    try {
      if (profile) {
        await updateDoc(userRef, {
          monthlyBudget: safeBudget,
          hasCompletedOnboarding: true,
          displayName: safeName,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(userRef, {
          uid: user.uid,
          email: safeEmail,
          displayName: safeName,
          monthlyBudget: safeBudget,
          hasCompletedOnboarding: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(
        error,
        profile ? OperationType.UPDATE : OperationType.CREATE,
        path
      );
    }
  };

  const handleBudgetChange = async (newBudget: number) => {
    if (!user || isNaN(newBudget) || newBudget < 0) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        monthlyBudget: newBudget,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleAddExpense = async (
    newExpenseData: Omit<Expense, 'id' | 'date' | 'type'> & { isoDate?: string }
  ) => {
    if (!user) return;
    const amount = Number(newExpenseData.amount);
    if (isNaN(amount) || amount <= 0) return;

    const now = new Date();
    const id = generateMovementId();
    const isoDate =
      newExpenseData.isoDate && /^\d{4}-\d{2}-\d{2}$/.test(newExpenseData.isoDate)
        ? newExpenseData.isoDate
        : getLocalIsoDate(now);
    const dayOfMonth = Number(isoDate.split('-')[2]) || now.getDate();
    const formattedDate = formatMovementDateLabel(isoDate);

    const path = `users/${user.uid}/movements/${id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'movements', id), {
        id,
        userId: user.uid,
        amount,
        category: (newExpenseData.category || 'Otro').slice(0, 60),
        description: (newExpenseData.description || newExpenseData.category || 'Gasto').slice(0, 200),
        date: formattedDate.slice(0, 60),
        isoDate,
        dayOfMonth,
        icon: (newExpenseData.icon || 'DollarSign').slice(0, 40),
        type: 'EXPENSE',
        createdAt: serverTimestamp(),
      });
      setCurrentView('DASHBOARD');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleAddIncome = async (
    newIncomeData: Omit<Movement, 'id' | 'date' | 'type'> & { isoDate?: string }
  ) => {
    if (!user || !profile) return;
    const amount = Number(newIncomeData.amount);
    if (isNaN(amount) || amount <= 0) return;

    const now = new Date();
    const id = generateMovementId();
    const isoDate =
      newIncomeData.isoDate && /^\d{4}-\d{2}-\d{2}$/.test(newIncomeData.isoDate)
        ? newIncomeData.isoDate
        : getLocalIsoDate(now);
    const dayOfMonth = Number(isoDate.split('-')[2]) || now.getDate();
    const formattedDate = formatMovementDateLabel(isoDate);

    const path = `users/${user.uid}/movements/${id}`;
    try {
      const batch = writeBatch(db);
      const movementRef = doc(db, 'users', user.uid, 'movements', id);
      const userRef = doc(db, 'users', user.uid);

      const movementPayload: Record<string, unknown> = {
        id,
        userId: user.uid,
        amount,
        category: (newIncomeData.category || 'Ingreso').slice(0, 60),
        description: (newIncomeData.description || newIncomeData.category || 'Ingreso').slice(0, 200),
        date: formattedDate.slice(0, 60),
        isoDate,
        dayOfMonth,
        icon: (newIncomeData.icon || 'Wallet').slice(0, 40),
        type: 'INCOME',
        createdAt: serverTimestamp(),
      };

      if (newIncomeData.paymentMethod) {
        movementPayload.paymentMethod = newIncomeData.paymentMethod.slice(0, 40);
      }
      if (newIncomeData.observations) {
        movementPayload.observations = newIncomeData.observations.slice(0, 500);
      }

      batch.set(movementRef, movementPayload);
      batch.update(userRef, {
        monthlyBudget: profile.monthlyBudget + amount,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      setCurrentView('DASHBOARD');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleUpdateMovement = async (
    expense: Expense,
    updates: MovementUpdatePayload
  ) => {
    if (!user || !profile) {
      throw new Error('Debes iniciar sesión para actualizar movimientos.');
    }

    const parsedAmount = Number(updates.amount);
    if (
      isNaN(parsedAmount) ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      parsedAmount > 1000000000000
    ) {
      throw new Error('El valor debe ser numérico y mayor a cero.');
    }

    const trimmedCategory = updates.category.trim();
    const trimmedDescription = updates.description.trim();
    if (!trimmedCategory || !trimmedDescription || !/^\d{4}-\d{2}-\d{2}$/.test(updates.isoDate)) {
      throw new Error('Faltan campos obligatorios válidos para actualizar.');
    }

    const path = `users/${user.uid}/movements/${expense.id}`;
    const movementRef = doc(db, 'users', user.uid, 'movements', expense.id);

    const dayOfMonth = Number(updates.isoDate.split('-')[2]) || new Date().getDate();
    const nextDateLabel =
      updates.isoDate === expense.isoDate && expense.date
        ? expense.date
        : formatMovementDateLabel(updates.isoDate);

    const movementUpdates: Record<string, unknown> = {
      amount: parsedAmount,
      category: trimmedCategory.slice(0, 60),
      description: trimmedDescription.slice(0, 200),
      icon: (updates.icon || 'DollarSign').slice(0, 40),
      isoDate: updates.isoDate,
      dayOfMonth,
      date: nextDateLabel.slice(0, 60),
    };

    const trimmedPaymentMethod = updates.paymentMethod?.trim();
    if (trimmedPaymentMethod) {
      movementUpdates.paymentMethod = trimmedPaymentMethod.slice(0, 40);
    } else if (expense.paymentMethod) {
      movementUpdates.paymentMethod = deleteField();
    }

    const trimmedObservations = updates.observations?.trim();
    if (trimmedObservations) {
      movementUpdates.observations = trimmedObservations.slice(0, 500);
    } else if (expense.observations) {
      movementUpdates.observations = deleteField();
    }

    try {
      if (expense.type === 'INCOME' && parsedAmount !== expense.amount) {
        const diff = parsedAmount - expense.amount;
        const batch = writeBatch(db);
        batch.update(movementRef, movementUpdates);
        batch.update(doc(db, 'users', user.uid), {
          monthlyBudget: Math.max(0, profile.monthlyBudget + diff),
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
      } else {
        await updateDoc(movementRef, movementUpdates);
      }
      setDetailEditMode(false);
      setFeedbackToast('Cambios guardados correctamente.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteMovement = async (expense: Expense) => {
    if (!user || !profile) return;
    const path = `users/${user.uid}/movements/${expense.id}`;
    const movementRef = doc(db, 'users', user.uid, 'movements', expense.id);

    try {
      if (expense.type === 'INCOME') {
        const batch = writeBatch(db);
        batch.delete(movementRef);
        batch.update(doc(db, 'users', user.uid), {
          monthlyBudget: Math.max(0, profile.monthlyBudget - expense.amount),
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
      } else {
        await deleteDoc(movementRef);
      }

      if (selectedExpenseId === expense.id) {
        setSelectedExpenseId(null);
        setDetailEditMode(false);
        setCurrentView(detailReturnView);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleSelectExpense = (expense: Expense, returnView: View = 'DASHBOARD') => {
    setSelectedExpenseId(expense.id);
    setDetailEditMode(false);
    setDetailReturnView(returnView);
    setCurrentView('DETAIL');
  };

  const handleEditExpense = (expense: Expense, returnView: View = 'DASHBOARD') => {
    setSelectedExpenseId(expense.id);
    setDetailEditMode(true);
    setDetailReturnView(returnView);
    setCurrentView('DETAIL');
  };

  // 1. Auth or initial profile loading
  if (!authReady || (user && (!profileLoaded || !movementsLoaded))) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex flex-col items-center justify-center gap-4 text-slate-600 dark:text-slate-400 transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-500" />
        <p className="text-sm font-medium">Cargando tu cuenta...</p>
      </div>
    );
  }

  // 2. Unauthenticated user -> Login / Sign Up
  if (!user) {
    return <AuthScreen />;
  }

  // 3. First-time user (no profile yet or onboarding incomplete) -> Ask monthly budget
  if (!profile || !profile.hasCompletedOnboarding) {
    return (
      <BudgetOnboarding
        userName={accountDisplayName}
        userEmail={user.email || ''}
        onSaveBudget={handleInitialBudgetSave}
        onSignOut={handleSignOut}
      />
    );
  }

  // 4. Authenticated & Onboarded Personal Dashboard
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pb-12 pt-8 selection:bg-blue-500/30 transition-colors">
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div className="space-y-1">
          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm cursor-pointer"
            onClick={() => setCurrentView('DASHBOARD')}
          >
            Mi Presupuesto
          </h1>
          <p className="text-blue-600 dark:text-blue-400/80 font-semibold text-sm">{currentMonth}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className={cn(
              'flex items-center px-4 py-2 rounded-xl border text-xs font-semibold',
              isPositive
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 dark:border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25 dark:border-rose-500/20'
            )}
          >
            <span>{isPositive ? 'Balance positivo' : 'Balance negativo'}</span>
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                {accountDisplayName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                {user.email}
              </p>
            </div>
            <ThemeToggle />
            <button
              type="button"
              onClick={handleSignOut}
              title="Cerrar sesión"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/70 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shadow-sm dark:shadow-none"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <section className="space-y-8">
            <SummaryCards summary={summary} onBudgetChange={handleBudgetChange} />

            {/* Acciones Rápidas */}
            <div className="flex flex-col items-center gap-6 pt-2">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
                Acciones rápidas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                <button
                  onClick={() => setCurrentView('ADD_INCOME')}
                  className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 px-8 rounded-3xl shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.98] group border border-white/10"
                >
                  <DollarSign className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-lg">Registrar ingreso</span>
                </button>
                <button
                  onClick={() => setCurrentView('ADD_EXPENSE')}
                  className="flex items-center justify-center gap-3 bg-[#5B3DF5] hover:bg-[#6c52f7] text-white font-bold py-5 px-8 rounded-3xl shadow-xl shadow-[#5B3DF5]/20 transition-all active:scale-[0.98] group border border-white/10"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                  <span className="text-lg">
                    {expenses.length === 0 ? 'Registrar tu primer gasto' : 'Registrar gasto'}
                  </span>
                </button>
              </div>
            </div>
          </section>

          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="w-24 h-24 bg-slate-200/70 dark:bg-slate-800/30 rounded-full flex items-center justify-center border border-slate-300/70 dark:border-slate-700/30">
                <Plus className="w-10 h-10 text-slate-500 dark:text-slate-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Aún no hay movimientos este mes
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto text-sm">
                  Tu cuenta está lista. Registra tu primer gasto o ingreso y se guardará automáticamente en tu historial privado.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 space-y-8">
                <Card className="flex flex-col border-slate-200 dark:border-slate-800/40">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      Gastos Diarios
                    </h2>
                    <div className="flex space-x-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                        Gasto diario
                      </span>
                    </div>
                  </div>
                  <ExpenseChart expenses={expenses} />
                </Card>

                <Card className="border-slate-200 dark:border-slate-800/40">
                  <BudgetProgress summary={summary} />
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <Card className="h-full flex flex-col border-slate-200 dark:border-slate-800/40">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      Últimos Movimientos
                    </h2>
                    <button
                      onClick={() => setCurrentView('MOVEMENTS')}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/20"
                    >
                      Ver Historial
                    </button>
                  </div>
                  <RecentMovements
                    expenses={expenses}
                    onSelect={(exp) => handleSelectExpense(exp, 'DASHBOARD')}
                    onEdit={(exp) => handleEditExpense(exp, 'DASHBOARD')}
                    onDelete={handleDeleteMovement}
                    limit={6}
                  />

                  <div className="mt-12">
                    <div className="bg-slate-100/80 dark:bg-gradient-to-br dark:from-[#1e293b]/80 dark:to-[#0f172a]/80 rounded-2xl p-6 border border-slate-200 dark:border-blue-500/10 shadow-inner relative overflow-hidden group">
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 bg-blue-500/10 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-0 font-bold">
                            Resumen del Mes
                          </p>
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed tabular-nums">
                          Has utilizado el{' '}
                          <span className="text-slate-900 dark:text-white font-bold">
                            {summary.spentPercentage.toFixed(1)}%
                          </span>{' '}
                          de tu presupuesto mensual disponible.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </motion.div>

        {/* AI Assistant Drawer */}
        <AssistantDrawer
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          onRegisterExpense={handleAddExpense}
          onUpdateExpense={handleUpdateMovement}
          onDeleteExpense={handleDeleteMovement}
          expenses={expenses}
          summary={summary}
          userName={accountDisplayName}
        />

        {/* Floating AI Button */}
        <button
          onClick={() => setIsAssistantOpen(true)}
          aria-label="Abrir asistente financiero"
          className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-2xl shadow-blue-600/40 flex items-center justify-center hover:bg-blue-500 transition-all active:scale-95 z-40 group"
        >
          <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>

        {/* Modals Layer */}
        <Modal
          isOpen={currentView === 'MOVEMENTS'}
          onClose={() => setCurrentView('DASHBOARD')}
          title="Historial de Movimientos"
        >
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="w-20 h-20 bg-slate-200/70 dark:bg-slate-800/30 rounded-full flex items-center justify-center border border-slate-300/70 dark:border-slate-700/30">
                <List className="w-8 h-8 text-slate-500 dark:text-slate-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Tus movimientos aparecerán aquí
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xs mx-auto">
                  Cada vez que registres un gasto o ingreso aparecerá en esta lista privada.
                </p>
              </div>
              <button
                onClick={() => setCurrentView('ADD_EXPENSE')}
                className="bg-[#5B3DF5] hover:bg-[#6c52f7] text-white font-bold py-3 px-8 rounded-2xl transition-all active:scale-[0.95]"
              >
                Registrar gasto
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2">
                Cronología completa · {currentMonth}
              </p>
              <RecentMovements
                expenses={expenses}
                onSelect={(exp) => handleSelectExpense(exp, 'MOVEMENTS')}
                onEdit={(exp) => handleEditExpense(exp, 'MOVEMENTS')}
                onDelete={handleDeleteMovement}
              />
            </div>
          )}
        </Modal>

        <Modal
          isOpen={currentView === 'ADD_INCOME'}
          onClose={() => setCurrentView('DASHBOARD')}
          title="Nuevo Ingreso"
        >
          <AddIncomeForm onSave={handleAddIncome} onCancel={() => setCurrentView('DASHBOARD')} />
        </Modal>

        <Modal
          isOpen={currentView === 'ADD_EXPENSE'}
          onClose={() => setCurrentView('DASHBOARD')}
          title="Nuevo Registro"
        >
          <AddExpenseForm onSave={handleAddExpense} onCancel={() => setCurrentView('DASHBOARD')} />
        </Modal>

        <Modal
          isOpen={currentView === 'DETAIL'}
          onClose={() => {
            setDetailEditMode(false);
            setCurrentView(detailReturnView);
          }}
          title={detailEditMode ? 'Editar Movimiento' : 'Detalle del Movimiento'}
        >
          {selectedExpense ? (
            <ExpenseDetail
              expense={selectedExpense}
              monthlyBudget={monthlyBudget}
              initialEditMode={detailEditMode}
              onEditModeChange={setDetailEditMode}
              onBack={() => {
                setDetailEditMode(false);
                setCurrentView(detailReturnView);
              }}
              onUpdate={handleUpdateMovement}
              onDelete={handleDeleteMovement}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-slate-500 font-medium italic">
                Selecciona un movimiento en Movimientos para ver el detalle
              </p>
            </div>
          )}
        </Modal>

        <AnimatePresence>
          {feedbackToast && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-semibold shadow-2xl shadow-emerald-600/30 border border-white/15"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackToast}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 text-center text-slate-500 dark:text-slate-600 text-xs px-4 font-medium pb-10">
        <p>© 2026 Mi Presupuesto Mensual · Todos los valores se muestran en pesos colombianos (COP).</p>
      </footer>
    </div>
  );
}
