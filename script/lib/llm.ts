import OpenAI from "openai";

const Z_AI_API_KEY = process.env.Z_AI_API_KEY;
if (!Z_AI_API_KEY) {
  console.error("Z_AI_API_KEY is not set");
  process.exit(1);
}

export const client = new OpenAI({
  apiKey: Z_AI_API_KEY,
  baseURL: "https://api.z.ai/api/paas/v4/",
  timeout: 120_000,
});

export const MODEL = process.env.Z_AI_MODEL || "glm-4.7-flash";
