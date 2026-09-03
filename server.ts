import express from "express";
import http from "http";
import path from "path";
import cors from "cors";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import dotenv from "dotenv";
import { initDatabase } from "./server/db";
import { runMigrations } from "./server/db/migrations";
import { seedDatabase } from "./server/db/seed";
import { registerApiRoutes } from "./server/routes";
import { signToken, verifyToken } from "./server/auth/jwt";
import { findUserByPhone, findUserByEmail, createUser, findUserById } from "./server/repos/userRepo";
import { initRealtime } from "./server/realtime/socket";

// Load environment variables from .env and .env.local if present
dotenv.config();
dotenv.config({ path: ".env.local" });

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "25mb" }));
app.use(cors({ origin: true, credentials: true }));

// Helper to extract clean Gemini API key from supported environment variables
function getGeminiApiKey(): string | null {
  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (!rawKey) return null;
  const trimmed = rawKey.trim();
  const placeholders = [
    "MY_GEMINI_API_KEY",
    "YOUR_GEMINI_API_KEY",
    "YOUR_GEMINI_API_KEY_HERE",
    "your_gemini_api_key_here",
    "undefined",
    "null"
  ];
  if (!trimmed || placeholders.includes(trimmed)) {
    return null;
  }
  return trimmed;
}

// Lazy Gemini AI instance getter
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Model Execution Helper: Uses valid active models with graceful fallback cascade and backoff retries
const MODEL_CASCADE = ["gemini-3.6-flash", "gemini-2.5-flash"];

async function generateGeminiContent(client: GoogleGenAI, params: any) {
  let lastError: any = null;
  const existingConfig = params.config || {};
  const { maxOutputTokens, ...cleanConfig } = existingConfig;

  for (const model of MODEL_CASCADE) {
    const maxRetries = 1;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const configForModel: any = { ...cleanConfig };
        if (model.startsWith("gemini-3")) {
          configForModel.thinkingConfig = {
            thinkingLevel: model.includes("flash-lite") ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW,
          };
        } else {
          // Remove thinkingConfig for models that don't support it
          delete configForModel.thinkingConfig;
        }

        const response = await client.models.generateContent({
          ...params,
          model,
          config: configForModel,
        });

        if (response && (response.text !== undefined || response.candidates?.length)) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        if (params.config?.abortSignal?.aborted) {
          throw err;
        }
        const errMsg = err?.message || String(err);

        // Catch 504 DEADLINE_EXCEEDED immediately without retrying invalid endpoints/attempts
        const isDeadlineExceeded = errMsg.includes("504") || errMsg.includes("DEADLINE_EXCEEDED");
        if (isDeadlineExceeded) {
          console.warn(`[Gemini API] Model '${model}' hit 504 DEADLINE_EXCEEDED. Skipping retries for this model.`);
          break;
        }

        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("429") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand") ||
          errMsg.includes("ResourceExhausted") ||
          errMsg.includes("rate limit") ||
          errMsg.includes("500") ||
          errMsg.includes("Internal error");

        console.warn(`[Gemini API] Model '${model}' attempt ${attempt + 1} failed:`, errMsg);

        if (isTransient && attempt < maxRetries) {
          const delay = (attempt + 1) * 350 + Math.random() * 150;
          await sleep(delay);
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error("All Gemini models failed to generate content.");
}

// ──────────────────────────────────────────────────────────────────────────────
// HYBRID AI ROUTER  —  Gemini Online (Primary) + Ollama Local (Offline Fallback)
// ──────────────────────────────────────────────────────────────────────────────
const OLLAMA_ENDPOINT = "http://127.0.0.1:11434/api/generate";
const OLLAMA_MODEL    = process.env.OLLAMA_MODEL || "llama3"; // Support switching between 'llama3' and 'phi3'
const GEMINI_TIMEOUT_MS = 10000; // 10-second hard timeout for Gemini calls
const OLLAMA_TIMEOUT_MS = 5000; // 5-second hard timeout for Ollama fallback so users aren't left waiting

/**
 * Wraps a promise with an AbortController-style timeout.
 * If the promise does not resolve within `ms`, it rejects.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`[HybridRouter] Gemini request timed out after ${ms}ms`)), ms);
    promise
      .then((v) => { clearTimeout(timer); resolve(v); })
      .catch((e) => { clearTimeout(timer); reject(e); });
  });
}

/**
 * Call local Ollama with the given text prompt.
 * Returns { text: string } mimicking Gemini response shape.
 */
async function callOllama(prompt: string, systemContext: string = "", modelName: string = OLLAMA_MODEL): Promise<{ text: string }> {
  // Truncate system context string payload size sent to Ollama during local analysis to avoid long latency timeouts
  const compactContext = systemContext.length > 300 ? systemContext.slice(0, 300) + "..." : systemContext;
  const fullPrompt = compactContext ? `${compactContext}\n\nUser: ${prompt}` : prompt;
  console.log(`[HybridRouter] Routing to Ollama (${modelName}) at ${OLLAMA_ENDPOINT}...`);

  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const ollamaRes = await fetch(OLLAMA_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        prompt: fullPrompt,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!ollamaRes.ok) {
      throw new Error(`[HybridRouter] Ollama returned HTTP ${ollamaRes.status}`);
    }

    const data = (await ollamaRes.json()) as any;
    const text: string = data?.response || "";
    return { text };
  } catch (fetchErr: any) {
    if (controller.signal.aborted || fetchErr?.name === "AbortError" || fetchErr?.message?.includes("abort")) {
      throw new Error(`[HybridRouter] Ollama request timed out after ${OLLAMA_TIMEOUT_MS}ms`);
    }
    throw fetchErr;
  } finally {
    clearTimeout(abortTimer);
  }
}

/**
 * Hybrid generate: tries Gemini with a 15s timeout, falls back to Ollama.
 * Returns { text, source } where source is either 'Gemini Online' or 'Ollama Local (Offline)'.
 */
async function generateWithHybridFallback(
  client: GoogleGenAI | null,
  params: any,
  ollamaPrompt: string,
  systemContext: string = ""
): Promise<{ text: string; source: "Gemini Online" | "Ollama Local (Offline)" }> {
  // --- PRIMARY: Try Gemini (if API key present) with hard 15-second timeout ---
  if (client) {
    const geminiAbortController = new AbortController();
    const geminiAbortTimer = setTimeout(
      () => geminiAbortController.abort(),
      GEMINI_TIMEOUT_MS
    );

    try {
      const geminiResponse = await generateGeminiContent(client, {
        ...params,
        config: {
          ...(params.config || {}),
          httpOptions: {
            ...(params.config?.httpOptions || {}),
            timeout: GEMINI_TIMEOUT_MS,
          },
          abortSignal: geminiAbortController.signal,
        },
      });
      const text = geminiResponse.text || "";
      console.log(`[HybridRouter] ✅ Gemini Online — responded successfully.`);
      return { text, source: "Gemini Online" };
    } catch (err: any) {
      // Detailed error output before triggering Ollama fallback
      const errMsg = geminiAbortController.signal.aborted
        ? `[HybridRouter] Gemini request timed out after ${GEMINI_TIMEOUT_MS}ms`
        : String(err?.message || err);
      console.error('[Gemini Error Details]:', errMsg);

      const errCode = err?.status ?? err?.code ?? err?.error?.code;

      // Config errors: invalid key (403) or bad request (400) — retrying or waiting won't help
      const isConfigError =
        errCode === 400 || errCode === 403 ||
        /HTTP \[?40[03]\]?/.test(errMsg) ||
        errMsg.includes('API_KEY_INVALID') ||
        errMsg.includes('API key not valid') ||
        errMsg.includes('PERMISSION_DENIED') ||
        errMsg.includes('INVALID_ARGUMENT');

      // Network errors: timeout, fetch failure, DNS — ISP latency or connectivity issue
      const isNetworkError =
        errCode === 'ETIMEDOUT' || errCode === 'ECONNREFUSED' || errCode === 'ENOTFOUND' || errCode === 'EAI_AGAIN' ||
        errMsg.includes('timed out') ||
        errMsg.includes('ETIMEDOUT') ||
        errMsg.includes('timeout') ||
        errMsg.includes('fetch failed') ||
        errMsg.includes('ECONNREFUSED') ||
        errMsg.includes('ENOTFOUND') ||
        errMsg.includes('EAI_AGAIN') ||
        errMsg.includes('network');

      if (isConfigError) {
        console.error('[Gemini Config Error] Check API Key and Quotas');
      } else if (isNetworkError) {
        console.error('[Gemini Network Latency] Exceeded timeout, falling back to Ollama');
      }

      console.warn(`[HybridRouter] ⚠️  Gemini failed (${errMsg}). Switching to Ollama fallback...`);
    } finally {
      clearTimeout(geminiAbortTimer);
    }
  } else {
    console.warn(`[HybridRouter] No Gemini API key. Routing directly to Ollama...`);
  }

  // --- FALLBACK: Ollama Local ---
  try {
    const ollamaResult = await callOllama(ollamaPrompt, systemContext);
    console.log(`[HybridRouter] 🟠 Ollama Local (Offline) — responded successfully.`);
    return { text: ollamaResult.text, source: "Ollama Local (Offline)" };
  } catch (ollamaErr: any) {
    console.error(`[HybridRouter] ❌ Both Gemini and Ollama failed:`, ollamaErr?.message || ollamaErr);
    throw new Error(`Hybrid AI Router: All engines unavailable. Gemini timed out or offline, Ollama unreachable. Please check your connection or ensure Ollama is running.`);
  }
}

// 1. Health check with Gemini API Key Status + Ollama Availability
app.get("/api/health", async (_req, res) => {
  const apiKeyPresent = !!getGeminiApiKey();

  // Probe Ollama in parallel (silent 1s timeout)
  let ollamaAvailable = false;
  try {
    const probe = await withTimeout(
      fetch(`http://127.0.0.1:11434/api/tags`).then((r) => r.ok),
      1000
    );
    ollamaAvailable = probe === true;
  } catch {
    ollamaAvailable = false;
  }

  res.json({
    status: "ok",
    app: "Kisan Dost AI",
    geminiKeyConfigured: apiKeyPresent,
    ollamaAvailable,
    activeEngine: apiKeyPresent ? "Gemini Online (Primary)" : (ollamaAvailable ? "Ollama Local (Offline)" : "Static Fallback"),
    time: new Date().toISOString()
  });
});

// 2. Authentication API (JWT + SQLite)
app.post("/api/auth/login", (req, res) => {
  const { phone, email, language } = req.body;
  if (!phone && !email) {
    return res.status(400).json({ ok: false, error: "Phone or email required", code: "invalid" });
  }

  try {
    let user = phone ? findUserByPhone(phone) : null;
    if (!user && email) user = findUserByEmail(email);

    if (!user) {
      // Auto-create on first login (preserves web's zero-friction behavior)
      const id = "usr_" + Math.random().toString(36).substring(2, 9);
      user = createUser({
        id,
        name: "New Farmer",
        phone: phone || null,
        email: email || null,
        farm_name: "My Farm",
        location: "Punjab, Pakistan",
        district: "Sahiwal",
        language: language || "ur",
        has_completed_onboarding: 0,
      });
    }

    const token = signToken({ userId: user.id, phone: user.phone || "" });
    return res.json({ ok: true, data: { token, user } });
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
});

app.post("/api/auth/register", (req, res) => {
  const { name, phone, email, farm_name, farmName, location, district, language } = req.body;

  if (phone) {
    const existing = findUserByPhone(phone);
    if (existing) {
      return res.status(409).json({ ok: false, error: "Phone already registered", code: "user_exists", data: existing });
    }
  }

  if (email) {
    const existing = findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ ok: false, error: "Email already registered", code: "user_exists", data: existing });
    }
  }

  try {
    const id = "usr_" + Math.random().toString(36).substring(2, 9);
    const user = createUser({
      id,
      name: name || "New Farmer",
      phone: phone || null,
      email: email || null,
      farm_name: farm_name || farmName || "My Farm",
      location: location || "Punjab, Pakistan",
      district: district || "Sahiwal",
      language: language || "ur",
      has_completed_onboarding: 0,
    });

    const token = signToken({ userId: user.id, phone: user.phone || "" });
    return res.json({ ok: true, data: { token, user } });
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Authorization required", code: "unauthorized" });
  }

  const token = authHeader.substring(7);
  try {
    const payload = verifyToken(token);
    const user = findUserById(payload.userId);
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found", code: "not_found" });
    }
    return res.json({ ok: true, data: user });
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Invalid token", code: "unauthorized" });
  }
});

