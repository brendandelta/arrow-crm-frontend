import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

interface SmartSearchRequest {
  query: string;
  knownOrgs: string[];
  knownSources: string[];
}

interface DealSummary {
  id: number;
  name: string;
  sector: string | null;
  status: string;
  kind: string;
}

interface OrgSummary {
  id: number;
  name: string;
  kind: string;
  sector: string | null;
}

interface OrgSectorEntry {
  sector: string | null;
  subSector: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body: SmartSearchRequest = await req.json();
    const { query, knownOrgs, knownSources } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-...") {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 503 }
      );
    }

    // Fetch deals and organizations in parallel for business context
    const [dealsRes, orgsRes] = await Promise.all([
      fetch(`${API_BASE}/api/deals`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch(`${API_BASE}/api/organizations`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]);

    const deals: DealSummary[] = Array.isArray(dealsRes) ? dealsRes : [];
    const orgs: OrgSummary[] = Array.isArray(orgsRes) ? orgsRes : [];

    // Extract business context
    const dealNames = [...new Set(deals.map((d) => d.name).filter(Boolean))];
    const dealSectors = [...new Set(deals.map((d) => d.sector).filter(Boolean) as string[])];
    const dealStatuses = [...new Set(deals.map((d) => d.status).filter(Boolean))];
    const orgKinds = [...new Set(orgs.map((o) => o.kind).filter(Boolean))];
    const orgSectors = [...new Set(orgs.map((o) => o.sector).filter(Boolean) as string[])];

    // Build orgSectorMap: { [orgId]: { sector, subSector } }
    const orgSectorMap: Record<number, OrgSectorEntry> = {};
    for (const org of orgs) {
      orgSectorMap[org.id] = { sector: org.sector, subSector: null };
    }

    const systemPrompt = buildSystemPrompt(
      knownOrgs,
      knownSources,
      dealNames,
      dealSectors,
      dealStatuses,
      orgKinds,
      orgSectors
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from LLM" },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(content);

    // If deal filters are present, resolve to person IDs
    let matchedPersonIds: number[] | null = null;
    const filters = parsed.filters ?? {};

    if (filters.dealName || filters.dealSector || filters.dealStatus) {
      // Find matching deals
      let matchingDeals = deals;

      if (filters.dealName) {
        const dealNameLower = filters.dealName.toLowerCase();
        matchingDeals = matchingDeals.filter(
          (d) => d.name && d.name.toLowerCase().includes(dealNameLower)
        );
      }
      if (filters.dealSector) {
        const sectorLower = filters.dealSector.toLowerCase();
        matchingDeals = matchingDeals.filter(
          (d) => d.sector && d.sector.toLowerCase().includes(sectorLower)
        );
      }
      if (filters.dealStatus && Array.isArray(filters.dealStatus)) {
        const statusSet = new Set(
          filters.dealStatus.map((s: string) => s.toLowerCase())
        );
        matchingDeals = matchingDeals.filter(
          (d) => d.status && statusSet.has(d.status.toLowerCase())
        );
      }

      // Fetch top 5 deal details in parallel to extract person IDs
      const topDeals = matchingDeals.slice(0, 5);
      const personIdSet = new Set<number>();

      if (topDeals.length > 0) {
        const dealDetails = await Promise.all(
          topDeals.map((d) =>
            fetch(`${API_BASE}/api/deals/${d.id}`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        );

        for (const detail of dealDetails) {
          if (!detail) continue;

          // Extract person IDs from interests
          if (Array.isArray(detail.interests)) {
            for (const interest of detail.interests) {
              if (interest.contact?.id) personIdSet.add(interest.contact.id);
              if (interest.decisionMaker?.id) personIdSet.add(interest.decisionMaker.id);
            }
          }

          // Extract person IDs from blocks
          if (Array.isArray(detail.blocks)) {
            for (const block of detail.blocks) {
              if (block.contact?.id) personIdSet.add(block.contact.id);
              if (block.brokerContact?.id) personIdSet.add(block.brokerContact.id);
            }
          }

          // Extract person IDs from targets
          if (Array.isArray(detail.targets)) {
            for (const target of detail.targets) {
              if (target.targetType === "Person" && target.targetId) {
                personIdSet.add(target.targetId);
              }
            }
          }
        }

        matchedPersonIds = [...personIdSet];
      }
    }

    return NextResponse.json({
      filters: parsed.filters,
      explanation: parsed.explanation,
      intents: parsed.intents,
      matchedPersonIds,
      orgSectorMap,
    });
  } catch (error: unknown) {
    console.error("Smart search API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildSystemPrompt(
  knownOrgs: string[],
  knownSources: string[],
  dealNames: string[],
  dealSectors: string[],
  dealStatuses: string[],
  orgKinds: string[],
  orgSectors: string[]
): string {
  return `You are a search query parser for a CRM (Customer Relationship Management) application focused on deal-making, investments, and relationship management. Your job is to interpret natural language search queries about people/contacts and return structured JSON filters.

## Person Schema
Each person has these fields:
- firstName, lastName: person's name
- title: job title (e.g., "Managing Director", "VP of Sales", "Analyst")
- org: organization/company name
- orgKind: type of organization (e.g., "fund", "company", "bank", "broker", "service_provider")
- email: email address
- warmth: relationship warmth level (0=Cold, 1=Warm, 2=Hot, 3=Champion)
- source: how the contact was acquired
- tags: array of tag strings
- city, state, country: location fields
- createdAt: when the contact was added
- lastContactedAt: when they were last contacted

## Business Context
This CRM tracks deals (investments/transactions), organizations (funds, companies, banks, brokers), and people (contacts).
- People can be connected to deals as investors (interests), sellers (blocks), or outreach targets.
- Organizations have a kind (fund, company, bank, broker, service_provider) and may have a sector.
- Deals have a name, sector, status, and kind.

## Known Organizations
${knownOrgs.length > 0 ? knownOrgs.slice(0, 100).join(", ") : "(none provided)"}

## Known Sources
${knownSources.length > 0 ? knownSources.join(", ") : "LinkedIn, Conference, Referral, Cold Outreach, Email Campaign, Website, Warm Intro, Dinner/Event, Roadshow, Inbound, RFP, Co-Investor, Cold Call, Research, Existing Relationship"}

## Known Organization Types
${orgKinds.length > 0 ? orgKinds.join(", ") : "fund, company, bank, broker, service_provider, other"}

## Known Organization Sectors
${orgSectors.length > 0 ? orgSectors.slice(0, 50).join(", ") : "(none provided)"}

## Known Deal Names
${dealNames.length > 0 ? dealNames.slice(0, 50).join(", ") : "(none provided)"}

## Known Deal Sectors
${dealSectors.length > 0 ? dealSectors.join(", ") : "(none provided)"}

## Known Deal Statuses
${dealStatuses.length > 0 ? dealStatuses.join(", ") : "live, sourcing, closing, closed, dead"}

## Output Format
Return a JSON object with exactly these fields:
{
  "filters": {
    "name": string | null,            // substring to match against first/last name
    "company": string | null,          // substring to match against organization
    "title": string | null,            // substring to match against job title
    "source": string | null,           // exact source name (match to known sources)
    "warmth": number[] | null,         // warmth levels to include, e.g. [2, 3]
    "location": string | null,         // substring to match city/state/country
    "addedWithinDays": number | null,  // contacts added within N days
    "email": string | null,            // substring to match email
    "tags": string[] | null,           // tags to match
    "orgKind": string[] | null,        // organization types, e.g. ["fund", "company"]
    "orgSector": string | null,        // organization sector to match
    "dealName": string | null,         // deal name to match (finds people connected to this deal)
    "dealSector": string | null,       // deal sector to match (finds people connected to deals in this sector)
    "dealStatus": string[] | null      // deal statuses to match, e.g. ["live", "closing"]
  },
  "explanation": string,               // 1-sentence summary of what the query means
  "intents": [                         // parsed intent chips for UI display
    { "type": string, "label": string }
  ]
}

## Rules
- Only set filter fields that are relevant to the query. Set irrelevant fields to null.
- For warmth: Cold=0, Warm=1, Hot=2, Champion=3. "engaged" means [2,3]. "not cold" means [1,2,3].
- For source: match the user's input to the closest known source name. "LI" or "linkedin" → "LinkedIn". "conference" → "Conference".
- For time: "this week" = 7 days, "this month" = 30, "recently"/"new" = 14-30, "last quarter" = 90.
- For title: extract role keywords like "director", "VP", "analyst", "partner", "CEO", etc.
- For company: try to match to known organizations. If not found, use the company name as-is.
- For orgKind: when the user mentions "funds", "investors" (as an org type), "companies", "banks", "brokers", set the appropriate values. Use lowercase. "people at funds" → orgKind: ["fund"].
- For orgSector: when the user mentions an industry/sector for the organization, set this. "companies in healthcare" → orgSector: "healthcare".
- For dealName: when the user asks about people related to a specific deal, set this to the deal name. Match to known deal names when possible. "contacts related to SpaceX" → dealName: "SpaceX".
- For dealSector: when the user asks about people connected to deals in a certain sector, set this. "investors in tech deals" → dealSector: "technology".
- For dealStatus: when the user references deal status, set this. "investors in live deals" → dealStatus: ["live"].
- The "intents" array should have one entry per active filter, with a human-readable label.
- Intent type should be one of: "company", "source", "role", "warmth", "time", "location", "name", "tag", "email", "orgKind", "orgSector", "dealName", "dealSector", "dealStatus".

## Examples

Query: "directors at Blackstone"
{
  "filters": { "name": null, "company": "Blackstone", "title": "director", "source": null, "warmth": null, "location": null, "addedWithinDays": null, "email": null, "tags": null, "orgKind": null, "orgSector": null, "dealName": null, "dealSector": null, "dealStatus": null },
  "explanation": "People with Director in their title at Blackstone",
  "intents": [{ "type": "role", "label": "Role: Director" }, { "type": "company", "label": "Company: Blackstone" }]
}

Query: "warm contacts from LinkedIn added recently"
{
  "filters": { "name": null, "company": null, "title": null, "source": "LinkedIn", "warmth": [1], "location": null, "addedWithinDays": 30, "email": null, "tags": null, "orgKind": null, "orgSector": null, "dealName": null, "dealSector": null, "dealStatus": null },
  "explanation": "Warm contacts sourced from LinkedIn that were added in the last 30 days",
  "intents": [{ "type": "warmth", "label": "Warmth: Warm" }, { "type": "source", "label": "Source: LinkedIn" }, { "type": "time", "label": "Added recently" }]
}

Query: "people at funds"
{
  "filters": { "name": null, "company": null, "title": null, "source": null, "warmth": null, "location": null, "addedWithinDays": null, "email": null, "tags": null, "orgKind": ["fund"], "orgSector": null, "dealName": null, "dealSector": null, "dealStatus": null },
  "explanation": "People who work at fund-type organizations",
  "intents": [{ "type": "orgKind", "label": "Org Type: Fund" }]
}

Query: "contacts related to SpaceX"
{
  "filters": { "name": null, "company": null, "title": null, "source": null, "warmth": null, "location": null, "addedWithinDays": null, "email": null, "tags": null, "orgKind": null, "orgSector": null, "dealName": "SpaceX", "dealSector": null, "dealStatus": null },
  "explanation": "All people connected to the SpaceX deal as investors, sellers, or outreach targets",
  "intents": [{ "type": "dealName", "label": "Deal: SpaceX" }]
}

Query: "directors at companies in healthcare"
{
  "filters": { "name": null, "company": null, "title": "director", "source": null, "warmth": null, "location": null, "addedWithinDays": null, "email": null, "tags": null, "orgKind": ["company"], "orgSector": "healthcare", "dealName": null, "dealSector": null, "dealStatus": null },
  "explanation": "Directors at company-type organizations in the healthcare sector",
  "intents": [{ "type": "role", "label": "Role: Director" }, { "type": "orgKind", "label": "Org Type: Company" }, { "type": "orgSector", "label": "Org Sector: Healthcare" }]
}

Query: "investors in live deals"
{
  "filters": { "name": null, "company": null, "title": null, "source": null, "warmth": null, "location": null, "addedWithinDays": null, "email": null, "tags": null, "orgKind": null, "orgSector": null, "dealName": null, "dealSector": null, "dealStatus": ["live"] },
  "explanation": "People who are investors in currently live deals",
  "intents": [{ "type": "dealStatus", "label": "Deal Status: Live" }]
}

Query: "VPs in New York"
{
  "filters": { "name": null, "company": null, "title": "VP", "source": null, "warmth": null, "location": "New York", "addedWithinDays": null, "email": null, "tags": null, "orgKind": null, "orgSector": null, "dealName": null, "dealSector": null, "dealStatus": null },
  "explanation": "Vice Presidents located in New York",
  "intents": [{ "type": "role", "label": "Role: VP" }, { "type": "location", "label": "Location: New York" }]
}

Query: "john smith"
{
  "filters": { "name": "john smith", "company": null, "title": null, "source": null, "warmth": null, "location": null, "addedWithinDays": null, "email": null, "tags": null, "orgKind": null, "orgSector": null, "dealName": null, "dealSector": null, "dealStatus": null },
  "explanation": "Searching for a person named John Smith",
  "intents": [{ "type": "name", "label": "Name: john smith" }]
}

Now parse the following user query and return the JSON:`;
}
