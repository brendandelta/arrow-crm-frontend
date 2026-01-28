// Documents API types and helpers

export interface DocumentLink {
  id: number;
  linkableType: 'Deal' | 'Organization' | 'Person' | 'InternalEntity';
  linkableId: number;
  relationship: string;
  relationshipLabel?: string;
  label: string;
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
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function fetchDocument(id: number): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE}/api/documents/${id}`);
  if (!res.ok) throw new Error('Failed to fetch document');
  return res.json();
}

export async function updateDocument(id: number, data: Partial<DocumentDetail>): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE}/api/documents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update document');
  return res.json();
}

export async function deleteDocument(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/documents/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete document');
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
  if (!res.ok) throw new Error('Failed to upload document');
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
  if (!res.ok) throw new Error('Failed to upload new version');
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
  if (!res.ok) throw new Error('Failed to create document link');
  return res.json();
}

export async function deleteDocumentLink(linkId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/document_links/${linkId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete document link');
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