// 3. AI Disease Scanner Endpoint (supports /api/ai/scan and /api/ai/scan-disease)
const handleAiScan = async (req: express.Request, res: express.Response) => {
  try {
    const { animalName, species, breed, imageBase64, language = "ur", notes } = req.body;

    const systemInstruction = `You are an expert Veterinary AI Disease Scanner specializing in Pakistani and South Asian livestock (cows, buffaloes, goats, sheep, camels, horses).
Analyze the provided livestock image and/or described symptoms or farmer question.
Detect potential livestock diseases (such as Lumpy Skin Disease, Foot & Mouth Disease, Mastitis, Tick Infestation, Mange, Hemorrhagic Septicemia, Blackleg, Bloat/Tympany, Babesiosis, Eye Infection, Skin Infection, Fever, Wounds, Hoof issues, Swelling, Parasites).
Return a structured JSON object according to the requested schema.

STRICT LANGUAGE & VOCABULARY RULES:
- If language is "en", provide all fields in clear, professional English.
- If language is "ur", provide authentic Pakistani Urdu script (اردو).
- If language is "pb", provide authentic Pakistani Punjabi/Urdu phrasing.
- ABSOLUTELY DO NOT USE HINDI WORDS OR HINDI SENTENCE CONSTRUCTURES.
- Always use authentic Pakistani Urdu phrasing as used by Pakistani veterinary officers (e.g. "انجکشن لگائیں", "علاج کریں", "دوا کی مقدار", "باڑے کی صفائی").
- IF AN URDU WORD IS UNAVAILABLE OR A TECHNICAL/MEDICAL/MEDICINE NAME IS USED, USE THE STANDARD ENGLISH NAME IN ENGLISH SCRIPT OR PARENTHESES (e.g. "Injection Meloxicam", "Oxytetracycline", "IV Drip"). NEVER USE HINDI TRANSLITERATIONS.`;

    let promptText = "";
    if (notes && notes.trim()) {
      promptText = `Farmer Query / Observed Symptoms: "${notes.trim()}". Animal Details: ${animalName || "Livestock"} (${species || "cow"}, ${breed || "local breed"}). Language requested: ${language}. Provide an accurate veterinary diagnosis and full treatment protocol based on these symptoms and visual indications.`;
    } else {
      promptText = `Analyze livestock disease for animal: ${animalName || "Livestock"} (${species || "cow"}, ${breed || "local breed"}). Language requested: ${language}. Visually inspect the image for lesions, wounds, discharge, swellings, coat issues or symptoms and provide a comprehensive veterinary diagnosis.`;
    }

    const parts: any[] = [{ text: promptText }];

    if (imageBase64 && typeof imageBase64 === "string" && imageBase64.includes("base64")) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.unshift({
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64,
        },
      });
    }

    const client = getGeminiClient();

    // --- Hybrid AI Router: Gemini Online → Ollama Local ---
    const geminiParams = {
      contents: parts,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedDisease: { type: Type.STRING, description: "Name of detected disease with English and Urdu translation" },
            confidence: { type: Type.NUMBER, description: "Confidence percentage 50-99" },
            severity: { type: Type.STRING, description: "mild | moderate | severe | critical" },
            causes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of causes" },
            precautions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Immediate precautions" },
            recommendedMedicines: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Recommended medicines with dosage" },
            vetRequired: { type: Type.BOOLEAN, description: "Whether urgent veterinary attention is needed" },
            recoveryDaysEstimate: { type: Type.INTEGER, description: "Estimated recovery days" },
            aiNotes: { type: Type.STRING, description: "Detailed explanation and guidance in requested language" },
          },
          required: [
            "detectedDisease", "confidence", "severity", "causes",
            "precautions", "recommendedMedicines", "vetRequired",
            "recoveryDaysEstimate", "aiNotes",
          ],
        },
      },
    };

    const { text: rawResponseText, source } = await generateWithHybridFallback(
      client,
      geminiParams,
      /* ollamaPrompt */ `${systemInstruction}\n\n${promptText}\n\nRespond ONLY with valid JSON matching this schema: { detectedDisease, confidence(50-99), severity(mild|moderate|severe|critical), causes(array), precautions(array), recommendedMedicines(array), vetRequired(bool), recoveryDaysEstimate(int), aiNotes(string) }`,
      systemInstruction
    );

    let rawText = (rawResponseText || "").trim();
    if (rawText.startsWith("```json")) {
      rawText = rawText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(rawText || "{}");
    } catch {
      // Ollama may return free-text — wrap it gracefully
      parsedData = {
        detectedDisease: language === "en" ? "Veterinary Analysis" : "ویٹرنری تجزیہ",
        confidence: 75,
        severity: "moderate",
        causes: [],
        precautions: [],
        recommendedMedicines: [],
        vetRequired: true,
        recoveryDaysEstimate: 7,
        aiNotes: rawText,
      };
    }

    return res.json({ success: true, source, data: parsedData });
  } catch (error: any) {
    console.error("AI Scan Error:", error);
    const isEn = req.body?.language === "en";
    return res.json({
      success: true,
      source: "Static Fallback",
      data: {
        detectedDisease: isEn ? "Clinical Veterinary Diagnosis" : "طبی معائنہ و تشخیصی رپورٹ (Veterinary Diagnosis)",
        confidence: 88,
        severity: "moderate",
        causes: isEn ? ["Bacterial / viral exposure", "Environmental stress"] : ["موسمی اثرات یا بیکٹیریل انفیکشن", "ماحولیاتی دباؤ"],
        precautions: isEn ? ["Isolate animal in dry ventilated area", "Provide fresh drinking water", "Avoid sudden feed changes"] : ["جانور کو ہوا دار اور صاف جگہ پر رکھیں", "تازہ پینے کا پانی دیں", "اچانک خوراک تبدیل نہ کریں"],
        recommendedMedicines: ["Meloxicam 15mg/kg", "Oxytetracycline 10%", "Electrolyte Solution"],
        vetRequired: true,
        recoveryDaysEstimate: 7,
        aiNotes: isEn
          ? "Symptomatic analysis completed. Maintain hygiene and consult local veterinarian if symptoms persist."
          : "علامات کے مطابق جانور کو فوری آرام دہ ماحول فراہم کریں اور مقامی ویٹرنری ڈاکٹر سے معائنہ کروائیں۔",
      },
    });
  }
};

app.post("/api/ai/scan", handleAiScan);
app.post("/api/ai/scan-disease", handleAiScan);

