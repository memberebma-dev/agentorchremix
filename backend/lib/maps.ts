// Google Maps Places API — real lead discovery + web presence scoring

import { generateAIContent } from "./ai";

export interface PlaceResult {
  companyName: string;
  website: string;
  phone: string;
  address: string;
  rating: number;
  reviewCount: number;
  placeId: string;
}

export interface DiscoveryResult {
  places: PlaceResult[];
  diagnostic: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Text-searches Google Places, paginating through up to 3 pages (Google's max,
 * 60 results) and skipping any business already in excludeNames, so repeated
 * runs against the same niche+location actually surface NEW prospects instead
 * of re-finding (and re-deduping-away) the same handful every time.
 */
export async function discoverLeadsFromMaps(
  mapsKey: string,
  niche: string,
  location: string,
  maxResults = 10,
  excludeNames: Set<string> = new Set()
): Promise<DiscoveryResult> {
  if (!mapsKey) {
    return { places: [], diagnostic: "GOOGLE_MAPS_API_KEY not configured." };
  }
  const collected: PlaceResult[] = [];
  let pageToken: string | undefined;
  let pagesFetched = 0;
  const maxPages = 3; // Google Places Text Search caps at 3 pages (60 results) per query
  let sawAnyResult = false;
  let diagnostic = "";

  try {
    do {
      const query = encodeURIComponent(`${niche} in ${location}`);
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${mapsKey}`;
      if (pageToken) url += `&pagetoken=${pageToken}`;
      const res = await fetch(url);
      if (!res.ok) { diagnostic = `Maps API HTTP error ${res.status}.`; break; }
      const data = (await res.json()) as any;
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        diagnostic = `Maps API returned ${data.status}${data.error_message ? `: ${data.error_message}` : ""}. This usually means billing isn't enabled on the Google Cloud project or the Places API isn't activated for this key.`;
        break;
      }
      const pageResults: any[] = data.results || [];
      if (pageResults.length > 0) sawAnyResult = true;

      for (const place of pageResults) {
        const name: string = place.name || "";
        const key = name.trim().toLowerCase();
        if (!name || excludeNames.has(key)) continue;

        let website = "";
        let phone = "";
        try {
          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total&key=${mapsKey}`;
          const dRes = await fetch(detailUrl);
          const dData = (await dRes.json()) as any;
          const d = dData.result || {};
          website = d.website || "";
          phone = d.formatted_phone_number || "";
        } catch { /* use empty defaults */ }

        collected.push({
          companyName: name,
          website,
          phone,
          address: place.formatted_address || location,
          rating: place.rating || 0,
          reviewCount: place.user_ratings_total || 0,
          placeId: place.place_id,
        });
        excludeNames.add(key);
        if (collected.length >= maxResults) break;
      }

      pageToken = data.next_page_token;
      pagesFetched++;
      if (collected.length >= maxResults) break;
      if (pageToken) await sleep(2200); // next_page_token needs a short delay before it's valid
    } while (pageToken && pagesFetched < maxPages);
  } catch (e: any) {
    return { places: collected, diagnostic: `Maps discovery error: ${e.message}` };
  }

  if (!diagnostic) {
    if (collected.length === 0 && sawAnyResult) {
      diagnostic = `Google Maps found businesses for "${niche}" in "${location}" but all of them are already in your pipeline. Try a different niche or a broader/different location.`;
    } else if (collected.length === 0) {
      diagnostic = `Google Maps found zero businesses for "${niche}" in "${location}". Try a broader niche or a more specific location (e.g. a city instead of a whole state).`;
    }
  }
  return { places: collected, diagnostic };
}

/** Discover leads via the AI provider fallback chain when Google Maps fails (billing not enabled, etc.) */
export async function discoverLeadsViaAI(
  env: Record<string, string>,
  niche: string,
  location: string,
  maxResults = 5,
  excludeNames: Set<string> = new Set()
): Promise<DiscoveryResult> {
  try {
    const excludeClause = excludeNames.size
      ? ` Do NOT include any of these already-known businesses: ${Array.from(excludeNames).slice(0, 30).join(", ")}.`
      : "";
    const raw = await generateAIContent(env, `Return a JSON array of exactly ${maxResults} real, distinct businesses in the "${niche}" industry located in "${location}".${excludeClause} Each object must have: companyName, website (real URL or empty string), phone (real number or empty string), address (real street address in ${location}), rating (1-5 number), reviewCount (number). Return ONLY valid JSON, no markdown.`);
    const text = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return { places: [], diagnostic: "AI discovery returned a non-array response." };
    const places = parsed
      .filter((b: any) => b.companyName && !excludeNames.has(String(b.companyName).trim().toLowerCase()))
      .slice(0, maxResults)
      .map((b: any, i: number) => ({
        companyName: b.companyName || `Business ${i + 1}`,
        website: b.website || "",
        phone: b.phone || "",
        address: b.address || location,
        rating: Number(b.rating) || 0,
        reviewCount: Number(b.reviewCount) || 0,
        placeId: `ai_${crypto.randomUUID()}`,
      }));
    const diagnostic = places.length === 0
      ? `AI discovery for "${niche}" in "${location}" returned only businesses already in your pipeline, or nothing usable. Try a different niche/location.`
      : "";
    return { places, diagnostic };
  } catch (e: any) {
    return { places: [], diagnostic: `AI discovery error: ${e.message}` };
  }
}

/** Score a lead 0-99 based on real digital presence signals from Google Maps */
// Note: searchActivityScore and paidAdsActivity were previously computed with Math.random() —
// no data source available here can honestly measure a third-party business's search/ads activity,
// so those fields were removed rather than faked. Only overallScore and conversionLikelihood remain,
// both fully deterministic from real Google Maps presence signals.
export function scoreLeadFromPresence(p: {
  website?: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
}): { overallScore: number; conversionLikelihood: number; issues: string[] } {
  let score = 45;
  const issues: string[] = [];

  if (!p.website) { score += 28; issues.push("No website — critical digital gap"); }
  else { score += 10; }

  if ((p.reviewCount || 0) < 10) { score += 15; issues.push(`Only ${p.reviewCount || 0} Google reviews`); }
  else if ((p.reviewCount || 0) < 50) { score += 7; issues.push("Below-average review count"); }

  if (p.rating && p.rating < 3.5) { score += 10; issues.push(`Rating ${p.rating}/5 — below average`); }

  if (!p.phone) { score += 5; issues.push("No phone indexed"); }

  const overallScore = Math.min(score, 99);

  // Deterministic conversion-likelihood estimate: weighted opportunity score, boosted by
  // signals that the business is real/established (reviews, rating) which make them more
  // reachable/credible prospects, not just "has a big gap."
  let conversion = 40 + Math.min(overallScore, 60) * 0.5;
  if ((p.reviewCount || 0) >= 10) conversion += 10;
  if (p.rating && p.rating >= 4) conversion += 5;
  if (!p.website) conversion += 5;
  const conversionLikelihood = Math.max(30, Math.min(95, Math.round(conversion)));

  return { overallScore, conversionLikelihood, issues };
}
