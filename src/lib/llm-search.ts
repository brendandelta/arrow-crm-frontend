/**
 * LLM-powered smart search — calls the Next.js API route that proxies to OpenAI,
 * then applies returned structured filters against people data client-side.
 */

import type { SmartSearchResult, ParsedPerson } from "./smart-search";

// ─── Types ─────────────────────────────────────────────

export interface LLMFilters {
  name?: string | null;
  company?: string | null;
  title?: string | null;
  source?: string | null;
  warmth?: number[] | null;
  location?: string | null;
  addedWithinDays?: number | null;
  email?: string | null;
  tags?: string[] | null;
  orgKind?: string[] | null;
  orgSector?: string | null;
  dealName?: string | null;
  dealSector?: string | null;
  dealStatus?: string[] | null;
}

export interface LLMIntent {
  type: string;
  label: string;
}

export interface LLMSearchResponse {
  filters: LLMFilters;
  explanation: string;
  intents: LLMIntent[];
  matchedPersonIds?: number[] | null;
  orgSectorMap?: Record<number, { sector: string | null; subSector: string | null }>;
}

// ─── API Call ──────────────────────────────────────────

export async function callLLMSearch(
  query: string,
  knownOrgs: string[],
  knownSources: string[]
): Promise<LLMSearchResponse> {
  const res = await fetch("/api/search/smart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, knownOrgs, knownSources }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Filter Application ───────────────────────────────

const FILTER_SCORES: Record<string, number> = {
  company: 100,
  name: 80,
  title: 60,
  source: 50,
  warmth: 40,
  time: 30,
  location: 30,
  email: 50,
  tags: 40,
  orgKind: 70,
  orgSector: 70,
  deal: 90,
};

export function applyLLMFilters(
  response: LLMSearchResponse,
  people: ParsedPerson[]
): SmartSearchResult[] {
  const { filters, matchedPersonIds, orgSectorMap } = response;
  const results: SmartSearchResult[] = [];

  // Pre-build a set for deal-matched person IDs for fast lookup
  const dealPersonIdSet = matchedPersonIds
    ? new Set(matchedPersonIds)
    : null;

  for (const person of people) {
    let score = 0;
    const explanations: string[] = [];
    let matchCount = 0;
    let filterCount = 0;

    // Company filter
    if (filters.company) {
      filterCount++;
      const companyLower = filters.company.toLowerCase();
      if (person.org) {
        const orgLower = person.org.toLowerCase();
        if (orgLower === companyLower) {
          score += FILTER_SCORES.company;
          explanations.push(`Works at ${person.org}`);
          matchCount++;
        } else if (orgLower.includes(companyLower) || companyLower.includes(orgLower)) {
          score += FILTER_SCORES.company * 0.8;
          explanations.push(`Organization matches "${filters.company}"`);
          matchCount++;
        }
      }
    }

    // Name filter
    if (filters.name) {
      filterCount++;
      const nameLower = filters.name.toLowerCase();
      const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
      if (fullName === nameLower) {
        score += FILTER_SCORES.name;
        explanations.push(`Name matches "${filters.name}"`);
        matchCount++;
      } else if (
        fullName.startsWith(nameLower) ||
        person.firstName.toLowerCase().startsWith(nameLower) ||
        person.lastName.toLowerCase().startsWith(nameLower)
      ) {
        score += FILTER_SCORES.name * 0.8;
        explanations.push(`Name starts with "${filters.name}"`);
        matchCount++;
      } else if (fullName.includes(nameLower)) {
        score += FILTER_SCORES.name * 0.6;
        explanations.push(`Name contains "${filters.name}"`);
        matchCount++;
      }
    }

    // Title filter
    if (filters.title) {
      filterCount++;
      const titleLower = filters.title.toLowerCase();
      if (person.title?.toLowerCase().includes(titleLower)) {
        score += FILTER_SCORES.title;
        explanations.push(`Title "${person.title}" matches "${filters.title}"`);
        matchCount++;
      }
    }

    // Source filter
    if (filters.source) {
      filterCount++;
      if (person.source) {
        const sourceLower = person.source.toLowerCase();
        const filterSourceLower = filters.source.toLowerCase();
        if (sourceLower === filterSourceLower) {
          score += FILTER_SCORES.source;
          explanations.push(`Source: ${person.source}`);
          matchCount++;
        } else if (sourceLower.includes(filterSourceLower)) {
          score += FILTER_SCORES.source * 0.6;
          explanations.push(`Source matches "${filters.source}"`);
          matchCount++;
        }
      }
    }

    // Warmth filter
    if (filters.warmth && filters.warmth.length > 0) {
      filterCount++;
      if (filters.warmth.includes(person.warmth)) {
        const warmthLabels = ["Cold", "Warm", "Hot", "Champion"];
        score += FILTER_SCORES.warmth;
        explanations.push(`Warmth: ${warmthLabels[person.warmth]}`);
        matchCount++;
      }
    }

    // Time filter (addedWithinDays)
    if (filters.addedWithinDays) {
      filterCount++;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filters.addedWithinDays);
      const created = new Date(person.createdAt);
      if (created >= cutoff) {
        score += FILTER_SCORES.time;
        explanations.push(`Added within last ${filters.addedWithinDays} days`);
        matchCount++;
      }
    }

    // Location filter
    if (filters.location) {
      filterCount++;
      const locationLower = filters.location.toLowerCase();
      const personLocation = [person.city, person.state, person.country]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (personLocation.includes(locationLower)) {
        score += FILTER_SCORES.location;
        explanations.push(`Location matches "${filters.location}"`);
        matchCount++;
      }
    }

    // Email filter
    if (filters.email) {
      filterCount++;
      if (person.email?.toLowerCase().includes(filters.email.toLowerCase())) {
        score += FILTER_SCORES.email;
        explanations.push(`Email matches "${filters.email}"`);
        matchCount++;
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filterCount++;
      if (person.tags && person.tags.length > 0) {
        const matchedTags = filters.tags.filter((tag) =>
          person.tags.some((pt) => pt.toLowerCase().includes(tag.toLowerCase()))
        );
        if (matchedTags.length > 0) {
          score += FILTER_SCORES.tags;
          explanations.push(`Tags: ${matchedTags.join(", ")}`);
          matchCount++;
        }
      }
    }

    // Org kind filter
    if (filters.orgKind && filters.orgKind.length > 0) {
      filterCount++;
      if (person.orgKind) {
        const kindLower = person.orgKind.toLowerCase();
        if (filters.orgKind.some((k) => k.toLowerCase() === kindLower)) {
          score += FILTER_SCORES.orgKind;
          explanations.push(`Organization type: ${person.orgKind}`);
          matchCount++;
        }
      }
    }

    // Org sector filter
    if (filters.orgSector && orgSectorMap) {
      filterCount++;
      if (person.orgId && orgSectorMap[person.orgId]) {
        const orgEntry = orgSectorMap[person.orgId];
        const sectorLower = filters.orgSector.toLowerCase();
        if (
          (orgEntry.sector && orgEntry.sector.toLowerCase().includes(sectorLower)) ||
          (orgEntry.subSector && orgEntry.subSector.toLowerCase().includes(sectorLower))
        ) {
          score += FILTER_SCORES.orgSector;
          explanations.push(`Org sector: ${orgEntry.sector || orgEntry.subSector}`);
          matchCount++;
        }
      }
    }

    // Deal context filter (dealName, dealSector, dealStatus resolved server-side)
    if (dealPersonIdSet && (filters.dealName || filters.dealSector || filters.dealStatus)) {
      filterCount++;
      if (dealPersonIdSet.has(person.id)) {
        score += FILTER_SCORES.deal;
        const dealLabel = filters.dealName
          ? `Connected to deal "${filters.dealName}"`
          : filters.dealSector
          ? `Connected to ${filters.dealSector} deal`
          : "Connected to matching deal";
        explanations.push(dealLabel);
        matchCount++;
      }
    }

    // Only include if the person matches ALL active filters (AND logic)
    if (filterCount > 0 && matchCount === filterCount) {
      results.push({
        personId: person.id,
        score,
        explanations,
        matchedIntents: response.intents.map((i) => ({
          type: i.type as "company" | "source" | "owner" | "role" | "warmth" | "time" | "tag" | "name" | "orgKind" | "orgSector" | "dealName" | "dealSector" | "dealStatus",
          value: "",
          label: i.label,
        })),
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}