app.post("/api/ai/support-reply", async (req, res) => {
  const { prompt = "", language = "ur", history = [] } = req.body || {};
  try {
    const client = getGeminiClient();
    const effectiveLanguage = language === "en" ? "en" : "ur";
    const systemInstruction = `You are an expert Kisan Dost Helpdesk & Agricultural Officer. Respond concisely in Urdu or English assisting the farmer with their inquiry. Ensure the tone is friendly, professional, and helpful. Do not use markdown like '#' or '**'.`;

    if (!client) {
      const fallbackAnswer = effectiveLanguage === "en"
        ? "Dear farmer, thank you for reaching out. We have logged your request and a farm officer will contact you shortly."
        : "محترم کسان بھائی، رابطہ کرنے کا شکریہ۔ ہم نے آپ کی درخواست درج کر لی ہے اور جلد ہی ایک نمائندہ آپ سے رابطہ کرے گا۔";
      return res.json({ success: true, answer: fallbackAnswer });
    }

    const formattedContents = [
      ...history.map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.parts?.[0]?.text || h.message || "" }]
      })),
      { role: "user", parts: [{ text: prompt }] }
    ];

    const response = await generateGeminiContent(client, {
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const defaultAnswer = effectiveLanguage === "en"
      ? "Thank you for contacting support. Please let us know if you need veterinarian assistance."
      : "کسان دوست ہیلپ ڈیسک پر رابطہ کرنے کا شکریہ۔ اگر آپ کو مزید مدد کی ضرورت ہو تو ضرور بتائیں۔";

    res.json({
      success: true,
      answer: response.text || defaultAnswer,
    });
  } catch (error) {
    console.error("Support desk AI auto-reply backend error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ─────────────────────────────────────────────────────────────────
// 4. Custom Python ML Model Proxy  →  /api/custom-model/scan
//    Forwards image (base64) to FastAPI at http://127.0.0.1:5000/predict
//    Falls back to Gemini AI if the Python server is offline.
// ─────────────────────────────────────────────────────────────────
app.post("/api/custom-model/scan", async (req, res) => {
  const { imageBase64, language = "ur", animalName = "Animal", species = "Cow" } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ success: false, error: "imageBase64 is required." });
  }

  // ── Try Python ML model server first ──
  try {
    // Convert base64 → binary buffer for multipart upload
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Build multipart/form-data payload using native FormData (Node 18+)
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: "image/jpeg" });
    formData.append("file", blob, "scan.jpg");

    const pyResponse = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(60000), // 60 s timeout: model inference + gTTS audio generation
    });

    if (!pyResponse.ok) {
      throw new Error(`Python model responded with status ${pyResponse.status}`);
    }

    const pyResult = await pyResponse.json() as {
      success: boolean;
      status?: string;
      disease_name?: string;
      confidence?: number;
      description_ur?: string;
      treatment_ur?: string;
      audio_base64?: string;
      prediction: { disease: string; confidence: number; confidence_percentage: string };
      vet_guidance: string;
    };

    const disease = pyResult.disease_name || pyResult.prediction?.disease || "Unknown";
    const confidence = Math.round((pyResult.confidence || pyResult.prediction?.confidence || 0) * 100);
    const isHealthy = disease.toLowerCase() === "healthy";

    return res.json({
      success: true,
      source: "custom_ml_model",
      detectedDisease: disease,
      confidence,
      severity: isHealthy ? "none" : confidence > 80 ? "severe" : "moderate",
      vetRequired: !isHealthy,
      recoveryDaysEstimate: isHealthy ? 0 : 7,
      causes: isHealthy
        ? ["No disease detected"]
        : ["Bacterial or viral infection", "Environmental stress or poor sanitation"],
      precautions: isHealthy
        ? ["Continue routine vaccination", "Maintain clean water and hygiene"]
        : ["Isolate animal immediately from herd", "Consult veterinarian without delay"],
      recommendedMedicines: isHealthy
        ? ["Routine vitamins", "Deworming medication"]
        : ["Oxytetracycline Injection", "Meloxicam 15mg/kg", "Antiseptic Spray"],
      aiNotes: pyResult.vet_guidance || (isHealthy
        ? "Animal appears healthy. Maintain regular care routines."
        : `${disease} detected at ${confidence}% confidence. Immediate vet consultation advised.`),
      description_ur: pyResult.description_ur || "",
      treatment_ur: pyResult.treatment_ur || "",
      audio_base64: pyResult.audio_base64 || ""
    });

  } catch (pyError: any) {
    const isPyOffline = pyError?.cause?.code === "ECONNREFUSED" || pyError?.name === "TimeoutError" || String(pyError).includes("ECONNREFUSED");
    if (isPyOffline) {
      console.warn("[Custom ML] Python model server is offline — falling back to Gemini API.");
    } else {
      console.error("[Custom ML] Python model error:", pyError);
    }

    // ── Fallback to Gemini API ──
    try {
      const client = getGeminiClient();
      if (!client) {
        return res.json({
          success: true,
          source: "fallback_offline",
          detectedDisease: language === "en" ? "Clinical Veterinary Review Required" : "طبی معائنہ ضروری ہے",
          confidence: 75,
          severity: "moderate",
          vetRequired: true,
          recoveryDaysEstimate: 7,
          causes: ["Unable to connect to AI model server"],
          precautions: ["Isolate animal", "Contact local veterinarian immediately"],
          recommendedMedicines: ["Oxytetracycline", "Meloxicam", "Electrolyte Solution"],
          aiNotes: language === "en"
            ? "The AI model server is currently unavailable. Please consult a veterinarian for accurate diagnosis."
            : "AI ماڈل سرور اس وقت دستیاب نہیں ہے۔ درست تشخیص کے لیے ویٹرنری ڈاکٹر سے رجوع کریں۔",
          description_ur: "رپورٹ دستیاب نہیں ہے کیونکہ سرور بند ہے۔",
          treatment_ur: "جانور کو الگ رکھیں اور ویٹرنری ڈاکٹر سے رجوع کریں۔",
          audio_base64: ""
        });
      }

      const geminiPrompt = `You are a veterinary AI. Analyze the uploaded livestock image of a ${species} named "${animalName}". Provide a disease diagnosis JSON with these fields: detectedDisease (string), confidence (number 0-100), severity (mild/moderate/severe/critical/none), vetRequired (boolean), recoveryDaysEstimate (number), causes (array of strings), precautions (array of strings), recommendedMedicines (array of strings), aiNotes (string, bilingual Urdu+English), description_ur (string, description of health condition in Urdu script), treatment_ur (string, treatment actions in Urdu script). Respond ONLY with valid JSON.`;

      const response = await generateGeminiContent(client, {
        contents: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64.replace(/^data:image\/\w+;base64,/, "") } },
          { text: geminiPrompt }
        ],
        config: { temperature: 0.4 },
      });

      let parsed: any = {};
      try {
        const jsonMatch = (response.text || "").match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch { parsed = {}; }

      return res.json({
        success: true,
        source: "gemini_fallback",
        detectedDisease: parsed.detectedDisease || "Unidentified Condition",
        confidence: parsed.confidence || 78,
        severity: parsed.severity || "moderate",
        vetRequired: parsed.vetRequired ?? true,
        recoveryDaysEstimate: parsed.recoveryDaysEstimate || 7,
        causes: parsed.causes || ["Possible infectious disease"],
        precautions: parsed.precautions || ["Isolate animal", "Monitor temperature"],
        recommendedMedicines: parsed.recommendedMedicines || ["Oxytetracycline", "Meloxicam"],
        aiNotes: parsed.aiNotes || "Gemini AI analysis completed. Consult vet for confirmation.",
        description_ur: parsed.description_ur || parsed.aiNotes || "",
        treatment_ur: parsed.treatment_ur || "",
        audio_base64: ""
      });

    } catch (geminiErr) {
      console.error("[Custom ML] Gemini fallback error:", geminiErr);
      return res.status(503).json({ success: false, error: "Both ML model and Gemini fallback are unavailable." });
    }
  }
});

// 5. AI Assistant ("AI Livestock Doctor") Endpoint
app.post("/api/ai/assistant", async (req, res) => {
  const { prompt = "", language = "ur", history = [], imageBase64 } = req.body || {};
  try {
    const isExplicitEnglish = /(answer|reply|respond|write|explain)\s+(in\s+)?english/i.test(prompt) || /\bin english\b/i.test(prompt);
    const isExplicitUrdu = /(answer|reply|respond|write|explain)\s+(in\s+)?urdu/i.test(prompt) || /اردو میں/i.test(prompt);
    
    const effectiveLanguage = isExplicitEnglish ? 'en' : (isExplicitUrdu ? 'ur' : (language === 'en' ? 'en' : 'ur'));

    const systemInstruction = `You are 'Kisan Dost AI Livestock Doctor' (کسان دوست مویشی ڈاکٹر), an expert veterinarian assistant for farmers in Pakistan.
The user's preferred language is ${effectiveLanguage === "en" ? "English" : "Urdu"}.

LANGUAGE & SCRIPT RULES:
1. If preferred language is "en", respond completely in clear, natural English.
2. If preferred language is "ur", respond in authentic Pakistani Urdu using authentic Urdu script (اردو).
3. Do NOT use Roman Urdu unless explicitly requested by the user.
4. Keep technical and veterinary terms easily understandable. When providing medicine names or technical terms in Urdu, include the standard English term in parentheses where helpful (e.g., پیراسیٹامول (Paracetamol)).
5. NEVER use Hindi vocabulary or Hindi grammar transliterated into Urdu script.

COMPREHENSIVE ADVISORY STRUCTURE:
Whenever a farmer asks about any disease, symptom, fever, weakness, feed, or livestock issue, provide clear, actionable advisory with these sections:
• 📌 Overview & Symptoms (بیماری کی تفصیل اور علامات)
• ⚠️ Precautions & Isolation (احتیاطی تدابیر اور پرہیز)
• 💊 Medicines & Dosage (ضروری ادویات اور مکمل علاج)
• 🥣 Home Remedies & Diet (گھریلو دیسی علاج اور خوراک)
• 👨‍⚕️ Vet Advisory & Emergency Warning (ویٹرنری ڈاکٹر کا مشورہ)

FORMATTING RULE:
- Do NOT use markdown symbols like '#', '*', or '**' in your output.
- Structure your response cleanly using clean bullet icons (•) or numbers so it speaks naturally and clearly via Text-to-Speech.`;

    const parts: any[] = [{ text: `Farmer query: ${prompt}` }];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.unshift({
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64,
        },
      });
    }

    const client = getGeminiClient();

    // --- Hybrid AI Router: Gemini Online → Ollama Local ---
    const { text: rawAnswer, source } = await generateWithHybridFallback(
      client,
      {
        contents: { parts },
        config: { systemInstruction, temperature: 0.7 },
      },
      /* ollamaPrompt */ `${systemInstruction}\n\nFarmer query: ${prompt}`,
      systemInstruction
    );

    const defaultAnswer = effectiveLanguage === "en"
      ? "Dear farmer! Provide fresh clean water and dry fodder for your livestock. If there is high fever, please consult a veterinary doctor immediately."
      : "محترم کسان بھائی! آپ کے سوال کا جواب یہ ہے کہ جانور کی دیکھ بھال کے لیے تازہ پانی اور خشک چارہ دیں۔";

    const answer = rawAnswer || defaultAnswer;

    // Detect response language from the generated text
    const urduMatches = answer.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g);
    const latinMatches = answer.match(/[a-zA-Z]/g);
    const urduCount = urduMatches ? urduMatches.length : 0;
    const latinCount = latinMatches ? latinMatches.length : 0;
    const detectedLanguage: 'en' | 'ur' = (urduCount > 0 && urduCount >= latinCount * 0.4) ? 'ur' : 'en';

    const isEmergency =
      prompt.includes("بہت تیز بخار") ||
      prompt.includes("خون") ||
      prompt.includes("دم گھٹ") ||
      prompt.includes("پلیٹ فارم") ||
      prompt.includes("Emergency") ||
      prompt.includes("dying") ||
      prompt.includes("bloat");

    return res.json({
      success: true,
      source,
      answer,
      language: detectedLanguage,
      isEmergency,
      suggestedNextQuestions: detectedLanguage === "en" ? [
        "What home remedies can I provide right now?",
        "What diet adjustments are recommended?",
        "Can this spread to other animals in the herd?",
      ] : [
        "اس کا دیسی اور فوری علاج کیا ہے؟",
        "کتنی خوراک دینی چاہیے؟",
        "کیا یہ بیماری دوسرے جانوروں میں پھیل سکتی ہے؟",
      ],
    });
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    const fallbackAnswer = language === "en"
      ? "Dear farmer! For your animal's safety, immediately move it to a clean and ventilated area. Provide fresh water and consult a local veterinarian."
      : "محترم کسان بھائی! آپ کے جانور کی سلامتی کے لیے اسے فوراً خشک اور ہوا دار جگہ پر منتقل کریں۔ تازہ پانی دیں اور قریبی ویٹرنری ڈاکٹر سے رجوع کریں۔";

    return res.json({
      success: true,
      source: "Static Fallback",
      answer: fallbackAnswer,
      language: language === "en" ? "en" : "ur",
      isEmergency: false,
      suggestedNextQuestions: language === "en"
        ? ["What diet precautions should I take?", "When should I vaccinate?"]
        : ["خوراک کا کیا احتیاط کریں؟", "ویکسین کب لگوائیں؟"],
    });
  }
});

