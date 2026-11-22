import { useState, FormEvent } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Wallet,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ThemeToggle } from './ThemeToggle';

type AuthMode = 'login' | 'register';

function getAuthErrorMessage(code?: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este correo ya está registrado. Cambia a "Iniciar sesión" para entrar.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'Ingresa un correo electrónico válido.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Espera un momento antes de volver a intentar.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Se cerró la ventana de Google antes de completar el inicio de sesión.';
    case 'auth/popup-blocked':
      return 'Tu navegador bloqueó la ventana emergente de Google. Permite las ventanas emergentes e intenta de nuevo.';
    case 'auth/operation-not-allowed':
      return 'El acceso con correo y contraseña aún no está habilitado en la consola de Firebase. Actívalo en Authentication > Sign-in method > Correo electrónico/contraseña, o usa el acceso rápido con Google.';
    default:
      return 'No se pudo completar la autenticación. Intenta nuevamente.';
  }
}

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();

    if (!trimmedEmail || !password) {
      setError('Completa tu correo electrónico y contraseña.');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      } else {
        const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        if (trimmedName) {
          await updateProfile(credential.user, {
            displayName: trimmedName.slice(0, 100),
          });
        }
      }
    } catch (err: any) {
      setError(getAuthErrorMessage(err?.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(getAuthErrorMessage(err?.code));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-blue-500/30 transition-colors">
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex justify-end">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Product Context */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2.5 text-blue-600 dark:text-blue-400 text-sm font-semibold">
                <Wallet className="w-5 h-5" />
                <span>Mi Presupuesto Mensual</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight [text-wrap:balance]">
                Control claro y privado de tu dinero en COP.
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed max-w-lg">
                Lleva el registro de tus ingresos y gastos mensuales con respaldo en la nube. Cada cuenta comienza desde cero y conserva únicamente su propia información.
              </p>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-none">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Datos privados por cuenta
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Tus movimientos y tu presupuesto mensual permanecen aislados y sincronizados exclusivamente con tu usuario.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 shadow-sm dark:shadow-none">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Configuración inicial en segundos
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Al crear tu cuenta por primera vez defines tu presupuesto del mes y empiezas a registrar movimientos al instante.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Auth Card */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-[#1e293b]/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl transition-colors">
              {/* Segmented Mode Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={cn(
                    'py-2.5 px-4 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap',
                    mode === 'login'
                      ? 'bg-[#5B3DF5] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={cn(
                    'py-2.5 px-4 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap',
                    mode === 'register'
                      ? 'bg-[#5B3DF5] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  Crear cuenta
                </button>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta personal'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {mode === 'login'
                    ? 'Ingresa con tu correo y contraseña o accede con Google.'
                    : 'Regístrate para definir tu presupuesto mensual desde cero.'}
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs leading-relaxed flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Fast Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 bg-slate-50 dark:bg-white hover:bg-slate-100 border border-slate-200 dark:border-transparent text-slate-900 font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                    />
                  </svg>
                )}
                <span>Entrar rápido con Google</span>
              </button>

              <div className="relative my-6 flex items-center">
                <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
                <span className="px-3 text-xs text-slate-500">o con correo electrónico</span>
                <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label
                      htmlFor="auth-name"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Nombre (opcional)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-name"
                        type="text"
                        autoComplete="name"
                        maxLength={100}
                        placeholder="Ej. María Gómez"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/60 focus:border-[#5B3DF5]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/60 focus:border-[#5B3DF5]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      required
                      minLength={6}
                      placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-11 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/60 focus:border-[#5B3DF5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full bg-[#5B3DF5] hover:bg-[#6c52f7] text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-[#5B3DF5]/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta y continuar'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center text-slate-500 dark:text-slate-600 text-xs px-4 py-6">
        <p>© 2026 Mi Presupuesto Mensual · Valores en pesos colombianos (COP)</p>
      </footer>
    </div>
  );
}
