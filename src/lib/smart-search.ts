/**
 * Smart Search — deterministic natural language parsing for People search.
 *
 * Approach:
 * 1. Tokenize the query
 * 2. Extract structured intents (company, source, owner, title/role, warmth, time window)
 * 3. Build filters from extracted intents
 * 4. Score and rank results with explanations
 *
 * No LLM needed — pure deterministic parsing.
 */

import { resolveSource, getAllSources, type Source } from "./sources";

// ─── Types ─────────────────────────────────────────────

export interface SmartSearchQuery {
  raw: string;
  /** Free text remaining after intent extraction */
  freeText: string;
  intents: SearchIntent[];
}

export interface SearchIntent {
  type: "company" | "source" | "owner" | "role" | "warmth" | "time" | "tag" | "name" | "orgKind" | "orgSector" | "dealName" | "dealSector" | "dealStatus";
  value: string;
  /** Human-readable explanation of what this intent matches */
  label: string;
}

export interface SmartSearchResult {
  personId: number;
  score: number;
  /** Why this person matched, ordered by relevance */
  explanations: string[];
  /** Which intents matched */
  matchedIntents: SearchIntent[];
}

export interface ParsedPerson {
  id: number;
  firstName: string;
  lastName: string;
  title: string | null;
  org: string | null;
  orgId: number | null;
  orgKind: string | null;
  email: string | null;
  warmth: number;
  source: string | null;
  tags: string[];
  city: string | null;
  state: string | null;
  country: string | null;
  createdAt: string;
  lastContactedAt: string | null;
}

// ─── Constants for intent detection ────────────────────

const WARMTH_KEYWORDS: Record<string, number[]> = {
  cold: [0],
  warm: [1],
  hot: [2],
  champion: [3],
  champions: [3],
  engaged: [2, 3],
  "not cold": [1, 2, 3],
};

const TIME_KEYWORDS: Record<string, number> = {
  "this week": 7,
  "this month": 30,
  "last week": 7,
  "last month": 30,
  "last quarter": 90,
  "this quarter": 90,
  "last year": 365,
  "this year": 365,
  recent: 30,
  recently: 30,
  new: 14,
  "past week": 7,
  "past month": 30,
};

const ROLE_KEYWORDS = [
  "ceo", "cfo", "coo", "cto", "cio", "cmo",
  "partner", "partners",
  "director", "directors",
  "managing director", "md",
  "vice president", "vp",
  "analyst", "analysts",
  "associate", "associates",
  "principal", "principals",
  "head of", "head",
  "manager", "managers",
  "founder", "founders", "co-founder",
  "president",
  "portfolio manager", "pm",
  "investor relations", "ir",
];

const OWNER_NAMES: Record<string, number> = {
  brendan: 1,
  chris: 2,
  gabe: 3,
  gabriel: 3,
};

const RELATIONSHIP_KEYWORDS = [
  "outreach list",
  "targets",
  "prospects",
  "contacts at",
  "people at",
  "people from",
  "team at",
  "who works at",
  "who work at",
  "employees at",
  "from",
  "at",
];

// ─── Parsing ───────────────────────────────────────────

/**
 * Parse a natural language query into structured intents.
 */
