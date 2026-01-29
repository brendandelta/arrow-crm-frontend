// Internal Entities API types and helpers

export interface EntityStats {
  bankAccountsCount: number;
  signersCount: number;
  documentsCount: number;
}

export interface InternalEntitySummary {
  id: number;
  nameLegal: string;
  nameShort: string | null;
  displayName: string;
  entityType: string;
  entityTypeLabel: string;
  jurisdictionCountry: string | null;
  jurisdictionState: string | null;
  formationDate: string | null;
  status: string;
  statusLabel: string;
  einMasked: string | null;
  einLast4: string | null;
  stats: EntityStats;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountMasked {
  id: number;
  bankName: string;
  accountName: string;
  accountType: string;
  accountTypeLabel: string;
  routingMasked: string | null;
  accountMasked: string | null;
  routingLast4: string | null;
  accountLast4: string | null;
  nickname: string | null;
  isPrimary: boolean;
  status: string;
  statusLabel: string;
}

export interface EntitySigner {
  id: number;
  personId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  roleLabel: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  statusLabel: string;
}

export interface EntityDocument {
  id: number;
  linkId: number;
  name: string;
  title: string;
  category: string;
  docType: string;
  status: string;
  relationship: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedDeal {
  id: number;
  name: string;
  status: string;
  company: string | null;
}

export interface InternalEntityDetail {
  id: number;
  nameLegal: string;
  nameShort: string | null;
  displayName: string;
  entityType: string;
  entityTypeLabel: string;
  jurisdictionCountry: string | null;
  jurisdictionState: string | null;
  fullJurisdiction: string | null;
  formationDate: string | null;
  status: string;
  statusLabel: string;
  einMasked: string | null;
  einLast4: string | null;
  einPresent: boolean;
  taxClassification: string | null;
  taxClassificationLabel: string | null;
  sCorpEffectiveDate: string | null;
  registeredAgentName: string | null;
  registeredAgentAddress: string | null;
  primaryAddress: string | null;
  mailingAddress: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  bankAccounts: BankAccountMasked[];
  signers: EntitySigner[];
  documents: EntityDocument[];
  documentsCount: number;
  linkedDeals: LinkedDeal[];
  createdBy: { id: number; name: string } | null;
  updatedBy: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface FacetItem {
  value: string;
  count: number;
}

export interface EntityFacets {
  entityType: FacetItem[];
  status: FacetItem[];
  jurisdictionState: FacetItem[];
}

export interface EntityListResponse {
  internalEntities: InternalEntitySummary[];
  facets: EntityFacets;
  pageInfo: {
    page: number;
    perPage: number;
    total: number;
  };
}

export interface EntityFilters {
  q?: string;
  status?: string[];
  entityType?: string[];
  jurisdictionState?: string[];
  hasBankAccounts?: boolean;
  hasSigners?: boolean;
  hasDocuments?: boolean;
  sort?: 'name' | 'updatedAt' | 'formationDate';
  page?: number;
  perPage?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper to get auth headers from session storage
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const session = localStorage.getItem('arrow_session');
  if (!session) {
    console.warn('[Internal Entities API] No session found');
    return {};
  }

  try {
    const data = JSON.parse(session);
    if (data.backendUserId) {
      return { 'X-User-Id': data.backendUserId.toString() };
    }
    console.warn('[Internal Entities API] Session missing backendUserId - try logging out and back in');
  } catch {
    console.error('[Internal Entities API] Invalid session data');
  }
  return {};
}

// Helper for authenticated fetch
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
}

// Fetch internal entities with filters
export async function fetchInternalEntities(filters: EntityFilters = {}): Promise<EntityListResponse> {
  const params = new URLSearchParams();

  if (filters.q) params.append('q', filters.q);
  if (filters.status?.length) {
    filters.status.forEach(s => params.append('status[]', s));
  }
  if (filters.entityType?.length) {
    filters.entityType.forEach(t => params.append('entity_type[]', t));
  }
  if (filters.jurisdictionState?.length) {
    filters.jurisdictionState.forEach(s => params.append('jurisdiction_state[]', s));
  }
  if (filters.hasBankAccounts !== undefined) {
    params.append('has_bank_accounts', filters.hasBankAccounts.toString());
  }
  if (filters.hasSigners !== undefined) {
    params.append('has_signers', filters.hasSigners.toString());
  }
  if (filters.hasDocuments !== undefined) {
    params.append('has_documents', filters.hasDocuments.toString());
  }
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.perPage) params.append('per_page', filters.perPage.toString());

