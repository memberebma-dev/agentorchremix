// Public web search for Intent Discovery — Tavily primary, Exa acceptable fallback.
// Only searches public content via official search APIs; never scrapes platforms directly.

export interface SearchHit {
  title: string;
  url: string;
  content: string;
}

export interface SearchResult {
  hits: SearchHit[];
  diagnostic: string;
}

const INTENT_DOMAINS = ["reddit.com", "quora.com", "medium.com", "x.com", "twitter.com"];

async function searchTavily(apiKey: string, query: string, maxResults: number): Promise<SearchHit[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      include_domains: INTENT_DOMAINS,
      max_results: maxResults,
    }),
  });
  if (!res.ok) throw new Error(`Tavily API HTTP ${res.status}: ${await res.text().catch(() => "")}`);
  const data = (await res.json()) as any;
  return (data.results || []).map((r: any) => ({ title: r.title || "", url: r.url || "", content: r.content || "" }));
}

async function searchExa(apiKey: string, query: string, maxResults: number): Promise<SearchHit[]> {
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      numResults: maxResults,
      includeDomains: INTENT_DOMAINS,
      type: "neural",
      contents: { text: { maxCharacters: 1000 } },
    }),
  });
  if (!res.ok) throw new Error(`Exa API HTTP ${res.status}: ${await res.text().catch(() => "")}`);
  const data = (await res.json()) as any;
  return (data.results || []).map((r: any) => ({ title: r.title || "", url: r.url || "", content: r.text || r.summary || "" }));
}

/** Searches public forum/social content for a query. Tries Tavily first, then Exa, if configured. */
export async function searchPublicIntentContent(
  env: Record<string, string>,
  query: string,
  maxResults = 8
): Promise<SearchResult> {
  const tavilyKey = env.TAVILY_API_KEY || "";
  const exaKey = env.EXA_API_KEY || "";

  if (!tavilyKey && !exaKey) {
    return { hits: [], diagnostic: "add TAVILY_API_KEY to enable Intent Discovery (EXA_API_KEY also accepted as an alternative)." };
  }

  if (tavilyKey) {
    try {
      return { hits: await searchTavily(tavilyKey, query, maxResults), diagnostic: "" };
    } catch (e: any) {
      console.error("Tavily search error:", e.message);
      if (!exaKey) return { hits: [], diagnostic: `Tavily search failed: ${e.message}` };
    }
  }
  if (exaKey) {
    try {
      return { hits: await searchExa(exaKey, query, maxResults), diagnostic: "" };
    } catch (e: any) {
      return { hits: [], diagnostic: `Exa search failed: ${e.message}` };
    }
  }
  return { hits: [], diagnostic: "No search results." };
}
