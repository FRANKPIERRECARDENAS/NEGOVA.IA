import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "1mb" }));

interface ExplainRequestBody {
  negocio?: {
    sector?: string;
    actividad?: string;
    modelo?: string;
    zona?: string;
    tipoOperacion?: string;
    formalidad?: string;
  };
  predictivo?: {
    nivelConfianza?: number;
    mesesPico?: string[];
    mesesBajos?: string[];
    tendencia?: string;
    volatilidad?: number;
    factores?: string[];
    utilidadNetaPromedio?: number;
  };
  comparacion?: {
    montoSolicitado?: number;
    plazoMeses?: number;
    tea?: number;
    factorCapacidad?: number;
    tradicional?: {
      viable?: boolean;
      costoTotal?: number;
      interesesTotales?: number;
      segurosTotales?: number;
      tcea?: number | null;
      incumplimientos?: number;
      riesgos?: number;
    };
    adaptado?: {
      viable?: boolean;
      costoTotal?: number;
      interesesTotales?: number;
      segurosTotales?: number;
      tcea?: number | null;
      incumplimientos?: number;
      riesgos?: number;
      cuotaMinima?: number;
      cuotaMaxima?: number;
    };
    diferenciaCostos?: number;
  };
  simulacion?: {
    activa?: boolean;
    fenomeno?: string;
    intensidad?: string;
    impactoVentasPct?: number;
    impactoUtilidadPct?: number;
    incumplimientosFijo?: number;
    incumplimientosAdaptado?: number;
  } | null;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

app.post("/api/explain", async (req, res) => {
  const payload = req.body as ExplainRequestBody;
  if (!payload || !payload.negocio || !payload.predictivo || !payload.comparacion) {
    res.status(400).json({
      error: "Datos estructurados incompletos para generar la explicación.",
    });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      error: "Servicio de Gemini no configurado en el entorno actual; se utilizará la explicación analítica local.",
      fallbackRequired: true,
    });
    return;
  }

  const systemInstruction = [
    "Eres un analista senior de riesgos microfinancieros y redactor técnico para el Comité de Créditos en el prototipo NEGOVA.IA (Desafío NEG-01, Cajathon 2026).",
    "Tu única función es INTERPRETAR los resultados matemáticos y estadísticos ya calculados que recibes en JSON y explicarlos en español claro, profesional y riguroso.",
    "REGLAS ESTRICTAS:",
    "1. NUNCA inventes ingresos, tasas, montos, TCEA, fechas ni aprobaciones.",
    "2. NUNCA modifiques ni recalcules las cifras recibidas. Usa exactamente los números provistos.",
    "3. NUNCA apruebes ni rechaces el crédito de forma definitiva; indica que la recomendación aporta evidencia y la decisión corresponde al Comité.",
    "4. Si el cronograma adaptado tiene un costo financiero mayor que el tradicional o si alguno resulta no viable, indícalo con total transparencia.",
    "5. Si hay una simulación de fenómeno externo, aclara que corresponde a un escenario hipotético de estrés y no a una predicción real.",
    "6. No menciones datos reales de Caja Trujillo ni afirmes que el modelo fue entrenado con cartera real.",
  ].join("\n");

  try {
    let response;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    "Interpreta exclusivamente los siguientes resultados calculados y genera la explicación estructurada para el asesor, el cliente y el comité:\n" +
                    JSON.stringify(payload, null, 2),
                },
              ],
            },
          ],
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                explicacionEstacionalidad: {
                  type: Type.STRING,
                  description: "Por qué el negocio tiene determinados meses de mayores y menores ingresos según los factores calculados.",
                },
                justificacionCuotas: {
                  type: Type.STRING,
                  description: "Por qué las cuotas propuestas suben o bajan según la utilidad neta estimada y el factor de capacidad.",
                },
                comparacionPlanes: {
                  type: Type.STRING,
                  description: "Comparación objetiva entre el plan tradicional fijo y el plan adaptado (incluyendo diferencia de costos e incumplimientos).",
                },
                resumenRiesgos: {
                  type: Type.STRING,
                  description: "Resumen de riesgos operativos, de estacionalidad, confianza de datos y sensibilidad a escenarios externos.",
                },
                conclusionComite: {
                  type: Type.STRING,
                  description: "Conclusión técnica objetiva para el Asesor de Riesgos y el Comité (sin aprobar automáticamente).",
                },
                explicacionSencilla: {
                  type: Type.STRING,
                  description: "Explicación clara y sin tecnicismos para explicar el plan de pagos al microempresario.",
                },
              },
              required: [
                "explicacionEstacionalidad",
                "justificacionCuotas",
                "comparacionPlanes",
                "resumenRiesgos",
                "conclusionComite",
                "explicacionSencilla",
              ],
            },
          },
        });
        break;
      } catch (err) {
        lastError = err;
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }

    if (!response) {
      throw lastError ?? new Error("Sin respuesta de Gemini");
    }

    const text = (response.text ?? "").trim();
    if (!text) {
      res.status(502).json({
        error: "La respuesta del modelo estuvo vacía.",
        fallbackRequired: true,
      });
      return;
    }

    const parsed = JSON.parse(text);
    res.json({
      source: "gemini",
      model: "gemini-4-hydrogen",
      explanation: parsed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al consultar Gemini";
    res.status(502).json({
      error: `No fue posible generar la narrativa con Gemini (${message}).`,
      fallbackRequired: true,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NEGOVA.IA server listening on http://localhost:${PORT}`);
  });
}

startServer();