  const res = await authFetch(`${API_BASE}/api/internal_entities?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch internal entities');
  return res.json();
}

// Fetch single internal entity
export async function fetchInternalEntity(id: number): Promise<InternalEntityDetail> {
  const res = await authFetch(`${API_BASE}/api/internal_entities/${id}`);
  if (!res.ok) throw new Error('Failed to fetch internal entity');
  return res.json();
}

// Create internal entity
export interface CreateEntityData {
  nameLegal: string;
  nameShort?: string;
  entityType: string;
  jurisdictionCountry?: string;
  jurisdictionState?: string;
  formationDate?: string;
  status?: string;
  taxClassification?: string;
  ein?: string;
}

export async function createInternalEntity(data: CreateEntityData): Promise<InternalEntityDetail> {
  const res = await authFetch(`${API_BASE}/api/internal_entities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name_legal: data.nameLegal,
      name_short: data.nameShort,
      entity_type: data.entityType,
      jurisdiction_country: data.jurisdictionCountry || 'US',
      jurisdiction_state: data.jurisdictionState,
      formation_date: data.formationDate,
      status: data.status || 'active',
      tax_classification: data.taxClassification,
      ein: data.ein,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    if (res.status === 403) {
      throw new Error('Permission denied - please log out and log back in to refresh your session');
    }
    throw new Error(error.error || error.errors?.join(', ') || 'Failed to create internal entity');
  }
  return res.json();
}

// Update internal entity
export async function updateInternalEntity(
  id: number,
  data: Partial<CreateEntityData> & {
    registeredAgentName?: string;
    registeredAgentAddress?: string;
    primaryAddress?: string;
    mailingAddress?: string;
    notes?: string;
    sCorpEffectiveDate?: string;
  }
): Promise<InternalEntityDetail> {
  const payload: Record<string, unknown> = {};

  if (data.nameLegal !== undefined) payload.name_legal = data.nameLegal;
  if (data.nameShort !== undefined) payload.name_short = data.nameShort;
  if (data.entityType !== undefined) payload.entity_type = data.entityType;
  if (data.jurisdictionCountry !== undefined) payload.jurisdiction_country = data.jurisdictionCountry;
  if (data.jurisdictionState !== undefined) payload.jurisdiction_state = data.jurisdictionState;
  if (data.formationDate !== undefined) payload.formation_date = data.formationDate;
  if (data.status !== undefined) payload.status = data.status;
  if (data.taxClassification !== undefined) payload.tax_classification = data.taxClassification;
  if (data.ein !== undefined) payload.ein = data.ein;
  if (data.registeredAgentName !== undefined) payload.registered_agent_name = data.registeredAgentName;
  if (data.registeredAgentAddress !== undefined) payload.registered_agent_address = data.registeredAgentAddress;
  if (data.primaryAddress !== undefined) payload.primary_address = data.primaryAddress;
  if (data.mailingAddress !== undefined) payload.mailing_address = data.mailingAddress;
  if (data.notes !== undefined) payload.notes = data.notes;
  if (data.sCorpEffectiveDate !== undefined) payload.s_corp_effective_date = data.sCorpEffectiveDate;

  const res = await authFetch(`${API_BASE}/api/internal_entities/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update internal entity');
  return res.json();
}

// Delete internal entity (soft delete - sets status to dissolved)
export async function deleteInternalEntity(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/api/internal_entities/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error('You do not have permission to delete entities');
    throw new Error('Failed to delete internal entity');
  }
}

// Reveal EIN
export async function revealEin(entityId: number): Promise<{ ein: string | null }> {
  const res = await authFetch(`${API_BASE}/api/internal_entities/${entityId}/reveal_ein`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error('You do not have permission to reveal EIN');
    throw new Error('Failed to reveal EIN');
  }
  return res.json();
}

// Bank Account operations
export interface CreateBankAccountData {
  bankName: string;
  accountName: string;
  accountType: string;
  nickname?: string;
  isPrimary?: boolean;
  routingNumber: string;
  accountNumber: string;
  swift?: string;
}

export async function createBankAccount(
  entityId: number,
  data: CreateBankAccountData
): Promise<BankAccountMasked> {
  const res = await authFetch(`${API_BASE}/api/internal_entities/${entityId}/bank_accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bank_name: data.bankName,
      account_name: data.accountName,
      account_type: data.accountType,
      nickname: data.nickname,
      is_primary: data.isPrimary || false,
      routing_number: data.routingNumber,
      account_number: data.accountNumber,
      swift: data.swift,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.errors?.join(', ') || 'Failed to create bank account');
  }
  return res.json();
}