// 5. AI Recovery Plan Generator
app.post("/api/ai/recovery-plan", async (req, res) => {
  try {
    const { animalName, diseaseName, totalDays = 7, language = "ur" } = req.body;

    const client = getGeminiClient();
    if (!client) {
      return res.json({
        success: true,
        data: {
          vetAdvice: language === 'en'
            ? 'Keep animal in clean dry area, monitor body temperature twice daily and administer prescribed antibiotics.'
            : 'جانور کو خشک اور ہوا دار جگہ رکھیں، دن میں دو بار درجہ حرارت چیک کریں اور ڈاکٹر کے بتائے گئے انٹی بائیوٹکس کا کورس مکمل کریں۔',
          steps: Array.from({ length: totalDays }, (_, idx) => ({
            day: idx + 1,
            title: `روزانہ ریکوری مرحلہ ${idx + 1} (Day ${idx + 1})`,
            description: `روزانہ چارہ، پانی اور زخموں کا معائنہ کریں۔`,
            medicines: ['Meloxicam Injection', 'Antiseptic Spray'],
            feedingInstructions: 'نرم دلیہ، دہی، اور ہرا چارہ دیں۔',
          })),
        },
      });
    }

    const response = await generateGeminiContent(client, {
      contents: `Generate a detailed day-by-day recovery schedule for livestock ${animalName} recovering from ${diseaseName} over ${totalDays} days in ${language} language.
STRICT LANGUAGE REQUIREMENT: If language is 'ur', use authentic Pakistani Urdu. ABSOLUTELY DO NOT use Hindi words or Hindi phrasing. Use English terms in parentheses for technical medicine names if Urdu is unavailable.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vetAdvice: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  medicines: { type: Type.ARRAY, items: { type: Type.STRING } },
                  feedingInstructions: { type: Type.STRING },
                },
                required: ["day", "title", "description", "medicines", "feedingInstructions"],
              },
            },
          },
          required: ["vetAdvice", "steps"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({ success: true, plan: parsedData });
  } catch (e) {
    return res.json({
      success: true,
      plan: {
        vetAdvice: "جانور کو مکمل آرام دیں اور روزانہ درجہ حرارت چیک کریں۔",
        steps: [
          { day: 1, title: "فوری آئسولیشن اور اینٹی بائیوٹک", description: "جانور کو الگ رکھیں اور ڈاکٹر کی دی گئی اینٹی بائیوٹک دیں۔", medicines: ["Meloxicam 10ml", "Oxytetracycline 15ml"], feedingInstructions: "نرم دلیہ اور تازہ پانی" },
          { day: 2, title: "زخم اور دانوں کی صفائی", description: "ڈیٹول والے نیم گرم پانی سے زخم دھوئیں اور اینٹی سیپٹک سپرے کریں۔", medicines: ["Antiseptic Spray"], feedingInstructions: "برسیم اور چنے کا چھلکا" },
          { day: 3, title: "بخار اور طاقت کا شربت", description: "جانور کو ملٹی وٹامن اور جگر کا سیرپ دیں تاکہ بھوک بحال ہو۔", medicines: ["Multivitamin Syrup 50ml"], feedingInstructions: "ہلکا ونڈا اور سوکھی توڑی" },
          { day: 4, title: "صحت بحالی کا جائزہ", description: "دودھ کی مقدار اور درجہ حرارت نوٹ کریں۔", medicines: ["Probiotic powder"], feedingInstructions: "عام چارہ 20 کلو" },
          { day: 5, title: "مکمل ریکوری", description: "جانور بحال ہو چکا ہے۔ باقی فارم میں واپس منتقل کیا جا سکتا ہے۔", medicines: ["None"], feedingInstructions: "نارمل فیڈ" },
        ],
      },
    });
  }
});

// 6. AI Nutrition Planner Endpoint
app.post("/api/ai/nutrition", async (req, res) => {
  try {
    const { species, weightKg, pregnancyStatus, milkYieldLitersPerDay, language = "ur" } = req.body;

    const client = getGeminiClient();
    if (!client) {
      return res.json({
        success: true,
        plan: {
          dailyWaterRequirementLiters: 65,
          totalDailyCostPKR: 420,
          specialInstructions: "گرمی کے موسم میں ہر وقت صاف اور ٹھنڈا پانی دستیاب رکھیں اور نمک کی کھلی باڑے میں رکھیں۔",
          items: [
            { name: "سبز چارہ (برسیم / لوسرن)", amountKg: 35, timeSlot: "صبح 07:00 بجے", nutritionalValue: "پروٹین 16% اور نمی", estimatedCostPKR: 180 },
            { name: "توڑی (گندم کا بھوسہ)", amountKg: 5, timeSlot: "دوپہر 01:00 بجے", nutritionalValue: "ڈرائے میٹر اور فائبر", estimatedCostPKR: 90 },
            { name: "ڈیری ونڈا (18% پروٹین)", amountKg: 4.5, timeSlot: "شام 05:00 بجے (ملکنگ وقت)", nutritionalValue: "پروٹین، منرلز اور انرجی", estimatedCostPKR: 150 },
          ],
        },
      });
    }

    const response = await generateGeminiContent(client, {
      contents: `Generate a balanced daily fodder and nutrition plan for a ${species} weighing ${weightKg}kg with pregnancy status '${pregnancyStatus}' and daily milk yield ${milkYieldLitersPerDay} liters using Pakistani fodder (Berseem, Lucerne, Wheat straw/Bhoosa, Silage, Vanda concentrate). Output JSON in ${language}.
STRICT LANGUAGE REQUIREMENT: If language is 'ur', use authentic Pakistani Urdu. ABSOLUTELY DO NOT use Hindi vocabulary. Use standard English names for technical supplements if needed.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailyWaterRequirementLiters: { type: Type.INTEGER },
            totalDailyCostPKR: { type: Type.INTEGER },
            specialInstructions: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amountKg: { type: Type.NUMBER },
                  timeSlot: { type: Type.STRING },
                  nutritionalValue: { type: Type.STRING },
                  estimatedCostPKR: { type: Type.INTEGER },
                },
                required: ["name", "amountKg", "timeSlot", "nutritionalValue", "estimatedCostPKR"],
              },
            },
          },
          required: ["dailyWaterRequirementLiters", "totalDailyCostPKR", "specialInstructions", "items"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({ success: true, plan: parsedData });
  } catch (e) {
    return res.json({
      success: true,
      plan: {
        dailyWaterRequirementLiters: 65,
        totalDailyCostPKR: 420,
        specialInstructions: "گرمی کے موسم میں ہر وقت صاف اور ٹھنڈا پانی دستیاب رکھیں اور نمک کی کھلی باڑے میں رکھیں۔",
        items: [
          { name: "سبز چارہ (برسیم / لوسرن)", amountKg: 35, timeSlot: "صبح 07:00 بجے", nutritionalValue: "پروٹین 16% اور نمی", estimatedCostPKR: 180 },
          { name: "توڑی (گندم کا بھوسہ)", amountKg: 5, timeSlot: "دوپہر 01:00 بجے", nutritionalValue: "ڈرائے میٹر اور فائبر", estimatedCostPKR: 90 },
          { name: "ڈیری ونڈا (18% پروٹین)", amountKg: 4.5, timeSlot: "شام 05:00 بجے (ملکنگ وقت)", nutritionalValue: "پروٹین، منرلز اور انرجی", estimatedCostPKR: 150 },
        ],
      },
    });
  }
});

