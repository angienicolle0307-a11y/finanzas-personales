import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Label } from 'recharts';
import { formatCurrency } from '../lib/utils';
import { Movement } from '../types';
import { useTheme } from '../lib/theme';

interface ExpenseChartProps {
  expenses: Movement[];
}

export function ExpenseChart({ expenses }: ExpenseChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const currentDay = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const monthPrefix = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;
  const currentMonthName = now.toLocaleDateString('es-CO', { month: 'long' });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  const data = useMemo(() => {
    const totalsByDay = new Map<number, number>();
    for (let d = 1; d <= daysInMonth; d++) {
      totalsByDay.set(d, 0);
    }

    for (const item of expenses) {
      if (item.type !== 'EXPENSE') continue;
      let day: number | undefined;

      if (item.isoDate && item.isoDate.startsWith(monthPrefix)) {
        const parsedDay = Number(item.isoDate.split('-')[2]);
        if (!isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= daysInMonth) {
          day = parsedDay;
        }
      } else if (!item.isoDate && item.dayOfMonth && item.dayOfMonth >= 1 && item.dayOfMonth <= daysInMonth) {
        day = item.dayOfMonth;
      }

      if (day !== undefined) {
        totalsByDay.set(day, (totalsByDay.get(day) || 0) + item.amount);
      }
    }

    return Array.from(totalsByDay.entries()).map(([day, amount]) => ({
      day,
      amount,
    }));
  }, [expenses, daysInMonth, monthPrefix]);

  return (
    <div className="h-[350px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={isDark ? '#334155' : '#cbd5e1'}
            opacity={isDark ? 0.3 : 0.6}
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
            dy={10}
          >
            <Label
              value="Día del Mes"
              offset={-20}
              position="insideBottom"
              style={{
                fill: isDark ? '#475569' : '#64748b',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            />
          </XAxis>
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
            tickFormatter={(value) => (value >= 1000 ? `$${Math.round(value / 1000)}k` : `$${value}`)}
          />
          <Tooltip
            cursor={{ fill: isDark ? '#334155' : '#e2e8f0', opacity: isDark ? 0.2 : 0.5 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl backdrop-blur-md">
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-[0.15em]">
                      {payload[0].payload.day} de {capitalizedMonth}, {currentYear}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Gasto:</span>
                      <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(payload[0].value as number)}
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={12}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.amount > 200000
                    ? '#6366f1'
                    : entry.amount > 100000
                      ? '#4f46e5'
                      : isDark
                        ? '#312e81'
                        : '#818cf8'
                }
                fillOpacity={entry.day === currentDay ? 1 : 0.8}
                className="transition-all duration-300 hover:fill-blue-400 cursor-pointer"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