export async function updateBankAccount(
  id: number,
  data: Partial<CreateBankAccountData> & { status?: string }
): Promise<BankAccountMasked> {
  const payload: Record<string, unknown> = {};

  if (data.bankName !== undefined) payload.bank_name = data.bankName;
  if (data.accountName !== undefined) payload.account_name = data.accountName;
  if (data.accountType !== undefined) payload.account_type = data.accountType;
  if (data.nickname !== undefined) payload.nickname = data.nickname;
  if (data.isPrimary !== undefined) payload.is_primary = data.isPrimary;
  if (data.routingNumber !== undefined) payload.routing_number = data.routingNumber;
  if (data.accountNumber !== undefined) payload.account_number = data.accountNumber;
  if (data.swift !== undefined) payload.swift = data.swift;
  if (data.status !== undefined) payload.status = data.status;

  const res = await authFetch(`${API_BASE}/api/bank_accounts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update bank account');
  return res.json();
}

export async function deleteBankAccount(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/api/bank_accounts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete bank account');
}

// Reveal bank account numbers
export async function revealBankNumbers(
  bankAccountId: number
): Promise<{ routingNumber: string | null; accountNumber: string | null; swift: string | null }> {
  const res = await authFetch(`${API_BASE}/api/bank_accounts/${bankAccountId}/reveal_numbers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error('You do not have permission to reveal bank numbers');
    throw new Error('Failed to reveal bank numbers');
  }
  return res.json();
}

// Entity Signer operations
export interface CreateSignerData {
  personId: number;
  role: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export async function createEntitySigner(
  entityId: number,
  data: CreateSignerData
): Promise<EntitySigner> {
  const res = await authFetch(`${API_BASE}/api/internal_entities/${entityId}/signers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      person_id: data.personId,
      role: data.role,
      effective_from: data.effectiveFrom,
      effective_to: data.effectiveTo,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.errors?.join(', ') || 'Failed to create signer');
  }
  return res.json();
}

export async function updateEntitySigner(
  id: number,
  data: Partial<CreateSignerData>
): Promise<EntitySigner> {
  const payload: Record<string, unknown> = {};

  if (data.personId !== undefined) payload.person_id = data.personId;
  if (data.role !== undefined) payload.role = data.role;
  if (data.effectiveFrom !== undefined) payload.effective_from = data.effectiveFrom;
  if (data.effectiveTo !== undefined) payload.effective_to = data.effectiveTo;

  const res = await authFetch(`${API_BASE}/api/entity_signers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update signer');
  return res.json();
}

export async function deleteEntitySigner(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/api/entity_signers/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete signer');
}

// Constants
export const ENTITY_TYPES = [
  { value: 'llc', label: 'LLC' },
  { value: 'c_corp', label: 'C Corporation' },
  { value: 's_corp', label: 'S Corporation' },
  { value: 'lp', label: 'Limited Partnership' },
  { value: 'trust', label: 'Trust' },
  { value: 'series_llc', label: 'Series LLC' },
  { value: 'other', label: 'Other' },
];

export const ENTITY_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'dissolved', label: 'Dissolved' },
];

export const BANK_ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'money_market', label: 'Money Market' },
  { value: 'brokerage', label: 'Brokerage' },
  { value: 'other', label: 'Other' },
];

export const SIGNER_ROLES = [
  { value: 'manager', label: 'Manager' },
  { value: 'member', label: 'Member' },
  { value: 'officer', label: 'Officer' },
  { value: 'trustee', label: 'Trustee' },
  { value: 'authorized_signer', label: 'Authorized Signer' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'attorney', label: 'Attorney' },
  { value: 'other', label: 'Other' },
];

export const TAX_CLASSIFICATIONS = [
  { value: 'disregarded', label: 'Disregarded Entity' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'c_corp', label: 'C Corporation' },
  { value: 's_corp', label: 'S Corporation' },
  { value: 'trust', label: 'Trust' },
];

export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

// Helper to get status color
export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'inactive':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'dissolved':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

// Helper to get entity type color
export function getEntityTypeColor(type: string): string {
  switch (type) {
    case 'llc':
    case 'series_llc':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'c_corp':
    case 's_corp':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'lp':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'trust':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

// Format EIN with dash (XX-XXXXXXX)
export function formatEinWithDash(ein: string | null): string | null {
  if (!ein) return null;
  // Remove any existing dashes or spaces
  const cleaned = ein.replace(/[\s-]/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  }
  // For masked values like ••••1234, format as ••-•••1234
  if (cleaned.length >= 4 && cleaned.includes('•')) {
    return `••-•••${cleaned.slice(-4)}`;
  }
  return ein;
}
