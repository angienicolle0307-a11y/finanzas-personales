import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const MODELS = [
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite'
];

const registerExpenseTool: FunctionDeclaration = {
  name: "registerExpense",
  description: "Registra un nuevo gasto en el presupuesto.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: {
        type: Type.NUMBER,
        description: "El monto del gasto en pesos colombianos (COP).",
      },
      date: {
        type: Type.STRING,
        description: "La fecha del gasto en formato YYYY-MM-DD.",
      },
      description: {
        type: Type.STRING,
        description: "Una breve descripción de lo que se compró o pagó.",
      },
      category: {
        type: Type.STRING,
        description: "La categoría del gasto (Alimentación, Transporte, Servicios públicos, Ropa y compras, Entretenimiento, Otro).",
      },
    },
    required: ["amount", "date", "description", "category"],
  },
};

const editExpenseTool: FunctionDeclaration = {
  name: "editExpense",
  description: "Edita uno o varios campos (monto, fecha, descripción o categoría) de un gasto existente usando su ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      expenseId: {
        type: Type.STRING,
        description: "El ID exacto del gasto existente a modificar, tomado de la lista de gastos del usuario.",
      },
      amount: {
        type: Type.NUMBER,
        description: "Nuevo monto del gasto en pesos colombianos (COP), si cambia.",
      },
      date: {
        type: Type.STRING,
        description: "Nueva fecha del gasto en formato YYYY-MM-DD, si cambia.",
      },
      description: {
        type: Type.STRING,
        description: "Nueva descripción del gasto, si cambia.",
      },
      category: {
        type: Type.STRING,
        description: "Nueva categoría del gasto (Alimentación, Transporte, Servicios públicos, Ropa y compras, Entretenimiento, Otro), si cambia.",
      },
    },
    required: ["expenseId"],
  },
};

const deleteExpenseTool: FunctionDeclaration = {
  name: "deleteExpense",
  description: "Elimina permanentemente un gasto existente usando su ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      expenseId: {
        type: Type.STRING,
        description: "El ID exacto del gasto existente a eliminar, tomado de la lista de gastos del usuario.",
      },
    },
    required: ["expenseId"],
  },
};

app.post("/api/assistant", async (req, res) => {
  const { message, history, attachments, context } = req.body;

  if (!message && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: "Message or attachments are required" });
  }

  const { userName, availableBalance, currentDate, expenses } = context || {};

  const expenseListText = Array.isArray(expenses) && expenses.length > 0
    ? expenses
        .slice(0, 50)
        .map(
          (e: any) =>
            `- [ID: ${e.id}] Fecha: ${e.isoDate || e.date} | Categoría: ${e.category} | Descripción: "${e.description}" | Monto: $${Number(e.amount).toLocaleString('es-CO')} COP`
        )
        .join("\n")
    : "No hay gastos registrados actualmente.";

  let lastError: any = null;

  for (const model of MODELS) {
    try {
      const parts: any[] = [];
      if (message) parts.push({ text: message });
      
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          parts.push({
            inlineData: {
              mimeType: attachment.mimeType,
              data: attachment.data
            }
          });
        }
      }

      const systemInstruction = `Eres un asistente experto en finanzas personales para una aplicación de presupuesto. Eres breve, amable y profesional.
Tu nombre es el asistente de Mi Presupuesto.
El usuario se llama ${userName || 'Usuario'}.
La fecha actual es ${currentDate || new Date().toISOString().split('T')[0]}.
El saldo disponible actual es $${availableBalance || 0} COP.

GASTOS ACTUALES DEL USUARIO (usa estos IDs exactos para editar o eliminar):
${expenseListText}

Tu objetivo es ayudar al usuario a registrar, consultar, editar y eliminar gastos mediante texto, imagen (tickets, recibos) o audio (notas de voz).

PARA IMÁGENES:
- Extrae monto, fecha y descripción de tickets o recibos.
- Si un dato no se ve claro o está dudoso, pregunta antes de guardar.
- NO inventes datos. Si la imagen es borrosa o faltan datos, solicita aclaración.
- Si la imagen no tiene que ver con gastos o finanzas, indica que no puedes procesarla.

PARA AUDIO:
- Transcribe el audio y extrae monto, fecha y descripción.
- Si falta algún dato, pregunta antes de guardar.
- NO inventes datos. Si falta información, solicita aclaración.
- Si el audio no tiene que ver con gastos o finanzas, indica que no puedes procesarlo.

PARA EDITAR O ELIMINAR GASTOS EXISTENTES:
- Busca el gasto correspondiente en la lista de GASTOS ACTUALES DEL USUARIO.
- Si el usuario identifica claramente el gasto (por ejemplo por descripción, categoría, monto o fecha), usa 'editExpense' (con el 'expenseId' exacto y solo los campos a cambiar) o 'deleteExpense' (con el 'expenseId' exacto).
- Si hay varios gastos parecidos y no queda claro cuál modificar o borrar, lista brevemente las opciones (descripción, monto y fecha) y pregunta al usuario cuál desea editar o eliminar antes de ejecutar la acción.
- Si no encuentras ningún gasto que coincida, infórmalo amablemente sin inventar IDs.

REGLAS GENERALES:
- Usa SIEMPRE 'registerExpense' para registrar gastos nuevos confirmados, 'editExpense' para modificar gastos existentes, y 'deleteExpense' para borrar gastos existentes.
- Al finalizar una acción exitosa, dirígete al usuario por su nombre (ej: '¡Listo, ${userName || 'Usuario'}!').
- Para consultas de compras, compara el gasto solicitado con el saldo disponible ($${availableBalance || 0} COP).
- Mantén tus respuestas breves y amables.`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: [
          ...(history || []),
          { role: 'user', parts }
        ],
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [registerExpenseTool, editExpenseTool, deleteExpenseTool] }],
        },
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error("No candidates in response");
      }

      const text = response.text;
      const functionCalls = response.functionCalls;

      return res.json({
        text,
        functionCalls,
        modelUsed: model
      });

    } catch (error: any) {
      lastError = error;
      const status = error.status || (error.response && error.response.status);
      
      if ([400, 401, 403].includes(status)) {
        return res.status(status).json({
          error: error.message || "API configuration or permission error",
          status
        });
      }

      if ([429, 503, 404].includes(status)) {
        console.warn(`Model ${model} failed with status ${status}. Trying next...`);
        continue;
      } else {
        console.warn(`Model ${model} failed with error: ${error.message}. Trying next...`);
        continue;
      }
    }
  }

  const status = lastError?.status || 500;
  const messageError = lastError?.message || "All models failed to respond";
  
  res.status(status).json({ 
    error: messageError,
    status: status
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
