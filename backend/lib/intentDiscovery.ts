// Intent Discovery — a warm, intent-based lead source alongside Google Maps.
// Finds real public posts (Reddit/Quora/Medium/X) where a business owner in the
// target niche is expressing a pain point or purchase intent we can solve
// (struggling with leads, website, SEO, marketing), instead of cold-discovering
// businesses that may not be looking for help at all.

import { generateStructuredContent } from "./ai";
import { searchPublicIntentContent } from "./webSearch";

interface IntentPhrasesResponse {
  phrases: string[];
}

interface IntentClassification {
  index: number;
  isMatch: boolean;
  score: number;
  quotedContext: string;
  authorHandle: string;
}

export interface IntentLeadCandidate {
  companyName: string;
  intentUrl: string;
  intentContext: string;
  intentScore: number;
}

export interface IntentDiscoveryResult {
  candidates: IntentLeadCandidate[];
  diagnostic: string;
}

async function buildIntentPhrases(env: Record<string, string>, niche: string): Promise<string[]> {
  const prompt = `Generate 5 short search phrases that a frustrated business owner in the "${niche}" industry might realistically type when posting on Reddit, Quora, or a forum about struggling to get leads, customers, website traffic, or SEO/marketing results for their business. Phrases should sound like real casual search queries, not marketing copy.
Return JSON matching exactly this schema:
{ "phrases": ["5 short search phrases"] }`;
  const data = await generateStructuredContent<IntentPhrasesResponse>(env, prompt, 400);
  if (data && Array.isArray(data.phrases) && data.phrases.length > 0) return data.phrases.slice(0, 5);
  return [`${niche} not getting enough leads`, `${niche} website not working`, `how to get more customers for my ${niche} business`];
}

async function classifyHits(
  env: Record<string, string>,
  niche: string,
  hits: { title: string; url: string; content: string }[]
): Promise<IntentClassification[]> {
  if (hits.length === 0) return [];
  const listing = hits.map((h, i) => `${i}. [${h.url}] ${h.title}\n${h.content.slice(0, 500)}`).join("\n\n");
  const prompt = `You are screening public posts to find business owners in the "${niche}" industry expressing a real pain point or purchase intent around needing more customers, a better website, or marketing/SEO help — i.e. someone who would be a good prospect for a digital growth agency selling exactly that.

Be skeptical — most search hits will NOT be a real match (unrelated discussion, a customer complaining about a business rather than the owner, generic advice threads with no personal stake, etc). Only mark isMatch true when the post reads like it was actually written by an owner/operator of a ${niche} (or closely related) business.

POSTS:
${listing}

Return JSON matching exactly this schema (one entry per post, same order):
{ "classifications": [{"index": number, "isMatch": boolean, "score": number (0-100, only meaningful if isMatch), "quotedContext": "the single most telling sentence or two, quoted directly from the post content above, or empty string if not a match", "authorHandle": "best-guess username/handle/identifier for the poster from the URL or content, or empty string if none found"}] }`;
  const data = await generateStructuredContent<{ classifications: IntentClassification[] }>(env, prompt, 1600);
  return data?.classifications || [];
}

/**
 * Runs the full Intent Discovery pass: derives search phrases from the niche,
 * searches public forum/social content, classifies + scores each hit with AI,
 * and returns qualifying candidates (score >= 60) deduped against existingUrls.
 */
export async function discoverIntentLeads(
  env: Record<string, string>,
  niche: string,
  existingUrls: Set<string>,
  onProgress?: (msg: string) => void
): Promise<IntentDiscoveryResult> {
  const phrases = await buildIntentPhrases(env, niche);
  onProgress?.(`Searching for: ${phrases.join(" | ")}`);

  const allHits: { title: string; url: string; content: string }[] = [];
  let searchDiagnostic = "";
  for (const phrase of phrases) {
    const { hits, diagnostic } = await searchPublicIntentContent(env, phrase, 6);
    if (diagnostic && !searchDiagnostic) searchDiagnostic = diagnostic;
    for (const hit of hits) {
      if (!hit.url || existingUrls.has(hit.url)) continue;
      if (allHits.some((h) => h.url === hit.url)) continue;
      allHits.push(hit);
    }
  }

  if (allHits.length === 0) {
    return { candidates: [], diagnostic: searchDiagnostic || `No new public posts found for "${niche}" across ${phrases.length} search phrases.` };
  }

  onProgress?.(`Classifying ${allHits.length} candidate post(s) for real purchase intent...`);
  const classifications = await classifyHits(env, niche, allHits);

  const candidates: IntentLeadCandidate[] = [];
  for (const c of classifications) {
    if (!c.isMatch || c.score < 60) continue;
    const hit = allHits[c.index];
    if (!hit) continue;
    existingUrls.add(hit.url);
    candidates.push({
      companyName: c.authorHandle ? `${c.authorHandle} (${new URL(hit.url).hostname.replace("www.", "")})` : hit.title.slice(0, 60) || "Unknown poster",
      intentUrl: hit.url,
      intentContext: c.quotedContext || hit.content.slice(0, 280),
      intentScore: Math.max(0, Math.min(100, Math.round(c.score))),
    });
  }

  return { candidates, diagnostic: "" };
}
