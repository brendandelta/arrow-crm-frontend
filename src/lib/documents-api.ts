// Documents API types and helpers

export interface DocumentLink {
  id: number;
  linkableType: 'Deal' | 'Block' | 'Interest' | 'Organization' | 'Person' | 'InternalEntity';
  linkableId: number;
  relationship: string;
  relationshipLabel?: string;
  label: string;
  linkableLabel?: string;
  visibility?: string;
  visibilityLabel?: string;
}

export interface DocumentFile {
  filename: string;
  contentType: string | null;
  byteSize: number | null;
}

export interface DocumentSummary {
  id: number;
  name: string;
  title: string;
  description: string | null;
  category: string | null;
  categoryLabel: string | null;
  docType: string | null;
  status: string | null;
  statusLabel: string | null;
  source: string | null;
  sourceLabel: string | null;
  sensitivity: string | null;
  sensitivityLabel: string | null;
  isImage: boolean;
  isPdf: boolean;
  version: number | null;
  file: DocumentFile;
  links: DocumentLink[];
  uploadedBy: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: number;
  version: number;
  status: string;
  filename: string;
  createdAt: string;
}

export interface DocumentDetail extends DocumentSummary {
  fileType: string | null;
  fileSizeBytes: number | null;
  fileSizeMb: number | null;
  fileExtension: string | null;
  isSpreadsheet: boolean;
  isDocument: boolean;
  url: string | null;
  fileUrl: string | null;
  previewUrl?: string | null;
  versionGroupId: string | null;
  isLatestVersion: boolean;
  checksum: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  isConfidential: boolean;
  versions: DocumentVersion[];
  parentType: string | null;
  parentId: number | null;
}

export interface FacetItem {
  value: string;
  label: string;
  count: number;
}

export interface DocumentFacets {
  category: FacetItem[];
  docType: FacetItem[];
  status: FacetItem[];
  sensitivity: FacetItem[];
  linkableType: FacetItem[];
}

export interface PageInfo {
  page: number;
  perPage: number;
  total: number;
}

export interface DocumentsResponse {
  documents: DocumentSummary[];
  pageInfo: PageInfo;
  facets: DocumentFacets;
}

export interface DocumentFilters {
  q?: string;
  category?: string[];
  docType?: string[];
  status?: string[];
  sensitivity?: string[];
  linkableType?: string;
  linkableId?: number;
  confidential?: boolean;
  needsReview?: boolean;
  updatedAfter?: string;
  updatedBefore?: string;
  sort?: 'title' | 'updatedAt' | 'createdAt';
  page?: number;
  perPage?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper to parse error responses from the API
async function parseApiError(res: Response, defaultMessage: string): Promise<Error> {
  try {
    const data = await res.json();
    const message = data.error || data.message || (data.errors && data.errors[0]) || defaultMessage;
    const error = new Error(message);
    (error as Error & { status?: number }).status = res.status;
    return error;
  } catch {
    return new Error(defaultMessage);
  }
}

export async function fetchDocuments(filters: DocumentFilters = {}): Promise<DocumentsResponse> {
  const params = new URLSearchParams();

  if (filters.q) params.append('q', filters.q);
  if (filters.category?.length) {
    filters.category.forEach(c => params.append('category[]', c));
  }
  if (filters.docType?.length) {
    filters.docType.forEach(d => params.append('doc_type[]', d));
  }
  if (filters.status?.length) {
    filters.status.forEach(s => params.append('status[]', s));
  }
  if (filters.sensitivity?.length) {
    filters.sensitivity.forEach(s => params.append('sensitivity[]', s));
  }
  if (filters.linkableType) params.append('linkable_type', filters.linkableType);
  if (filters.linkableId) params.append('linkable_id', filters.linkableId.toString());
  if (filters.confidential) params.append('confidential', 'true');
  if (filters.needsReview) params.append('needs_review', 'true');
  if (filters.updatedAfter) params.append('updated_after', filters.updatedAfter);
  if (filters.updatedBefore) params.append('updated_before', filters.updatedBefore);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.perPage) params.append('per_page', filters.perPage.toString());

  const res = await fetch(`${API_BASE}/api/documents?${params.toString()}`);
  if (!res.ok) throw await parseApiError(res, 'Failed to fetch documents');
  return res.json();
}

