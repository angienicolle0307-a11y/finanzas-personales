import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot, User, Loader2, CheckCircle2, AlertCircle, Mic, Square, Image as ImageIcon, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Movement, BudgetSummary } from '../types';
import { MovementUpdatePayload } from './ExpenseDetail';

interface Attachment {
  mimeType: string;
  data: string; // base64
  name: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  isFunctionCall?: boolean;
}

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterExpense: (expense: Omit<Movement, 'id' | 'date' | 'type'> & { isoDate?: string }) => Promise<void> | void;
  onUpdateExpense: (expense: Movement, updates: MovementUpdatePayload) => Promise<void>;
  onDeleteExpense: (expense: Movement) => Promise<void>;
  expenses: Movement[];
  summary: BudgetSummary;
  userName: string;
}

function getCategoryIcon(category: string): string {
  const normalized = category.toLowerCase();
  if (normalized.includes('aliment') || normalized.includes('comida') || normalized.includes('restaur')) return 'Utensils';
  if (normalized.includes('transport') || normalized.includes('uber') || normalized.includes('bus') || normalized.includes('taxi')) return 'Bus';
  if (normalized.includes('servicio') || normalized.includes('luz') || normalized.includes('agua') || normalized.includes('internet')) return 'Zap';
  if (normalized.includes('ropa') || normalized.includes('compra')) return 'ShoppingBag';
  if (normalized.includes('entreten') || normalized.includes('cine')) return 'Film';
  return 'DollarSign';
}

