import axios from "axios";

const BASE = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const KEY = process.env.OPENROUTER_API_KEY;

if (!KEY) {
  console.warn("OPENROUTER_API_KEY not set — LLM calls will fail");
}

const client = axios.create({
  baseURL: BASE,
  headers: {
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
  },
  timeout: 60_000,
});

const cohereClient = axios.create({
  baseURL: process.env.CHOERE_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
    "Content-Type": "application/json",
  },
  timeout: 60_000,
});

export async function callChat(model: string, messages: Array<{ role: string; content: string }>, temperature = 0.2) {
  const payload = { model, messages, temperature };
  console.log("[OpenRouter] Sending chat request...", { model, messages });

  const res = await client.post("/chat/completions", payload);

  console.log("[OpenRouter] Response:", res);
  // try safe path for various shapes
  const choices = res.data?.choices;
  if (choices && Array.isArray(choices) && choices.length) {
    const msg = choices[0]?.message?.content ?? choices[0]?.text ?? "";
    return String(msg);
  }
  // fallback
  return String(res.data);
}

export async function createEmbedding(
  model: string,
  input: string | string[]
) {
  console.log("[Cohere] Creating embedding...", {
    model,
    inputPreview: typeof input === "string" ? input.slice(0, 100) : `[${input.length} items]`,
  });

  const payload = {
    model, // contoh: "embed-english-v3.0" atau "embed-multilingual-v3.0"
    texts: Array.isArray(input) ? input : [input],
  };

  const res = await cohereClient.post("/embed", payload);

  return res.data;
}

