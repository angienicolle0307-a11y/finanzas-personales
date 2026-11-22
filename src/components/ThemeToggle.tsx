import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme';
import { cn } from '../lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo oscuro activo · Cambiar a claro' : 'Modo claro activo · Cambiar a oscuro'}
      className={cn(
        'inline-flex items-center justify-center w-10 h-10 rounded-xl border transition-colors cursor-pointer shrink-0',
        'bg-white hover:bg-slate-100 border-slate-200 text-amber-500 shadow-sm',
        'dark:bg-slate-800/70 dark:hover:bg-slate-800 dark:border-slate-700/70 dark:text-blue-300 dark:shadow-none',
        className
      )}
    >
      {isDark ? (
        <Moon className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Sun className="w-4 h-4" aria-hidden="true" />
      )}
    </button>
  );
}