export function AssistantDrawer({
  isOpen,
  onClose,
  onRegisterExpense,
  onUpdateExpense,
  onDeleteExpense,
  expenses,
  summary,
  userName,
}: AssistantDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy tu asistente financiero. Puedo registrar nuevos gastos (por texto, recibo o nota de voz) y también editar o borrar gastos existentes cuando me lo pidas.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setAttachments((prev) => [
          ...prev,
          {
            mimeType: file.type,
            data: base64,
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e: any) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          setAttachments((prev) => [
            ...prev,
            {
              mimeType: 'audio/webm',
              data: base64,
              name: 'nota_de_voz.webm',
            },
          ]);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'No pude acceder al micrófono. Por favor verifica los permisos.',
          isError: true,
        },
      ]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const userMessage = input.trim();
    const currentAttachments = [...attachments];

    // Build concise conversation history before appending current turn
    const apiHistory = messages
      .slice(1) // skip initial greeting
      .filter((m) => !m.isError && m.content.trim().length > 0)
      .slice(-10)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    setInput('');
    setAttachments([]);

    if (userMessage || currentAttachments.length > 0) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content:
            userMessage ||
            (currentAttachments.length > 0 ? `[Archivo: ${currentAttachments[0].name}]` : ''),
        },
      ]);
    }

    setIsLoading(true);

    try {
      const expenseOnlyList = expenses
        .filter((e) => e.type === 'EXPENSE')
        .slice(0, 50)
        .map((e) => ({
          id: e.id,
          amount: e.amount,
          category: e.category,
          description: e.description,
          date: e.date,
          isoDate: e.isoDate,
        }));

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          attachments: currentAttachments,
          history: apiHistory,
          context: {
            userName: userName || 'Usuario',
            availableBalance: summary.availableBalance,
            currentDate: new Date().toISOString().split('T')[0],
            expenses: expenseOnlyList,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Lo siento, hubo un error general. Intenta de nuevo.';
        if (data.status === 503) {
          errorMessage =
            'El asistente está muy solicitado en este momento. Por favor, intenta de nuevo en un minuto.';
        } else if (data.status === 429) {
          errorMessage =
            'He alcanzado mi límite de mensajes por ahora. Intenta de nuevo más tarde.';
        } else {
          errorMessage = data.error || errorMessage;
        }
        setMessages((prev) => [...prev, { role: 'assistant', content: errorMessage, isError: true }]);
        return;
      }

      const functionCalls = Array.isArray(data.functionCalls) ? data.functionCalls : [];
      if (data.text && data.text.trim()) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
      } else if (functionCalls.length === 0) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'He procesado tu solicitud.' },
        ]);
      }

      for (const fc of functionCalls) {
        if (fc.name === 'registerExpense') {
          const { amount, date, description, category } = fc.args || {};
          const parsedAmount = Number(amount);
          const safeCategory = String(category || 'Otro');
          const safeDescription = String(description || safeCategory);
          const validIsoDate =
            typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;

          if (!isNaN(parsedAmount) && parsedAmount > 0) {
            await onRegisterExpense({
              amount: parsedAmount,
              description: safeDescription,
              category: safeCategory,
              icon: getCategoryIcon(safeCategory),
              isoDate: validIsoDate,
            });
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: `Gasto registrado: $${parsedAmount.toLocaleString('es-CO')} en ${safeCategory} (${safeDescription}).`,
                isFunctionCall: true,
              },
            ]);
          }
        } else if (fc.name === 'editExpense') {
          const { expenseId, amount, date, description, category } = fc.args || {};
          const target = expenses.find(
            (e) => e.id === String(expenseId) && e.type === 'EXPENSE'
          );

          if (!target) {
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: 'No encontré ese gasto en tu historial para editarlo.',
                isError: true,
              },
            ]);
            continue;
          }

          const nextAmount =
            amount !== undefined && !isNaN(Number(amount)) && Number(amount) > 0
              ? Number(amount)
              : target.amount;
          const nextCategory =
            typeof category === 'string' && category.trim()
              ? category.trim()
              : target.category;
          const nextDescription =
            typeof description === 'string' && description.trim()
              ? description.trim()
              : target.description;
          const nextIsoDate =
            typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
              ? date
              : target.isoDate || new Date().toISOString().split('T')[0];

          await onUpdateExpense(target, {
            amount: nextAmount,
            category: nextCategory,
            description: nextDescription,
            icon:
              nextCategory !== target.category
                ? getCategoryIcon(nextCategory)
                : target.icon,
            isoDate: nextIsoDate,
          });

          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `Gasto actualizado: ${nextDescription} · $${nextAmount.toLocaleString('es-CO')} (${nextCategory}).`,
              isFunctionCall: true,
            },
          ]);
        } else if (fc.name === 'deleteExpense') {
          const { expenseId } = fc.args || {};
          const target = expenses.find(
            (e) => e.id === String(expenseId) && e.type === 'EXPENSE'
          );

          if (!target) {
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: 'No encontré ese gasto en tu historial para eliminarlo.',
                isError: true,
              },
            ]);
            continue;
          }

          await onDeleteExpense(target);

          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `Gasto eliminado: ${target.description} ($${target.amount.toLocaleString('es-CO')}).`,
              isFunctionCall: true,
            },
          ]);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Ocurrió un error al procesar la operación. Intenta de nuevo.',
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-600/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Asistente Inteligente</h3>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">
                    Gestiona tus gastos
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      msg.role === 'user'
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        : 'bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400'
                    )}
                  >
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : msg.isError
                          ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-tl-none'
                          : msg.isFunctionCall
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-tl-none flex items-center gap-2'
                            : 'bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-800/50'
                    )}
                  >
                    {msg.isFunctionCall && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    {msg.isError && (
                      <AlertCircle className="w-4 h-4 shrink-0 inline-block mr-2 align-middle" />
                    )}
                    <span>{msg.content}</span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-600/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 border border-slate-200 dark:border-slate-800/50">
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                        className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                        className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-medium italic">
                      Analizando tu solicitud...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/50 backdrop-blur-md">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {attachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
                    >
                      <span className="text-[10px] text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                        {att.name}
                      </span>
                      <button
                        onClick={() =>
                          setAttachments((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="text-slate-500 hover:text-rose-500 dark:hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-3">
                <div className="relative flex items-center gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Registra, edita o borra un gasto..."
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || (!input.trim() && attachments.length === 0)}
                    className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Imagen
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />

                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl transition-all border text-xs font-semibold',
                      isRecording
                        ? 'bg-rose-500/10 border-rose-500/50 text-rose-600 dark:text-rose-400 animate-pulse'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    )}
                  >
                    {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isRecording ? 'Detener' : 'Voz'}
                  </button>
                </div>
              </div>
              <p className="mt-4 text-[10px] text-center text-slate-500 font-medium">
                Soporta creación, edición y eliminación por texto, imagen o voz
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
