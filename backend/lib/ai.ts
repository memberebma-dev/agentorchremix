// Multi-provider AI text generation with automatic fallback.
// Tries each configured provider in order until one returns real content.

interface AIProvider {
  name: string;
  key: string;
  url: string;
  model: string;
}

function getProviders(env: Record<string, string>): AIProvider[] {
  return [
    { name: "Groq", key: env.GROQ_API_KEY || "", url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile" },
    { name: "OpenAI", key: env.OPENAI_API_KEY || "", url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini" },
    { name: "OpenRouter", key: env.OPENROUTER_API_KEY || "", url: "https://openrouter.ai/api/v1/chat/completions", model: "meta-llama/llama-3.3-70b-instruct" },
  ].filter((p) => p.key);
}

export async function generateAIContent(env: Record<string, string>, prompt: string, maxTokens = 600): Promise<string> {
  const providers = getProviders(env);
  if (providers.length === 0) return "AI content (no AI provider key configured)";

  for (const provider of providers) {
    try {
      const res = await fetch(provider.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${provider.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: provider.model, messages: [{ role: "user", content: prompt }], max_tokens: maxTokens, temperature: 0.7 }),
      });
      if (!res.ok) { console.error(`${provider.name} AI call failed: ${res.status}`); continue; }
      const json = (await res.json()) as any;
      const content = json.choices?.[0]?.message?.content?.trim();
      if (content) return content;
    } catch (e) {
      console.error(`${provider.name} AI call error:`, e);
    }
  }
  return "AI generated content (all providers unavailable)";
}

/**
 * Same fallback chain, but asks for and parses strict JSON so callers can render
 * real structured pages instead of dumping a raw text blob. Providers sometimes
 * wrap JSON in markdown fences despite instructions, so those are stripped
 * before parsing. Returns null (never throws) if nothing parseable comes back,
 * so callers can fall back to plain-text rendering instead of a broken page.
 */
export async function generateStructuredContent<T>(env: Record<string, string>, prompt: string, maxTokens = 900): Promise<T | null> {
  const jsonPrompt = `${prompt}\n\nRespond with ONLY valid JSON matching the schema above — no markdown code fences, no commentary, no extra text before or after.`;
  const raw = await generateAIContent(env, jsonPrompt, maxTokens);
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(stripped) as T;
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]) as T; } catch { /* fall through */ }
    }
    console.error("generateStructuredContent: failed to parse JSON:", stripped.slice(0, 200));
    return null;
  }
}