export async function fetchDocument(id: number): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE}/api/documents/${id}`);
  if (!res.ok) throw await parseApiError(res, 'Failed to fetch document');
  return res.json();
}

export async function updateDocument(id: number, data: Partial<DocumentDetail>): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE}/api/documents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await parseApiError(res, 'Failed to update document');
  return res.json();
}

export async function deleteDocument(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/documents/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw await parseApiError(res, 'Failed to delete document');
}

export async function uploadDocument(
  file: File,
  metadata: {
    title?: string;
    description?: string;
    category?: string;
    docType?: string;
    status?: string;
    sensitivity?: string;
    links?: Array<{ linkableType: string; linkableId: number; relationship?: string }>;
  }
): Promise<DocumentDetail> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', file.name);
  if (metadata.title) formData.append('title', metadata.title);
  if (metadata.description) formData.append('description', metadata.description);
  if (metadata.category) formData.append('category', metadata.category);
  if (metadata.docType) formData.append('doc_type', metadata.docType);
  if (metadata.status) formData.append('status', metadata.status);
  if (metadata.sensitivity) formData.append('sensitivity', metadata.sensitivity);
  if (metadata.links) {
    metadata.links.forEach((link, i) => {
      formData.append(`links[${i}][linkable_type]`, link.linkableType);
      formData.append(`links[${i}][linkable_id]`, link.linkableId.toString());
      if (link.relationship) formData.append(`links[${i}][relationship]`, link.relationship);
    });
  }

  const res = await fetch(`${API_BASE}/api/documents`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw await parseApiError(res, 'Failed to upload document');
  return res.json();
}

export async function uploadNewVersion(
  documentId: number,
  file: File
): Promise<DocumentDetail> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', file.name);

  const res = await fetch(`${API_BASE}/api/documents/${documentId}/new_version`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw await parseApiError(res, 'Failed to upload new version');
  return res.json();
}

export async function createDocumentLink(
  documentId: number,
  linkableType: string,
  linkableId: number,
  relationship: string = 'general'
): Promise<DocumentLink> {
  const res = await fetch(`${API_BASE}/api/document_links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: documentId,
      linkable_type: linkableType,
      linkable_id: linkableId,
      relationship,
    }),
  });
  if (!res.ok) throw await parseApiError(res, 'Failed to create document link');
  return res.json();
}

export async function deleteDocumentLink(linkId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/document_links/${linkId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw await parseApiError(res, 'Failed to delete document link');
}

// Category, status, and sensitivity options
export const DOCUMENT_CATEGORIES = [
  { value: 'deal', label: 'Deal' },
  { value: 'entity', label: 'Entity' },
  { value: 'tax', label: 'Tax' },
  { value: 'banking', label: 'Banking' },
  { value: 'legal', label: 'Legal' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'research', label: 'Research' },
  { value: 'other', label: 'Other' },
];

export const DOCUMENT_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'final', label: 'Final' },
  { value: 'executed', label: 'Executed' },
  { value: 'superseded', label: 'Superseded' },
];

export const DOCUMENT_SENSITIVITIES = [
  { value: 'public', label: 'Public' },
  { value: 'internal', label: 'Internal' },
  { value: 'confidential', label: 'Confidential' },
  { value: 'highly_confidential', label: 'Highly Confidential' },
];

export const DOCUMENT_RELATIONSHIPS = [
  { value: 'general', label: 'General' },
  { value: 'deal_material', label: 'Deal Material' },
  { value: 'entity_tax', label: 'Entity Tax' },
  { value: 'entity_banking', label: 'Entity Banking' },
  { value: 'entity_governing', label: 'Entity Governing' },
  { value: 'diligence', label: 'Diligence' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'ops', label: 'Operations' },
];

export const LINKABLE_TYPES = [
  { value: 'Deal', label: 'Deal', icon: 'Briefcase' },
  { value: 'Block', label: 'Block', icon: 'Package' },
  { value: 'Interest', label: 'Interest', icon: 'TrendingUp' },
  { value: 'Organization', label: 'Organization', icon: 'Building2' },
  { value: 'Person', label: 'Person', icon: 'User' },
  { value: 'InternalEntity', label: 'Internal Entity', icon: 'Shield' },
];

// Helper to format file size
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Helper to get file icon based on extension/type
export function getFileIconType(doc: DocumentSummary | DocumentDetail): 'pdf' | 'image' | 'spreadsheet' | 'document' | 'other' {
  if (doc.isPdf) return 'pdf';
  if (doc.isImage) return 'image';
  if ('isSpreadsheet' in doc && doc.isSpreadsheet) return 'spreadsheet';
  if ('isDocument' in doc && doc.isDocument) return 'document';
  return 'other';
}

// ============ Entity Search Types ============

export interface SearchResult {
  id: number;
  label: string;
  subtitle?: string;
  type: string;
}

export interface DealSearchResult extends SearchResult {
  type: 'Deal';
  status?: string;
  companyName?: string;
}

export interface BlockSearchResult extends SearchResult {
  type: 'Block';
  dealName?: string;
  sellerName?: string;
  status?: string;
}

export interface InterestSearchResult extends SearchResult {
  type: 'Interest';
  dealName?: string;
  investorName?: string;
  status?: string;
}