export function parseSmartSearch(query: string, knownOrgs: string[]): SmartSearchQuery {
  const intents: SearchIntent[] = [];
  let remaining = query.trim();
  const lower = remaining.toLowerCase();

  // 1. Detect owner references ("sourced by Gabe", "Brendan's contacts")
  for (const [name, id] of Object.entries(OWNER_NAMES)) {
    const ownerPatterns = [
      new RegExp(`sourced\\s+by\\s+${name}`, "i"),
      new RegExp(`${name}'s\\s+(contacts|people|list)`, "i"),
      new RegExp(`assigned\\s+to\\s+${name}`, "i"),
      new RegExp(`owned\\s+by\\s+${name}`, "i"),
    ];
    for (const pattern of ownerPatterns) {
      const match = remaining.match(pattern);
      if (match) {
        intents.push({
          type: "owner",
          value: id.toString(),
          label: `Owned by ${name.charAt(0).toUpperCase() + name.slice(1)}`,
        });
        remaining = remaining.replace(match[0], "").trim();
        break;
      }
    }
  }

  // 2. Detect time windows ("new this week", "added last month")
  for (const [phrase, days] of Object.entries(TIME_KEYWORDS)) {
    if (lower.includes(phrase)) {
      intents.push({
        type: "time",
        value: days.toString(),
        label: `Added ${phrase}`,
      });
      remaining = remaining.replace(new RegExp(phrase, "i"), "").trim();
      break; // Only one time intent
    }
  }

  // 3. Detect warmth keywords
  for (const [keyword, values] of Object.entries(WARMTH_KEYWORDS)) {
    const warmthPattern = new RegExp(`\\b${keyword}\\b`, "i");
    if (warmthPattern.test(remaining)) {
      intents.push({
        type: "warmth",
        value: values.join(","),
        label: `Warmth: ${keyword}`,
      });
      remaining = remaining.replace(warmthPattern, "").trim();
      break;
    }
  }

  // 4. Detect source references ("from LinkedIn", "via referral", "sourced from conference")
  const allSources = getAllSources();
  for (const src of allSources) {
    const sourcePatterns = [
      new RegExp(`(?:from|via|through|sourced\\s+from|source:?)\\s*${escapeRegex(src.name)}`, "i"),
      new RegExp(`${escapeRegex(src.name)}\\s+(?:contacts|people|source)`, "i"),
    ];
    for (const pattern of sourcePatterns) {
      const match = remaining.match(pattern);
      if (match) {
        intents.push({
          type: "source",
          value: src.name,
          label: `Source: ${src.name}`,
        });
        remaining = remaining.replace(match[0], "").trim();
        break;
      }
    }
    // Direct source name match (if not already found)
    if (!intents.some((i) => i.type === "source")) {
      const directPattern = new RegExp(`\\b${escapeRegex(src.name)}\\b`, "i");
      if (
        directPattern.test(remaining) &&
        src.name.length > 3 // Avoid matching "Other" too aggressively
      ) {
        intents.push({
          type: "source",
          value: src.name,
          label: `Source: ${src.name}`,
        });
        remaining = remaining.replace(directPattern, "").trim();
      }
    }
  }

  // 5. Detect company/org references
  // Sort by length descending to match longer names first
  const sortedOrgs = [...knownOrgs].sort((a, b) => b.length - a.length);
  for (const org of sortedOrgs) {
    if (org.length < 2) continue;
    const orgPattern = new RegExp(`\\b${escapeRegex(org)}\\b`, "i");
    // Also check "at {org}", "from {org}", "people at {org}"
    const contextPattern = new RegExp(
      `(?:at|from|people\\s+at|contacts\\s+at|team\\s+at|who\\s+works?\\s+at)\\s+${escapeRegex(org)}`,
      "i"
    );

    const contextMatch = remaining.match(contextPattern);
    const directMatch = remaining.match(orgPattern);

    if (contextMatch) {
      intents.push({
        type: "company",
        value: org,
        label: `Company: ${org}`,
      });
      remaining = remaining.replace(contextMatch[0], "").trim();
    } else if (directMatch) {
      intents.push({
        type: "company",
        value: org,
        label: `Company: ${org}`,
      });
      remaining = remaining.replace(directMatch[0], "").trim();
    }

    if (intents.some((i) => i.type === "company")) break; // Only one company intent
  }

  // 6. Detect role/title keywords
  for (const role of ROLE_KEYWORDS) {
    const rolePattern = new RegExp(`\\b${escapeRegex(role)}\\b`, "i");
    if (rolePattern.test(remaining)) {
      intents.push({
        type: "role",
        value: role,
        label: `Role: ${role}`,
      });
      remaining = remaining.replace(rolePattern, "").trim();
      break;
    }
  }

  // 7. Clean up remaining text — remove common filler words
  const fillerPattern = /\b(show|find|search|list|get|all|the|for|me|who|are|is|with|and|or|contacts|people|outreach)\b/gi;
  remaining = remaining.replace(fillerPattern, "").replace(/\s+/g, " ").trim();

  // If remaining is just punctuation or very short, ignore it
  if (remaining.length <= 1) remaining = "";

  // If there's remaining text, treat it as a name search
  if (remaining) {
    intents.push({
      type: "name",
      value: remaining,
      label: `Name contains: "${remaining}"`,
    });
  }

  return {
    raw: query,
    freeText: remaining,
    intents,
  };
}

// ─── Scoring and Filtering ─────────────────────────────

/**
 * Score and rank people against a parsed smart search query.
 * Returns only matching results, sorted by score descending.
 */