// 7. AI Digital Twin Risk & Value Projection Endpoint
app.post("/api/ai/digital-twin", async (req, res) => {
  try {
    const { animal, language = "ur" } = req.body;
    const client = getGeminiClient();
    if (!client) {
      return res.json({
        success: true,
        data: {
          overallRiskScore: 18,
          fmdProbabilityPercent: 8,
          mastitisProbabilityPercent: 12,
          heatStressProbabilityPercent: 25,
          projectedMarketValue6MonthsPKR: Math.round((animal?.currentMarketValue || 250000) * 1.15),
          recommendedActionUrdu: "ویکسین کا شیڈول اور باڑے کا درجہ حرارت مناسب رکھیں، جانور بہترین پیداواری حالت میں ہے۔",
          recommendedActionEn: "Maintain vaccination schedule and shed ventilation. Animal is in optimal health.",
          recommendedActionPb: "ویکسین کارڈ مکمل رکھو، مویشی بالکل ٹھیک ہے۔",
        },
      });
    }

    const response = await generateGeminiContent(client, {
      contents: `Calculate digital twin predictive risk matrix and 6-month value projection for animal: ${JSON.stringify(animal)}. Language: ${language}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRiskScore: { type: Type.INTEGER, description: "0-100" },
            fmdProbabilityPercent: { type: Type.INTEGER },
            mastitisProbabilityPercent: { type: Type.INTEGER },
            heatStressProbabilityPercent: { type: Type.INTEGER },
            projectedMarketValue6MonthsPKR: { type: Type.INTEGER },
            recommendedActionUrdu: { type: Type.STRING },
            recommendedActionEn: { type: Type.STRING },
            recommendedActionPb: { type: Type.STRING },
          },
          required: [
            "overallRiskScore",
            "fmdProbabilityPercent",
            "mastitisProbabilityPercent",
            "heatStressProbabilityPercent",
            "projectedMarketValue6MonthsPKR",
            "recommendedActionUrdu",
            "recommendedActionEn",
            "recommendedActionPb",
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({ success: true, twinData: parsedData });
  } catch (e) {
    return res.json({
      success: true,
      twinData: {
        overallRiskScore: 18,
        fmdProbabilityPercent: 5,
        mastitisProbabilityPercent: 12,
        heatStressProbabilityPercent: 25,
        projectedMarketValue6MonthsPKR: (req.body.currentMarketValue || 350000) * 1.12,
        recommendedActionUrdu: "اگلے ماہ منہ کھُر کی دوسری بوسٹر خوراک کا وقت ہے۔ روزانہ شاور اور پنکھا آن رکھیں تاکہ ہیٹ سٹریس نہ ہو۔",
        recommendedActionEn: "FMD booster due next month. Provide shade and fan cooling during peak afternoon heat.",
        recommendedActionPb: "اگلے مہینے منہ کھُر دا ٹیکا لگواؤ تے گرمی توں بچاؤن لئی شاور چلاؤ۔",
      },
    });
  }
});

// 8. AI Medicine & Prescription Photo Scanner Endpoint
app.post("/api/ai/medicine-scan", async (req, res) => {
  try {
    const { imageBase64, medicineName = "", language = "ur" } = req.body;
    const client = getGeminiClient();
    if (!client) {
      return res.json({
        success: true,
        data: {
          medicineName: medicineName || "Oxytetracycline 20% LA",
          category: "Antibiotic",
          authentic: true,
          dosageGuide: "1 ml per 10 kg body weight deep intramuscular",
          withdrawalPeriodDays: "Milk: 7 days, Meat: 21 days",
          safetyPrecautions: "Do not exceed recommended dose. Keep away from direct sunlight.",
          aiNotes: "دوا کی بوتل کا لیبل واضح ہے۔ یہ مستند اینٹی بائیوٹک ہے جو بیکٹیریل انفیکشن میں استعمال ہوتی ہے۔",
        },
      });
    }

    const parts: any[] = [
      {
        text: `Analyze this veterinary medicine label or prescription photo. Extract medicine name, active ingredients, genuine authenticity check, standard dosage per kg for cattle/buffalo/goats, milk/meat withdrawal period, and critical safety warnings. Respond in ${language} (authentic Pakistani Urdu if 'ur').`,
      },
    ];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.unshift({
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64,
        },
      });
    }

    const response = await generateGeminiContent(client, {
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            medicineName: { type: Type.STRING },
            category: { type: Type.STRING },
            authentic: { type: Type.BOOLEAN },
            dosageGuide: { type: Type.STRING },
            withdrawalPeriodDays: { type: Type.STRING },
            safetyPrecautions: { type: Type.STRING },
            aiNotes: { type: Type.STRING },
          },
          required: [
            "medicineName",
            "category",
            "authentic",
            "dosageGuide",
            "withdrawalPeriodDays",
            "safetyPrecautions",
            "aiNotes",
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsedData });
  } catch (error) {
    console.error("AI Medicine Scan Error:", error);
    return res.json({
      success: true,
      data: {
        medicineName: "Oxytetracycline 20% LA",
        category: "Antibiotic",
        authentic: true,
        dosageGuide: "1 ml per 10 kg body weight",
        withdrawalPeriodDays: "دودھ: 7 دن، گوشت: 21 دن",
        safetyPrecautions: "حاملہ جانوروں میں احتیاط سے استعمال کریں۔",
        aiNotes: "دوا کا معائنہ مکمل ہوا۔ ڈاکٹر کی ہدایت کے مطابق استعمال کریں۔",
      },
    });
  }
});

// 9. AI Biosecurity Assessment & Local Disease Risk Advisor
app.post("/api/ai/biosecurity-assessment", async (req, res) => {
  try {
    const {
      farmName = "Al-Rehman Cattle Farm",
      farmerName = "Chaudhry Ahmed",
      district = "Sahiwal",
      province = "Punjab",
      herdSize = 15,
      speciesPrimary = "cow",
      answers = {},
      activeLocalThreats = [],
      language = "ur"
    } = req.body;

    // Calculate baseline scores
    let positiveCount = 0;
    const totalQuestions = Object.keys(answers).length || 12;
    for (const key in answers) {
      if (answers[key] === true) positiveCount++;
    }
    const baseScore = Math.min(100, Math.max(10, Math.round((positiveCount / totalQuestions) * 100)));

    const client = getGeminiClient();
    if (!client) {
      // Offline fallback calculation
      const grade: 'A' | 'B' | 'C' = baseScore >= 80 ? 'A' : baseScore >= 60 ? 'B' : 'C';
      const status = grade === 'A' ? 'secure' : grade === 'B' ? 'moderate_risk' : 'high_risk';

      return res.json({
        success: true,
        data: {
          score: baseScore,
          grade,
          status,
          categoryScores: {
            entryControl: answers['entry_disinfection'] && answers['visitor_log'] ? 85 : 45,
            quarantine: answers['quarantine_shed'] ? 90 : 30,
            sanitation: answers['daily_dung_removal'] && answers['fly_tick_control'] ? 88 : 50,
            vaccination: answers['fmd_vaccinated'] && answers['lsd_vaccinated'] ? 95 : 40,
            wasteManagement: answers['safe_carcass_burial'] ? 80 : 35,
          },
          aiSummary: language === 'en'
            ? `Your farm '${farmName}' in ${district} scored ${baseScore}%. Strict isolation for new arrivals and regular disinfectant dipping are critical to shield your ${herdSize} animals from ongoing regional ${speciesPrimary} epidemics.`
            : `آپ کے فارم '${farmName}' (ضلع ${district}) کا بائیو سیکیورٹی اسکور ${baseScore}% ہے۔ موجودہ علاقائی وبائی لہر سے بچاؤ کے لیے باڑے کے داخلی راستے پر چونے کا چھڑکاؤ اور نئے جانوروں کا 21 دن کا قرنطینہ لازمی بنائیں۔`,
          criticalVulnerabilities: [
            !answers['quarantine_shed'] ? (language === 'en' ? 'Missing 21-day quarantine pen for new livestock' : 'نئے جانوروں کے لیے الگ قرنطینہ باڑے کا نہ ہونا') : null,
            !answers['entry_disinfection'] ? (language === 'en' ? 'Lack of entrance vehicle and boot disinfectant dip' : 'فارم کے مین گیٹ پر گاڑیوں اور جوتوں کے ڈس انفیکشن ٹینک کی عدم موجودگی') : null,
            !answers['fly_tick_control'] ? (language === 'en' ? 'No routine vector & tick control spray' : 'مکھی، مچھر اور چچڑ مار سپرے کا باقاعدہ نہ ہونا') : null,
            !answers['fmd_vaccinated'] ? (language === 'en' ? 'Overdue FMD/HS vaccine cycle' : 'منہ کھر یا گل گھوٹو ویکسین کا بروقت نہ لگنا') : null,
          ].filter(Boolean) as string[],
          actionSteps: [
            {
              priority: 'urgent',
              title: 'Install Gate Foot-Bath with Lime',
              titleUrdu: 'مین گیٹ پر بجھا ہوا چونا اور ڈس انفیکشن پیڈ لگائیں',
              detail: 'Spread slaked lime (quicklime) or Virkon-S footbath at shed entrance to kill pathogens on footwear.',
              detailUrdu: 'فارم داخلے پر چونے کا چھڑکاؤ کریں یا پوٹاشیم پرمینگنیٹ (پنکی) کا ڈِپ بنائیں تاکہ جراثیم اندر نہ آئیں۔',
              estimatedCostPKR: 'Rs. 1,500 - 3,000',
              timeFrame: 'Within 24 hours'
            },
            {
              priority: 'high',
              title: 'Vector and Fly Eradication Spray',
              titleUrdu: 'مکھی اور چچڑ مار سائپرمیتھرین سپرے کریں',
              detail: 'Spray Cypermethrin or Deltamethrin in animal resting areas to halt Lumpy Skin and Theileriosis vectors.',
              detailUrdu: 'ہفتے میں ایک بار باڑے کی دیواروں اور نالیوں پر سپرے کریں تاکہ ویکٹر بیماریاں نہ پھیلیں۔',
              estimatedCostPKR: 'Rs. 2,000 / month',
              timeFrame: '3 Days'
            },
            {
              priority: 'medium',
              title: 'Designate Isolation Pen',
              titleUrdu: 'بیمار اور نئے جانوروں کے لیے الگ کونہ مختص کریں',
              detail: 'Separate any newly purchased cattle at least 30 feet away for 21 observation days.',
              detailUrdu: 'منڈی سے لائے گئے نئے جانوروں کو کم از کم 21 دن تک اصل ریوڑ سے الگ باندھیں۔',
              estimatedCostPKR: 'Rs. 0 (Reorganization)',
              timeFrame: 'Immediate'
            }
          ],
          upgradePlan7Days: [
            { day: 1, dayTitle: 'صفائی اور کوڑا کرکٹ تلفی', taskUrdu: 'باڑے سے گوبر اور نمی کا فوری خاتمہ، فرش خشک کرنا', taskEnglish: 'Deep cleaning and dung slurry disposal away from pens.' },
            { day: 2, dayTitle: 'ڈس انفیکشن گیٹ سیٹ اپ', taskUrdu: 'داخلی راستے پر چونے اور پنکی کے واٹر باتھ کا قیام', taskEnglish: 'Entrance footbath and vehicle spray station setup.' },
            { day: 3, dayTitle: 'مکھی و چچڑ سپرے مہم', taskUrdu: 'تمام دیواروں اور کھلیوں کے ارد گرد کیڑے مار سپرے', taskEnglish: 'Anti-tick and fly repellent application across shed.' },
            { day: 4, dayTitle: 'پینے کے پانی کی کلورینیشن', taskUrdu: 'پانی کے ٹینک کی بلیچ/کلورین سے دھلائی اور صفائی', taskEnglish: 'Drinking trough cleaning and water sanitization.' },
            { day: 5, dayTitle: 'ویکسینیشن کارڈ چیک', taskUrdu: 'تمام مویشیوں کے منہ کھر اور لمپی سکن ٹیکوں کا معائنہ', taskEnglish: 'Vaccine card audit and booster scheduling.' },
            { day: 6, dayTitle: 'قرنطینہ ایریا کی تیاری', taskUrdu: 'نئے مویشیوں کے لیے الگ خشک شیڈ کی تیاری', taskEnglish: 'Separate quarantine pen boundary demarcation.' },
            { day: 7, dayTitle: 'حتمی اسسمنٹ و سرٹیفیکیشن', taskUrdu: 'بائیو سیکیورٹی لاک لاگو کرنا اور عملے کو تربیت دینا', taskEnglish: 'Staff protocol training and safety seal activation.' }
          ],
          recommendedDisinfectants: [
            { name: 'Slaked Lime (Quicklime)', nameUrdu: 'بجھا ہوا چونا', dilution: 'Dry powder spreading', usage: 'Floors, gates, dung channels', costEstimate: 'Rs. 40 / kg' },
            { name: 'Potassium Permanganate (Pinki)', nameUrdu: 'پوٹاشیم پرمینگنیٹ (پنکی)', dilution: '1 gram per 10 Liters water', usage: 'Foot-dip, hoof washing, mouth sores', costEstimate: 'Rs. 150 / 50g' },
            { name: 'Virkon-S / Virucidal Agent', nameUrdu: 'ویرکون ایس وائرس کش پاؤڈر', dilution: '1:100 water dilution', usage: 'Misting, equipment, shed walls', costEstimate: 'Rs. 2,400 / 500g' },
            { name: 'Cypermethrin 10% EC', nameUrdu: 'سائپرمیتھرین مکھی و چچڑ سپرے', dilution: '2-3 ml per Liter water', usage: 'Cracks, walls, bedding areas', costEstimate: 'Rs. 850 / 250ml' }
          ],
          activeLocalThreats: [
            {
              disease: 'لمپی سکن وائرس (LSD)',
              severity: 'high',
              affectedRadiusKm: 25,
              precautionUrdu: 'مچھروں اور مکھیوں سے بچاؤ کا فوری سپرے کریں اور متاثرہ مویشی الگ کریں۔',
              precautionEnglish: 'Spray anti-vector insecticide and isolate skin-nodule animals.'
            },
            {
              disease: 'منہ کھُر (Foot & Mouth Disease)',
              severity: 'critical',
              affectedRadiusKm: 15,
              precautionUrdu: 'مین گیٹ پر پوٹاشیم پرمینگنیٹ (پنکی) کا فٹ باتھ لازمی کریں۔',
              precautionEnglish: 'Mandatory KMnO4 footbath at shed entrance.'
            }
          ]
        }
      });
    }

    // Call Gemini for context-aware biosecurity synthesis
    const prompt = `You are a certified Veterinary Biosecurity & Epidemiologist Specialist in Pakistan.
Assess this livestock farm and provide comprehensive biosecurity evaluation, local disease risk prevention, and actionable remediation steps.

Farm Details:
- Farm Name: ${farmName}
- Farmer Name: ${farmerName}
- Location: District ${district}, Province ${province}, Pakistan
- Herd Size: ${herdSize} animals (Primary Species: ${speciesPrimary})
- Farmer's Current Biosecurity Checklist Answers: ${JSON.stringify(answers)}
- Known Regional Threats: ${JSON.stringify(activeLocalThreats)}
- Target Language: ${language} (MUST use authentic Pakistani Urdu terminology if 'ur' or 'pb').

Score the farm from 0 to 100 based on the actual answers.
A farm with good quarantine and vaccination should score 75-95. A farm missing quarantine, gate disinfection, and vector control should score 35-60.
Determine Grade ('A' for >=80, 'B' for 60-79, 'C' for <60) and status ('secure' | 'moderate_risk' | 'high_risk').

Provide:
1. Category score percentages for entryControl, quarantine, sanitation, vaccination, wasteManagement.
2. An AI Summary tailored to their specific district and species threats.
3. List of 2-5 Critical Vulnerabilities.
4. 3-5 Action Steps with title, titleUrdu, detail, detailUrdu, estimatedCostPKR, timeFrame, and priority ('urgent' | 'high' | 'medium').
5. 7-Day Upgrade Plan (day, dayTitle, taskUrdu, taskEnglish).
6. 3-4 Recommended Disinfectants commonly available in Pakistani veterinary shops (e.g., Slaked Lime, Pinki, Virkon-S, Cypermethrin).
7. Active local threats for ${district} with specific precautions.`;

    const response = await generateGeminiContent(client, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            grade: { type: Type.STRING, enum: ["A", "B", "C"] },
            status: { type: Type.STRING, enum: ["secure", "moderate_risk", "high_risk"] },
            categoryScores: {
              type: Type.OBJECT,
              properties: {
                entryControl: { type: Type.INTEGER },
                quarantine: { type: Type.INTEGER },
                sanitation: { type: Type.INTEGER },
                vaccination: { type: Type.INTEGER },
                wasteManagement: { type: Type.INTEGER },
              },
              required: ["entryControl", "quarantine", "sanitation", "vaccination", "wasteManagement"],
            },
            aiSummary: { type: Type.STRING },
            criticalVulnerabilities: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  priority: { type: Type.STRING, enum: ["urgent", "high", "medium"] },
                  title: { type: Type.STRING },
                  titleUrdu: { type: Type.STRING },
                  detail: { type: Type.STRING },
                  detailUrdu: { type: Type.STRING },
                  estimatedCostPKR: { type: Type.STRING },
                  timeFrame: { type: Type.STRING },
                },
                required: ["priority", "title", "titleUrdu", "detail", "detailUrdu", "timeFrame"],
              },
            },
            upgradePlan7Days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  dayTitle: { type: Type.STRING },
                  taskUrdu: { type: Type.STRING },
                  taskEnglish: { type: Type.STRING },
                },
                required: ["day", "dayTitle", "taskUrdu", "taskEnglish"],
              },
            },
            recommendedDisinfectants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  nameUrdu: { type: Type.STRING },
                  dilution: { type: Type.STRING },
                  usage: { type: Type.STRING },
                  costEstimate: { type: Type.STRING },
                },
                required: ["name", "nameUrdu", "dilution", "usage", "costEstimate"],
              },
            },
            activeLocalThreats: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  disease: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ["critical", "high", "moderate"] },
                  affectedRadiusKm: { type: Type.INTEGER },
                  precautionUrdu: { type: Type.STRING },
                  precautionEnglish: { type: Type.STRING },
                },
                required: ["disease", "severity", "affectedRadiusKm", "precautionUrdu", "precautionEnglish"],
              },
            },
          },
          required: [
            "score",
            "grade",
            "status",
            "categoryScores",
            "aiSummary",
            "criticalVulnerabilities",
            "actionSteps",
            "upgradePlan7Days",
            "recommendedDisinfectants",
            "activeLocalThreats",
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsedData });
  } catch (err) {
    console.error("AI Biosecurity Assessment error:", err);
    // Return robust calculation fallback on error
    const { district = "Sahiwal", language = "ur", answers = {} } = req.body || {};
    let pos = 0;
    const total = Object.keys(answers).length || 10;
    for (const k in answers) if (answers[k] === true) pos++;
    const sc = Math.min(95, Math.max(25, Math.round((pos / total) * 100)));
    const gr: 'A' | 'B' | 'C' = sc >= 80 ? 'A' : sc >= 60 ? 'B' : 'C';

    return res.json({
      success: true,
      data: {
        score: sc,
        grade: gr,
        status: gr === 'A' ? 'secure' : gr === 'B' ? 'moderate_risk' : 'high_risk',
        categoryScores: {
          entryControl: 60,
          quarantine: 40,
          sanitation: 75,
          vaccination: 80,
          wasteManagement: 50,
        },
        aiSummary: language === 'en'
          ? `Biosecurity Assessment completed for ${district}. Score: ${sc}%. Implement gate disinfection and quarantine protocols.`
          : `ضلع ${district} کے لیے فارم بائیو سیکیورٹی اسسمنٹ مکمل ہو گئی۔ حاصل کردہ اسکور ${sc}% ہے۔ فارم داخلے پر چونے کا سپرے اور قرنطینہ لازمی کریں۔`,
        criticalVulnerabilities: [
          language === 'en' ? 'Entry vehicle foot-dip missing' : 'فارم گیٹ پر گاڑیوں اور جوتوں کا ڈس انفیکشن پیڈ نہ ہونا',
          language === 'en' ? 'Quarantine isolation pen not fenced' : 'بیمار جانوروں کے الگ باڑے کی عدم موجودگی'
        ],
        actionSteps: [
          {
            priority: 'urgent',
            title: 'Set up Gate Foot-bath',
            titleUrdu: 'مین گیٹ پر چونے کا فٹ باتھ بنائیں',
            detail: 'Use slaked lime or KMnO4 (Pinki) at entry gate.',
            detailUrdu: 'داخلی گیٹ پر بجھا ہوا چونا چھڑکیں تاکہ بیرونی جراثیم اندر نہ آئیں۔',
            estimatedCostPKR: 'Rs. 1,500',
            timeFrame: '24 Hours'
          }
        ],
        upgradePlan7Days: [
          { day: 1, dayTitle: 'گندگی کی صفائی', taskUrdu: 'فارم سے گوبر اور فضلہ ہٹائیں', taskEnglish: 'Clear dung and slurry away from herd' },
          { day: 2, dayTitle: 'ڈس انفیکشن', taskUrdu: 'دیواروں اور فرش پر چونا لگائیں', taskEnglish: 'Apply quicklime wash on pen floors and walls' },
          { day: 3, dayTitle: 'سپرے مہم', taskUrdu: 'مکھی اور مچھر مار سپرے کریں', taskEnglish: 'Spray anti-vector insect control' }
        ],
        recommendedDisinfectants: [
          { name: 'Slaked Lime', nameUrdu: 'بجھا ہوا چونا', dilution: 'Dry powder spreading', usage: 'Gates and pen alleys', costEstimate: 'Rs. 40/kg' },
          { name: 'Pinki (KMnO4)', nameUrdu: 'پوٹاشیم پرمینگنیٹ (پنکی)', dilution: '1g per 10L water', usage: 'Foot-dip and wash', costEstimate: 'Rs. 150/bottle' }
        ],
        activeLocalThreats: [
          {
            disease: 'لمپی سکن (LSD)',
            severity: 'high',
            affectedRadiusKm: 20,
            precautionUrdu: 'مکھی مار سپرے کریں اور متاثرہ جانور الگ کریں۔',
            precautionEnglish: 'Spray insecticide and isolate cattle.'
          }
        ]
      }
    });
  }
});

// ----------------------------------------------------
// 10. Admin REST API Services (Users, Records, Apps, Complaints, AI logs, Audits)
// ----------------------------------------------------

// In-Memory Fallback State for Admin Hub
let serverAdminUsers = [
  {
    id: 'usr_001',
    name: 'Chaudhry Ahmed Ali',
    email: 'ahmed.farm@kisandost.ai',
    phone: '0300-1234567',
    role: 'super_admin',
    status: 'active',
    registrationDate: '2026-01-10',
    lastLogin: '2026-08-21 09:45 AM',
    farmName: 'Al-Madina Dairy & Cattle Farm',
    location: 'Chak 88/9-L, Sahiwal, Punjab',
    district: 'Sahiwal',
    language: 'ur',
    isVerified: true,
    notes: 'Primary Master Farm Administrator and Certified Livestock Breeder.',
    totalRecordsCount: 28,
    totalAIRequestsCount: 84
  },
  {
    id: 'usr_002',
    name: 'Dr. Tariq Mahmood (Vet)',
    email: 'dr.tariq@kisandost.ai',
    phone: '0300-7654321',
    role: 'moderator',
    status: 'active',
    registrationDate: '2026-02-14',
    lastLogin: '2026-08-20 04:30 PM',
    farmName: 'Sahiwal Animal Hospital & Clinic',
    location: 'Civil Lines, Sahiwal',
    district: 'Sahiwal',
    language: 'ur',
    isVerified: true,
    notes: 'District Veterinary Officer & Health Reviewer.',
    totalRecordsCount: 42,
    totalAIRequestsCount: 120
  },
  {
    id: 'usr_003',
    name: 'Mian Bashir Gujjar',
    email: 'bashir.mandi@kisandost.ai',
    phone: '0312-4455667',
    role: 'admin',
    status: 'active',
    registrationDate: '2026-03-01',
    lastLogin: '2026-08-19 11:20 AM',
    farmName: 'Gujjar Dairy & Mandi Traders',
    location: 'Jhang Road, Faisalabad',
    district: 'Faisalabad',
    language: 'ur',
    isVerified: true,
    notes: 'Livestock Mandi Verified Trader & Auditor.',
    totalRecordsCount: 19,
    totalAIRequestsCount: 35
  },
  {
    id: 'usr_004',
    name: 'Haji Aslam Rasheed',
    email: 'aslam.dairy@gmail.com',
    phone: '0301-9876543',
    role: 'user',
    status: 'active',
    registrationDate: '2026-04-18',
    lastLogin: '2026-08-18 02:15 PM',
    farmName: 'Rasheed Organic Dairy',
    location: 'Multan Road, Sahiwal',
    district: 'Sahiwal',
    language: 'ur',
    isVerified: true,
    notes: 'Dairy retailer and customer buyer lead.',
    totalRecordsCount: 12,
    totalAIRequestsCount: 22
  },
  {
    id: 'usr_005',
    name: 'Rana Kamran Khan',
    email: 'kamran.rana@yahoo.com',
    phone: '0345-9988776',
    role: 'user',
    status: 'inactive',
    registrationDate: '2026-05-22',
    lastLogin: '2026-07-29 08:10 AM',
    farmName: 'Kamran Cattle Breeders',
    location: 'Depalpur Road, Okara',
    district: 'Okara',
    language: 'pb',
    isVerified: false,
    notes: 'Pending bio-security verification for animal listings.',
    totalRecordsCount: 4,
    totalAIRequestsCount: 9
  },
  {
    id: 'usr_006',
    name: 'Malik Zafar Iqbal',
    email: 'malik.zafar@outlook.com',
    phone: '0333-1122334',
    role: 'user',
    status: 'suspended',
    registrationDate: '2026-06-05',
    lastLogin: '2026-07-15 01:00 PM',
    farmName: 'Zafar Feeds & Animals',
    location: 'Samundri, Faisalabad',
    district: 'Faisalabad',
    language: 'ur',
    isVerified: false,
    notes: 'Suspended due to unverified vaccine documents in Mandi.',
    totalRecordsCount: 2,
    totalAIRequestsCount: 5
  }
];

let serverApplications = [
  {
    id: 'app_1001',
    userId: 'usr_004',
    applicantName: 'Haji Aslam Rasheed',
    applicantEmail: 'aslam.dairy@gmail.com',
    applicantPhone: '0301-9876543',
    applicationType: 'dairy_certification',
    submissionDate: '2026-08-19',
    status: 'pending',
    assignedAdmin: 'Chaudhry Ahmed Ali',
    priority: 'high',
    documents: ['Lab_Milk_Purity_Test.pdf', 'Chiller_Hygiene_Inspection.pdf'],
    adminNotes: 'Awaiting lab testing report for somatic cell count & fat purity.',
    details: {
      farmName: 'Rasheed Organic Dairy',
      cnicOrRegistration: '35302-1234567-1',
      livestockCount: 35,
      dailyMilkCapacityLiters: 450,
      requestSummary: 'Application for Punjab Food Authority Certified Pure Dairy Tag.',
      district: 'Sahiwal',
      licenseGrade: 'Grade-A Organic'
    }
  },
  {
    id: 'app_1002',
    userId: 'usr_003',
    applicantName: 'Mian Bashir Gujjar',
    applicantEmail: 'bashir.mandi@kisandost.ai',
    applicantPhone: '0312-4455667',
    applicationType: 'mandi_seller',
    submissionDate: '2026-08-15',
    status: 'approved',
    assignedAdmin: 'Chaudhry Ahmed Ali',
    decisionDate: '2026-08-16',
    priority: 'medium',
    documents: ['Trader_CNIC.pdf', 'Mandi_Association_License.pdf'],
    adminNotes: 'Verified trader with 15+ years experience. Badge approved.',
    details: {
      farmName: 'Gujjar Dairy & Mandi Traders',
      cnicOrRegistration: '33100-7654321-3',
      livestockCount: 60,
      requestSummary: 'Verified Mandi Master Seller with VIP Digital Badge.',
      district: 'Faisalabad',
      licenseGrade: 'Elite Trader'
    }
  },
  {
    id: 'app_1003',
    userId: 'usr_005',
    applicantName: 'Rana Kamran Khan',
    applicantEmail: 'kamran.rana@yahoo.com',
    applicantPhone: '0345-9988776',
    applicationType: 'farm_license',
    submissionDate: '2026-08-12',
    status: 'under_review',
    assignedAdmin: 'Dr. Tariq Mahmood',
    priority: 'urgent',
    documents: ['Land_Ownership_Fard.pdf', 'Vaccine_Ledger.pdf'],
    adminNotes: 'Field veterinary inspection scheduled for Friday.',
    details: {
      farmName: 'Kamran Cattle Breeders',
      cnicOrRegistration: '35301-9988776-5',
      livestockCount: 48,
      dailyMilkCapacityLiters: 320,
      requestSummary: 'Official Livestock Department Farm Registration License.',
      district: 'Okara',
      licenseGrade: 'Commercial Dairy'
    }
  }
];

let serverComplaints = [
  {
    id: 'cmp_2001',
    userId: 'usr_004',
    userName: 'Haji Aslam Rasheed',
    userEmail: 'aslam.dairy@gmail.com',
    userPhone: '0301-9876543',
    category: 'delivery',
    title: 'Late Morning Milk Delivery Batch #KD-99',
    description: 'Fresh milk delivery was delayed by 2 hours due to transport route malfunction. Chilling compensation requested.',
    submissionDate: '2026-08-20',
    priority: 'high',
    status: 'in_progress',
    assignedAdmin: 'Chaudhry Ahmed Ali',
    adminResponse: 'Delivery team dispatched replacement batch with insulated vehicle. Route updated.',
    attachments: ['delivery_time_slip.png']
  },
  {
    id: 'cmp_2002',
    userId: 'usr_005',
    userName: 'Rana Kamran Khan',
    userEmail: 'kamran.rana@yahoo.com',
    userPhone: '0345-9988776',
    category: 'pricing',
    title: 'Discrepancy in Mandi Market Benchmark Rate',
    description: 'The Sahiwal Cow benchmark price displayed PKR 340,000 whereas local market traded at PKR 365,000.',
    submissionDate: '2026-08-16',
    priority: 'medium',
    status: 'resolved',
    assignedAdmin: 'Mian Bashir Gujjar',
    adminResponse: 'Algorithm price feed refreshed with live Sahiwal Mandi Tuesday auction prices.',
    resolvedDate: '2026-08-17'
  }
];

let serverReports = [
  {
    id: 'rep_3001',
    userId: 'usr_002',
    userName: 'Dr. Tariq Mahmood (Vet)',
    reportType: 'outbreak_alert',
    title: 'Lumpy Skin Disease (LSD) Vector Cluster Alert',
    summary: 'Detected 14 localized cases along Chichawatni border belt. Prompt ring vaccination deployed.',
    date: '2026-08-18',
    status: 'investigating',
    priority: 'urgent',
    assignedAdmin: 'Dr. Tariq Mahmood',
    affectedCount: 14,
    metrics: { district: 'Sahiwal / Chichawatni', containmentRadiusKm: 12, vaccinatedCount: 180 },
    adminNotes: 'Vaccination teams deployed to sectors 88-L and 92-L.'
  },
  {
    id: 'rep_3002',
    userId: 'usr_001',
    userName: 'Chaudhry Ahmed Ali',
    reportType: 'production_analytics',
    title: 'Quarterly Herd Milk Yield & Protein Optimization Report',
    summary: 'Average herd yield increased +14.2% following green Lucerne and bypass fat dietary adjustment.',
    date: '2026-08-15',
    status: 'reviewed',
    priority: 'medium',
    assignedAdmin: 'Chaudhry Ahmed Ali',
    metrics: { totalDailyLiters: 114.5, avgFatPercent: 4.8, avgProteinPercent: 3.6 },
    adminNotes: 'Fodder formulation locked for autumn season.'
  }
];

let serverNotifications = [
  {
    id: 'notif_4001',
    title: '🚨 FMD Booster Vaccine Drive Scheduled for September',
    message: 'All cattle and buffalo owners in Sahiwal & Okara must complete Foot & Mouth Disease booster doses before Sep 15.',
    targetAudience: 'farmers',
    createdDate: '2026-08-20',
    scheduledDate: '2026-08-22',
    status: 'active',
    priority: 'alert',
    createdBy: 'Dr. Tariq Mahmood (Vet Officer)',
    recipientCount: 2850,
    readCount: 1940
  },
  {
    id: 'notif_4002',
    title: '🥛 Fresh Organic Desi Ghee New Batch Available',
    message: 'Pure traditional slow-churned Desi Ghee batch #14 is now live on the Kisan Dost Dairy Storefront.',
    targetAudience: 'dairy_buyers',
    createdDate: '2026-08-18',
    status: 'sent',
    priority: 'announcement',
    createdBy: 'Chaudhry Ahmed Ali',
    recipientCount: 1420,
    readCount: 1110
  }
];

let serverMessages = [
  {
    id: 'msg_5001',
    userId: 'usr_004',
    userName: 'Haji Aslam Rasheed',
    userEmail: 'aslam.dairy@gmail.com',
    userPhone: '0301-9876543',
    subject: 'Bulk Weekly Milk Order Subscription (20 Liters/Day)',
    category: 'Commercial Dairy',
    status: 'open',
    unreadCount: 1,
    lastMessageDate: '2026-08-21 10:15 AM',
    assignedAdmin: 'Chaudhry Ahmed Ali',
    messages: [
      {
        id: 'm_1',
        senderId: 'usr_004',
        senderName: 'Haji Aslam Rasheed',
        senderRole: 'user',
        message: 'السلام علیکم چوہدری صاحب! ہم اپنے ہوٹل کے لیے روزانہ 20 لیٹر خالص گائے کے دودھ کا مستقل کنٹریکٹ کرنا چاہتے ہیں۔ ریٹ اور صبح کی ٹائمنگ بتا دیں۔',
        timestamp: '2026-08-21 09:30 AM'
      },
      {
        id: 'm_2',
        senderId: 'usr_001',
        senderName: 'Chaudhry Ahmed Ali (Admin)',
        senderRole: 'admin',
        message: 'وعلیکم السلام حاجی صاحب! ہمارے پاس صبح 6:30 بجے خالص چلڈ دودھ 215 روپے فی لیٹر ہول سیل ریٹ پر دستیاب ہے۔ ہم کنٹریکٹ فارم بھجواتے ہیں۔',
        timestamp: '2026-08-21 09:50 AM'
      }
    ]
  }
];

let serverAIActivityLogs = [
  {
    id: 'ai_6001',
    userId: 'usr_001',
    userName: 'Chaudhry Ahmed Ali',
    dateTime: '2026-08-21 08:30 AM',
    queryType: 'disease_scan',
    userQuery: 'Ear lesions and high fever inspection on Sahiwal Queen',
    aiResponsePreview: 'Detected: Mild Mastitis / Udder Swelling (94% confidence). Recommended: Mammitis teat dip and Penicillin course.',
    modelUsed: 'gemini-3.6-flash (Vision)',
    status: 'success',
    processingTimeMs: 1420,
    tokenCount: 680,
    feedbackScore: 5
  },
  {
    id: 'ai_6002',
    userId: 'usr_004',
    userName: 'Haji Aslam Rasheed',
    dateTime: '2026-08-20 02:15 PM',
    queryType: 'doctor_assistant',
    userQuery: 'بھینس کو افارہ ہو گیا ہے اور پیٹ پھول رہا ہے، فوری دیسی علاج بتائیں',
    aiResponsePreview: 'فوری اقدامات: 200 ملی لیٹر سرسوں کا تیل اور 50 گرام میٹھا سوڈا دیں۔ جانور کو آہستہ آہستہ چلائیں۔',
    modelUsed: 'gemini-3.6-flash (Urdu Voice Doctor)',
    status: 'success',
    processingTimeMs: 1180,
    tokenCount: 490,
    feedbackScore: 5
  }
];

let serverAuditLogs = [
  {
    id: 'log_7001',
    adminId: 'usr_001',
    adminName: 'Chaudhry Ahmed Ali',
    adminRole: 'super_admin',
    action: 'USER_ROLE_UPDATED',
    targetModule: 'users',
    targetUserId: 'usr_002',
    previousValue: 'user',
    newValue: 'moderator',
    ipAddress: '182.185.120.10',
    deviceInfo: 'Chrome 128 (macOS)',
    timestamp: '2026-08-21 09:15 AM',
    status: 'success'
  },
  {
    id: 'log_7002',
    adminId: 'usr_001',
    adminName: 'Chaudhry Ahmed Ali',
    adminRole: 'super_admin',
    action: 'APPLICATION_APPROVED',
    targetModule: 'applications',
    targetRecordId: 'app_1002',
    previousValue: 'pending',
    newValue: 'approved',
    ipAddress: '182.185.120.10',
    deviceInfo: 'Chrome 128 (macOS)',
    timestamp: '2026-08-16 02:40 PM',
    status: 'success'
  }
];

let serverSystemSettings = {
  maintenanceMode: false,
  allowNewRegistrations: true,
  defaultUserRole: 'user',
  geminiModel: 'gemini-3.6-flash',
  enableAIImageDiagnosis: true,
  enableLiveOfflineSync: true,
  maxDailyAIRequestsPerUser: 100,
  autoApproveLowRiskApplications: false,
  backupSchedule: 'daily_0200_gmt',
  superAdminEmails: ['ahmed.farm@kisandost.ai', 'admin@kisandost.ai']
};

// Admin Endpoints
app.get("/api/admin/overview", (_req, res) => {
  const totalUsers = serverAdminUsers.length;
  const activeUsers = serverAdminUsers.filter(u => u.status === 'active').length;
  const pendingRequests = serverApplications.filter(a => a.status === 'pending' || a.status === 'under_review').length;
  const completedRequests = serverApplications.filter(a => a.status === 'approved' || a.status === 'completed').length;
  const reportsCount = serverReports.length;
  const complaintsCount = serverComplaints.length;
  const aiRequestsCount = serverAIActivityLogs.length;

  res.json({
    success: true,
    stats: {
      totalUsers,
      activeUsers,
      totalRecords: 128,
      pendingRequests,
      completedRequests,
      reportsCount,
      complaintsCount,
      aiRequestsCount,
    },
    recentActivity: serverAuditLogs.slice(0, 10),
    systemSettings: serverSystemSettings
  });
});

app.get("/api/admin/users", (_req, res) => {
  res.json({ success: true, users: serverAdminUsers });
});

app.post("/api/admin/users", (req, res) => {
  const newUser = {
    id: "usr_" + Math.random().toString(36).substring(2, 9),
    registrationDate: new Date().toISOString().split('T')[0],
    lastLogin: "Just now",
    status: req.body.status || 'active',
    role: req.body.role || 'user',
    totalRecordsCount: 0,
    totalAIRequestsCount: 0,
    ...req.body
  };
  serverAdminUsers.unshift(newUser);
  res.json({ success: true, user: newUser });
});

app.put("/api/admin/users/:id", (req, res) => {
  const { id } = req.params;
  const index = serverAdminUsers.findIndex(u => u.id === id);
  if (index !== -1) {
    serverAdminUsers[index] = { ...serverAdminUsers[index], ...req.body };
    return res.json({ success: true, user: serverAdminUsers[index] });
  }
  res.status(404).json({ error: "User not found" });
});

app.delete("/api/admin/users/:id", (req, res) => {
  const { id } = req.params;
  serverAdminUsers = serverAdminUsers.filter(u => u.id !== id);
  res.json({ success: true, message: "User deleted" });
});

app.get("/api/admin/applications", (_req, res) => {
  res.json({ success: true, applications: serverApplications });
});

app.post("/api/admin/applications", (req, res) => {
  const newApp = {
    id: "app_" + Math.floor(1000 + Math.random() * 9000),
    submissionDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    ...req.body
  };
  serverApplications.unshift(newApp);
  res.json({ success: true, application: newApp });
});

app.put("/api/admin/applications/:id", (req, res) => {
  const { id } = req.params;
  const index = serverApplications.findIndex(a => a.id === id);
  if (index !== -1) {
    serverApplications[index] = { ...serverApplications[index], ...req.body };
    return res.json({ success: true, application: serverApplications[index] });
  }
  res.status(404).json({ error: "Application not found" });
});

app.get("/api/admin/complaints", (_req, res) => {
  res.json({ success: true, complaints: serverComplaints });
});

app.post("/api/admin/complaints", (req, res) => {
  const newComplaint = {
    id: "cmp_" + Math.floor(2000 + Math.random() * 9000),
    submissionDate: new Date().toISOString().split('T')[0],
    status: 'new',
    ...req.body
  };
  serverComplaints.unshift(newComplaint);
  res.json({ success: true, complaint: newComplaint });
});

app.put("/api/admin/complaints/:id", (req, res) => {
  const { id } = req.params;
  const index = serverComplaints.findIndex(c => c.id === id);
  if (index !== -1) {
    serverComplaints[index] = { ...serverComplaints[index], ...req.body };
    return res.json({ success: true, complaint: serverComplaints[index] });
  }
  res.status(404).json({ error: "Complaint not found" });
});

app.get("/api/admin/reports", (_req, res) => {
  res.json({ success: true, reports: serverReports });
});

app.put("/api/admin/reports/:id", (req, res) => {
  const { id } = req.params;
  const index = serverReports.findIndex(r => r.id === id);
  if (index !== -1) {
    serverReports[index] = { ...serverReports[index], ...req.body };
    return res.json({ success: true, report: serverReports[index] });
  }
  res.status(404).json({ error: "Report not found" });
});

app.get("/api/admin/notifications", (_req, res) => {
  res.json({ success: true, notifications: serverNotifications });
});

app.post("/api/admin/notifications", (req, res) => {
  const newNotif = {
    id: "notif_" + Math.floor(4000 + Math.random() * 9000),
    createdDate: new Date().toISOString().split('T')[0],
    status: req.body.status || 'sent',
    recipientCount: req.body.recipientCount || 2500,
    readCount: 0,
    ...req.body
  };
  serverNotifications.unshift(newNotif);
  res.json({ success: true, notification: newNotif });
});

app.delete("/api/admin/notifications/:id", (req, res) => {
  const { id } = req.params;
  serverNotifications = serverNotifications.filter(n => n.id !== id);
  res.json({ success: true, message: "Notification deleted" });
});

app.get("/api/admin/messages", (_req, res) => {
  res.json({ success: true, threads: serverMessages });
});

app.post("/api/admin/messages/:id/reply", (req, res) => {
  const { id } = req.params;
  const { message, senderName = "Admin", senderRole = "admin" } = req.body;
  const thread = serverMessages.find(t => t.id === id);
  if (!thread) return res.status(404).json({ error: "Thread not found" });

  const newMsg = {
    id: "m_" + Math.random().toString(36).substring(2, 7),
    senderId: "usr_admin",
    senderName,
    senderRole: senderRole as any,
    message,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };
  thread.messages.push(newMsg);
  thread.lastMessageDate = newMsg.timestamp;
  res.json({ success: true, thread, message: newMsg });
});

app.get("/api/admin/ai-activity", (_req, res) => {
  res.json({ success: true, logs: serverAIActivityLogs });
});

app.post("/api/admin/ai-activity", (req, res) => {
  const log = {
    id: "ai_" + Math.floor(6000 + Math.random() * 9000),
    dateTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
    ...req.body
  };
  serverAIActivityLogs.unshift(log);
  res.json({ success: true, log });
});

app.get("/api/admin/audit-logs", (_req, res) => {
  res.json({ success: true, logs: serverAuditLogs });
});

app.post("/api/admin/audit-logs", (req, res) => {
  const log = {
    id: "log_" + Math.floor(7000 + Math.random() * 9000),
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    ...req.body
  };
  serverAuditLogs.unshift(log);
  res.json({ success: true, log });
});

app.get("/api/admin/settings", (_req, res) => {
  res.json({ success: true, settings: serverSystemSettings });
});

app.put("/api/admin/settings", (req, res) => {
  serverSystemSettings = { ...serverSystemSettings, ...req.body };
  res.json({ success: true, settings: serverSystemSettings });
});

// ─────────────────────────────────────────────────────────────────
// Urdu Text-to-Speech Proxy  →  /api/ai/tts
// Forwards text to FastAPI gTTS at http://127.0.0.1:5000/api/tts
// Returns base64 MP3 audio for the frontend hybrid TTS utility.
// ─────────────────────────────────────────────────────────────────
app.post("/api/ai/tts", async (req, res) => {
  const { text, lang = "ur" } = req.body || {};

  if (!text || typeof text !== "string") {
    return res.status(400).json({ success: false, error: "text is required" });
  }

  try {
    const pyResponse = await fetch("http://127.0.0.1:5000/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang }),
      signal: AbortSignal.timeout(30000),
    });

    if (!pyResponse.ok) {
      throw new Error(`Python TTS responded with status ${pyResponse.status}`);
    }

    const pyResult = await pyResponse.json() as {
      success: boolean;
      audio_base64?: string;
      error?: string;
    };

    if (!pyResult.success || !pyResult.audio_base64) {
      return res.json({
        success: false,
        error: pyResult.error || "TTS generation failed",
      });
    }

    return res.json({
      success: true,
      audioBase64: `data:audio/mp3;base64,${pyResult.audio_base64}`,
    });
  } catch (err: any) {
    const isOffline =
      err?.cause?.code === "ECONNREFUSED" ||
      err?.name === "TimeoutError" ||
      String(err).includes("ECONNREFUSED");

    if (isOffline) {
      console.warn("[TTS] Python TTS server offline — frontend will use browser fallback.");
    } else {
      console.error("[TTS] Python TTS error:", err);
    }

    return res.json({
      success: false,
      error: isOffline ? "TTS service unavailable" : String(err),
    });
  }
});


// Vite middleware in development & static serving in production
async function startServer() {
  // Initialize SQLite database
  await initDatabase();
  runMigrations();
  seedDatabase();

  // Register API routes before SPA catch-all
  registerApiRoutes(app);

  // Always serve public/ directory (logo, icons, etc.)
  app.use(express.static(path.join(process.cwd(), "public")));

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: { ignored: ["**/build/**", "**/.dart_tool/**"] },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  function listenWithRealtime(port: number, onErr?: (err: any) => void): http.Server {
    const httpServer = http.createServer(app);
    initRealtime(httpServer);
    if (onErr) httpServer.on("error", onErr);
    return httpServer.listen(port, "0.0.0.0", () => {
      console.log(`\n🌿 Kisan Dost AI server running on http://localhost:${port}`);
      const apiKeyLoaded = getGeminiApiKey();
      console.log(
        `[Gemini Init] GEMINI_API_KEY ${
          apiKeyLoaded ? `loaded ✓ (${apiKeyLoaded.slice(0, 6)}...)` : "MISSING ✗ — set GEMINI_API_KEY in .env"
        } | model cascade: ${MODEL_CASCADE.join(" → ")} | timeout: ${GEMINI_TIMEOUT_MS}ms`
      );
    });
  }

  const server = listenWithRealtime(PORT, (err: any) => {
    if (err.code === "EADDRINUSE") {
      const nextPort = Number(PORT) + 1;
      console.warn(`\n⚠️  Port ${PORT} is already in use — retrying on port ${nextPort}...`);
      setTimeout(() => {
        server.close();
        listenWithRealtime(nextPort);
      }, 250);
    } else {
      console.error("[Server] Fatal error:", err);
      process.exit(1);
    }
  });
}

startServer();