export interface OrganizationSearchResult extends SearchResult {
  type: 'Organization';
  kind?: string;
}

export interface PersonSearchResult extends SearchResult {
  type: 'Person';
  title?: string;
  orgName?: string;
}

export interface InternalEntitySearchResult extends SearchResult {
  type: 'InternalEntity';
  entityType?: string;
}

// ============ Entity Search Functions ============

export async function searchDeals(query: string): Promise<DealSearchResult[]> {
  const params = new URLSearchParams({ q: query, per_page: '20' });
  const res = await fetch(`${API_BASE}/api/deals?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.deals || data || []).map((d: { id: number; name: string; status?: string; company?: { name: string } }) => ({
    id: d.id,
    label: d.name,
    subtitle: d.company?.name || d.status,
    type: 'Deal' as const,
    status: d.status,
    companyName: d.company?.name,
  }));
}

export async function searchBlocks(query: string, dealId?: number): Promise<BlockSearchResult[]> {
  const params = new URLSearchParams({ per_page: '20' });
  if (dealId) params.append('deal_id', dealId.toString());
  const res = await fetch(`${API_BASE}/api/blocks?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  const blocks = data.blocks || data || [];
  return blocks
    .filter((b: { seller?: { name: string } }) =>
      !query || b.seller?.name?.toLowerCase().includes(query.toLowerCase())
    )
    .map((b: { id: number; seller?: { name: string }; deal?: { name: string }; status?: string }) => ({
      id: b.id,
      label: `Block: ${b.seller?.name || 'Unknown Seller'}`,
      subtitle: b.deal?.name || b.status,
      type: 'Block' as const,
      dealName: b.deal?.name,
      sellerName: b.seller?.name,
      status: b.status,
    }));
}

export async function searchInterests(query: string, dealId?: number): Promise<InterestSearchResult[]> {
  const params = new URLSearchParams({ per_page: '20' });
  if (dealId) params.append('deal_id', dealId.toString());
  const res = await fetch(`${API_BASE}/api/interests?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  const interests = data.interests || data || [];
  return interests
    .filter((i: { investor?: { name: string } }) =>
      !query || i.investor?.name?.toLowerCase().includes(query.toLowerCase())
    )
    .map((i: { id: number; investor?: { name: string }; deal?: { name: string }; status?: string }) => ({
      id: i.id,
      label: `Interest: ${i.investor?.name || 'Unknown Investor'}`,
      subtitle: i.deal?.name || i.status,
      type: 'Interest' as const,
      dealName: i.deal?.name,
      investorName: i.investor?.name,
      status: i.status,
    }));
}

export async function searchOrganizations(query: string): Promise<OrganizationSearchResult[]> {
  const params = new URLSearchParams({ q: query, per_page: '20' });
  const res = await fetch(`${API_BASE}/api/organizations?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.organizations || data || []).map((o: { id: number; name: string; kind?: string }) => ({
    id: o.id,
    label: o.name,
    subtitle: o.kind,
    type: 'Organization' as const,
    kind: o.kind,
  }));
}

export async function searchPeople(query: string): Promise<PersonSearchResult[]> {
  const params = new URLSearchParams({ q: query, per_page: '20' });
  const res = await fetch(`${API_BASE}/api/people?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.people || data || []).map((p: { id: number; firstName: string; lastName: string; title?: string; organization?: { name: string } }) => ({
    id: p.id,
    label: `${p.firstName} ${p.lastName}`,
    subtitle: p.title || p.organization?.name,
    type: 'Person' as const,
    title: p.title,
    orgName: p.organization?.name,
  }));
}

export async function searchInternalEntities(query: string): Promise<InternalEntitySearchResult[]> {
  const params = new URLSearchParams({ q: query, per_page: '20' });
  const res = await fetch(`${API_BASE}/api/internal_entities?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.internalEntities || data.internal_entities || data || []).map((e: { id: number; name?: string; displayName?: string; entityType?: string }) => ({
    id: e.id,
    label: e.displayName || e.name || `Entity #${e.id}`,
    subtitle: e.entityType,
    type: 'InternalEntity' as const,
    entityType: e.entityType,
  }));
}

// Generic search function that routes to the appropriate search
export async function searchEntities(
  type: string,
  query: string,
  options?: { dealId?: number }
): Promise<SearchResult[]> {
  switch (type) {
    case 'Deal':
      return searchDeals(query);
    case 'Block':
      return searchBlocks(query, options?.dealId);
    case 'Interest':
      return searchInterests(query, options?.dealId);
    case 'Organization':
      return searchOrganizations(query);
    case 'Person':
      return searchPeople(query);
    case 'InternalEntity':
      return searchInternalEntities(query);
    default:
      return [];
  }
}