export function executeSmartSearch(
  parsed: SmartSearchQuery,
  people: ParsedPerson[]
): SmartSearchResult[] {
  if (parsed.intents.length === 0 && !parsed.freeText) {
    return [];
  }

  const results: SmartSearchResult[] = [];

  for (const person of people) {
    let score = 0;
    const explanations: string[] = [];
    const matchedIntents: SearchIntent[] = [];

    for (const intent of parsed.intents) {
      const match = matchIntent(intent, person);
      if (match) {
        score += match.score;
        explanations.push(match.explanation);
        matchedIntents.push(intent);
      }
    }

    // Free text matching (name, email, title, org)
    if (parsed.freeText) {
      const freeTextScore = scoreFreeText(parsed.freeText, person);
      if (freeTextScore.score > 0) {
        score += freeTextScore.score;
        explanations.push(freeTextScore.explanation);
      }
    }

    // Must match at least one intent or free text
    if (score > 0 && (matchedIntents.length > 0 || explanations.length > 0)) {
      results.push({ personId: person.id, score, explanations, matchedIntents });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}

// ─── Intent Matching ───────────────────────────────────

function matchIntent(
  intent: SearchIntent,
  person: ParsedPerson
): { score: number; explanation: string } | null {
  switch (intent.type) {
    case "company": {
      if (!person.org) return null;
      const orgLower = person.org.toLowerCase();
      const valueLower = intent.value.toLowerCase();
      if (orgLower === valueLower) {
        return { score: 100, explanation: `Works at ${person.org}` };
      }
      if (orgLower.includes(valueLower) || valueLower.includes(orgLower)) {
        return { score: 80, explanation: `Organization matches "${intent.value}"` };
      }
      return null;
    }

    case "source": {
      if (!person.source) return null;
      const resolved = resolveSource(person.source);
      if (!resolved) return null;
      if (resolved.name.toLowerCase() === intent.value.toLowerCase()) {
        return { score: 50, explanation: `Source: ${resolved.name}` };
      }
      // Category match
      const targetSource = resolveSource(intent.value);
      if (targetSource && resolved.category === targetSource.category) {
        return { score: 30, explanation: `Source category: ${resolved.category}` };
      }
      return null;
    }

    case "owner": {
      // We don't have owner on Person in the current schema,
      // so this is a placeholder for when the field exists
      return null;
    }

    case "role": {
      if (!person.title) return null;
      const titleLower = person.title.toLowerCase();
      const roleLower = intent.value.toLowerCase();
      if (titleLower.includes(roleLower)) {
        return { score: 60, explanation: `Title "${person.title}" matches role "${intent.value}"` };
      }
      return null;
    }

    case "warmth": {
      const values = intent.value.split(",").map(Number);
      if (values.includes(person.warmth)) {
        const warmthLabels = ["Cold", "Warm", "Hot", "Champion"];
        return {
          score: 40,
          explanation: `Warmth: ${warmthLabels[person.warmth]}`,
        };
      }
      return null;
    }

    case "time": {
      const days = parseInt(intent.value);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const created = new Date(person.createdAt);
      if (created >= cutoff) {
        return {
          score: 30,
          explanation: `Added ${formatTimeAgo(created)}`,
        };
      }
      return null;
    }

    case "tag": {
      if (!person.tags || person.tags.length === 0) return null;
      const valueLower = intent.value.toLowerCase();
      const match = person.tags.find((t) => t.toLowerCase().includes(valueLower));
      if (match) {
        return { score: 40, explanation: `Tagged: ${match}` };
      }
      return null;
    }

    case "name": {
      return scoreFreeText(intent.value, person);
    }

    default:
      return null;
  }
}

function scoreFreeText(
  text: string,
  person: ParsedPerson
): { score: number; explanation: string } {
  const lower = text.toLowerCase();
  const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();

  // Exact name match
  if (fullName === lower) {
    return { score: 100, explanation: `Name matches "${text}"` };
  }

  // Name starts with
  if (fullName.startsWith(lower) || person.firstName.toLowerCase().startsWith(lower) || person.lastName.toLowerCase().startsWith(lower)) {
    return { score: 80, explanation: `Name starts with "${text}"` };
  }

  // Name contains
  if (fullName.includes(lower)) {
    return { score: 60, explanation: `Name contains "${text}"` };
  }

  // Email match
  if (person.email?.toLowerCase().includes(lower)) {
    return { score: 50, explanation: `Email contains "${text}"` };
  }

  // Title match
  if (person.title?.toLowerCase().includes(lower)) {
    return { score: 40, explanation: `Title contains "${text}"` };
  }

  // Org match
  if (person.org?.toLowerCase().includes(lower)) {
    return { score: 40, explanation: `Organization contains "${text}"` };
  }

  // Location match
  const location = [person.city, person.state, person.country].filter(Boolean).join(" ").toLowerCase();
  if (location.includes(lower)) {
    return { score: 30, explanation: `Location matches "${text}"` };
  }

  return { score: 0, explanation: "" };
}

// ─── Helpers ───────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

// ─── Example queries for placeholder rotation ──────────

export const SMART_SEARCH_EXAMPLES = [
  "people at Blackstone",
  "warm contacts from referrals",
  "new this week",
  "directors at Goldman",
  "hot champions from LinkedIn",
  "sourced by Gabe this month",
  "analysts from conferences",
  "VP contacts at Apollo",
  "people at funds",
  "contacts related to SpaceX",
  "directors at companies in healthcare",
  "investors in live deals",
];
