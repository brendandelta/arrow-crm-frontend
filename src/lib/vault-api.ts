// Vault API types and helpers

export interface VaultSummary {
  id: number;
  name: string;
  description: string | null;
  role: 'admin' | 'editor' | 'revealer' | 'viewer' | null;
  roleLabel: string | null;
  credentialsCount: number;
  overdueRotationsCount: number;
  dueSoonRotationsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VaultDetail extends VaultSummary {
  metadata: Record<string, unknown>;
  canReveal: boolean;
  canEdit: boolean;
  canManageMemberships: boolean;
  createdBy: { id: number; name: string } | null;
}

export interface VaultMembership {
  id: number;
  vaultId: number;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  role: string;
  roleLabel: string;
  roleDescription: string;
  canReveal: boolean;
  canEdit: boolean;
  canManageMemberships: boolean;
  createdBy: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialLink {
  id: number;
  linkableType: 'Deal' | 'Organization' | 'Person' | 'InternalEntity';
  linkableId: number;
  label: string;
  relationship: string;
  relationshipLabel?: string;
}

export interface CredentialField {
  id: number;
  label: string;
  fieldType: string;
  fieldTypeLabel: string;
  isSecret: boolean;
  valueMasked: string | null;
  valuePresent: boolean;
  sortOrder: number;
}

export interface CredentialSummary {
  id: number;
  vaultId: number;
  title: string;
  credentialType: string;
  credentialTypeLabel: string;
  url: string | null;
  usernameMasked: string | null;
  emailMasked: string | null;
  secretMasked: string | null;
  sensitivity: string;
  sensitivityLabel: string;
  rotationStatus: 'ok' | 'due_soon' | 'overdue' | 'no_policy';
  rotationIntervalDays: number | null;
  daysUntilRotation: number | null;
  secretLastRotatedAt: string | null;
  links: CredentialLink[];
  canReveal: boolean;
  canEdit: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface CredentialDetail extends CredentialSummary {
  usernamePresent: boolean;
  emailPresent: boolean;
  secretPresent: boolean;
  notesMasked: string | null;
  notesPresent: boolean;
  metadata: Record<string, unknown>;
  fields: CredentialField[];
  createdBy: { id: number; name: string } | null;
  updatedBy: { id: number; name: string } | null;
}

export interface RevealedCredential {
  id: number;
  username: string | null;
  email: string | null;
  secret: string | null;
  notes: string | null;
  fields: Array<{
    id: number;
    label: string;
    fieldType: string;
    isSecret: boolean;
    value: string | null;
  }>;
}

export interface RotationDashboard {
  overdue: CredentialSummary[];
  dueSoon: CredentialSummary[];
  noPolicy: CredentialSummary[];
}

export interface AuditLogEntry {
  id: number;
  action: string;
  actionLabel: string;
  auditableType: string;
  auditableId: number;
  actor: { id: number; name: string } | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper to get auth headers from session storage
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const session = localStorage.getItem('arrow_session');
  if (!session) return {};

  try {
    const data = JSON.parse(session);
    if (data.backendUserId) {
      return { 'X-User-Id': data.backendUserId.toString() };
    }
  } catch {
    // Invalid session data
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

// Vaults
export async function fetchVaults(): Promise<VaultSummary[]> {
  const res = await authFetch(`${API_BASE}/api/vaults`);
  if (!res.ok) throw new Error('Failed to fetch vaults');
  return res.json();
}

export async function fetchVault(id: number): Promise<VaultDetail> {
  const res = await authFetch(`${API_BASE}/api/vaults/${id}`);
  if (!res.ok) throw new Error('Failed to fetch vault');
  return res.json();
}

export async function createVault(data: { name: string; description?: string }): Promise<VaultDetail> {
  const res = await authFetch(`${API_BASE}/api/vaults`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create vault');
  return res.json();
}

export async function updateVault(id: number, data: Partial<VaultDetail>): Promise<VaultDetail> {
  const res = await authFetch(`${API_BASE}/api/vaults/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update vault');
  return res.json();
}

export async function fetchVaultRotation(vaultId: number): Promise<RotationDashboard> {
  const res = await authFetch(`${API_BASE}/api/vaults/${vaultId}/rotation`);
  if (!res.ok) throw new Error('Failed to fetch rotation dashboard');
  return res.json();
}

// Memberships
export async function fetchVaultMemberships(vaultId: number): Promise<VaultMembership[]> {
  const res = await authFetch(`${API_BASE}/api/vaults/${vaultId}/memberships`);
  if (!res.ok) throw new Error('Failed to fetch memberships');
  return res.json();
}

export async function createVaultMembership(
  vaultId: number,
  data: { userId: number; role: string }
): Promise<VaultMembership> {
  const res = await authFetch(`${API_BASE}/api/vaults/${vaultId}/memberships`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: data.userId, role: data.role }),
  });
  if (!res.ok) throw new Error('Failed to create membership');
  return res.json();
}

export async function updateVaultMembership(id: number, role: string): Promise<VaultMembership> {
  const res = await authFetch(`${API_BASE}/api/vault_memberships/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error('Failed to update membership');
  return res.json();
}

export async function deleteVaultMembership(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/api/vault_memberships/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete membership');
}

// Credentials
export interface CredentialFilters {
  q?: string;
  type?: string;
  sensitivity?: string;
  rotationStatus?: 'overdue' | 'due_soon' | 'ok' | 'no_policy';
  linkableType?: string;
  linkableId?: number;
}

export async function fetchCredentials(
  vaultId: number,
  filters: CredentialFilters = {}
): Promise<CredentialSummary[]> {
  const params = new URLSearchParams();
  if (filters.q) params.append('q', filters.q);
  if (filters.type) params.append('type', filters.type);
  if (filters.sensitivity) params.append('sensitivity', filters.sensitivity);
  if (filters.rotationStatus) params.append('rotation_status', filters.rotationStatus);
  if (filters.linkableType) params.append('linkable_type', filters.linkableType);
  if (filters.linkableId) params.append('linkable_id', filters.linkableId.toString());

  const res = await authFetch(`${API_BASE}/api/vaults/${vaultId}/credentials?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch credentials');
  return res.json();
}

export async function fetchCredential(id: number): Promise<CredentialDetail> {
  const res = await authFetch(`${API_BASE}/api/credentials/${id}`);
  if (!res.ok) throw new Error('Failed to fetch credential');
  return res.json();
}

export interface CreateCredentialData {
  title: string;
  credentialType: string;
  url?: string;
  username?: string;
  email?: string;
  secret?: string;
  notes?: string;
  sensitivity?: string;
  rotationIntervalDays?: number;
  links?: Array<{ linkableType: string; linkableId: number; relationship?: string }>;
  fields?: Array<{ label: string; fieldType: string; value?: string; isSecret?: boolean }>;
}

export async function createCredential(
  vaultId: number,
  data: CreateCredentialData
): Promise<CredentialDetail> {
  const res = await authFetch(`${API_BASE}/api/vaults/${vaultId}/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: data.title,
      credential_type: data.credentialType,
      url: data.url,
      username: data.username,
      email: data.email,
      secret: data.secret,
      notes: data.notes,
      sensitivity: data.sensitivity,
      rotation_interval_days: data.rotationIntervalDays,
      links: data.links,
      fields: data.fields,
    }),
  });
  if (!res.ok) throw new Error('Failed to create credential');
  return res.json();
}

export async function updateCredential(
  id: number,
  data: Partial<CreateCredentialData>
): Promise<CredentialDetail> {
  const res = await authFetch(`${API_BASE}/api/credentials/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: data.title,
      credential_type: data.credentialType,
      url: data.url,
      username: data.username,
      email: data.email,
      secret: data.secret,
      notes: data.notes,
      sensitivity: data.sensitivity,
      rotation_interval_days: data.rotationIntervalDays,
    }),
  });
  if (!res.ok) throw new Error('Failed to update credential');
  return res.json();
}

export async function deleteCredential(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/api/credentials/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete credential');
}

// Reveal + Copy (SECURITY CRITICAL - always logged server-side)
export async function revealCredential(
  id: number,
  context?: string
): Promise<RevealedCredential> {
  const res = await authFetch(`${API_BASE}/api/credentials/${id}/reveal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context }),
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error('You do not have permission to reveal this credential');
    throw new Error('Failed to reveal credential');
  }
  return res.json();
}

export async function logCredentialCopy(
  id: number,
  field: string,
  context?: string
): Promise<void> {
  const res = await authFetch(`${API_BASE}/api/credentials/${id}/copy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, context }),
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error('You do not have permission to copy this credential');
    throw new Error('Failed to log copy');
  }
}

// Credential Fields
export async function createCredentialField(
  credentialId: number,
  data: { label: string; fieldType: string; value?: string; isSecret?: boolean; sortOrder?: number }
): Promise<CredentialField> {
  const res = await authFetch(`${API_BASE}/api/credentials/${credentialId}/fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      label: data.label,
      field_type: data.fieldType,
      value: data.value,
      is_secret: data.isSecret,
      sort_order: data.sortOrder,
    }),
  });
  if (!res.ok) throw new Error('Failed to create field');
  return res.json();
}

export async function updateCredentialField(
  id: number,
  data: { label?: string; fieldType?: string; value?: string; isSecret?: boolean; sortOrder?: number }
): Promise<CredentialField> {
  const res = await authFetch(`${API_BASE}/api/credential_fields/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      label: data.label,
      field_type: data.fieldType,
      value: data.value,
      is_secret: data.isSecret,
      sort_order: data.sortOrder,
    }),
  });
  if (!res.ok) throw new Error('Failed to update field');
  return res.json();
}

export async function deleteCredentialField(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/api/credential_fields/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete field');
}

// Credential Links
export async function createCredentialLink(
  credentialId: number,
  linkableType: string,
  linkableId: number,
  relationship: string = 'general'
): Promise<CredentialLink> {
  const res = await authFetch(`${API_BASE}/api/credentials/${credentialId}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      linkable_type: linkableType,
      linkable_id: linkableId,
      relationship,
    }),
  });
  if (!res.ok) throw new Error('Failed to create link');
  return res.json();
}

export async function deleteCredentialLink(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/api/credential_links/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete link');
}

// Audit Logs
export async function fetchAuditLogs(params: {
  auditableType?: string;
  auditableId?: number;
  actionType?: string;
  actorUserId?: number;
  page?: number;
  perPage?: number;
}): Promise<{ logs: AuditLogEntry[]; pageInfo: { page: number; perPage: number; total: number } }> {
  const searchParams = new URLSearchParams();
  if (params.auditableType) searchParams.append('auditable_type', params.auditableType);
  if (params.auditableId) searchParams.append('auditable_id', params.auditableId.toString());
  if (params.actionType) searchParams.append('action_type', params.actionType);
  if (params.actorUserId) searchParams.append('actor_user_id', params.actorUserId.toString());
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.perPage) searchParams.append('per_page', params.perPage.toString());

  const res = await authFetch(`${API_BASE}/api/security_audit_logs?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

// Constants
export const CREDENTIAL_TYPES = [
  { value: 'login', label: 'Login', icon: 'Key' },
  { value: 'api_key', label: 'API Key', icon: 'Code' },
  { value: 'ssh_key', label: 'SSH Key', icon: 'Terminal' },
  { value: 'database', label: 'Database', icon: 'Database' },
  { value: 'bank_portal', label: 'Bank Portal', icon: 'Building' },
  { value: 'cloud_provider', label: 'Cloud Provider', icon: 'Cloud' },
  { value: 'otp_seed', label: 'OTP Seed', icon: 'Smartphone' },
  { value: 'recovery_codes', label: 'Recovery Codes', icon: 'Shield' },
  { value: 'other', label: 'Other', icon: 'MoreHorizontal' },
];

export const CREDENTIAL_SENSITIVITIES = [
  { value: 'internal', label: 'Internal' },
  { value: 'confidential', label: 'Confidential' },
  { value: 'highly_confidential', label: 'Highly Confidential' },
];

export const VAULT_ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access including membership management' },
  { value: 'editor', label: 'Editor', description: 'Can create and update, cannot reveal secrets' },
  { value: 'revealer', label: 'Revealer', description: 'Can view and reveal secrets, cannot edit' },
  { value: 'viewer', label: 'Viewer', description: 'Can view masked credentials only' },
];

export const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'password', label: 'Password' },
  { value: 'token', label: 'Token' },
  { value: 'pin', label: 'PIN' },
  { value: 'note', label: 'Note' },
];

export const CREDENTIAL_RELATIONSHIPS = [
  { value: 'general', label: 'General' },
  { value: 'primary', label: 'Primary' },
  { value: 'login', label: 'Login' },
  { value: 'admin', label: 'Admin' },
  { value: 'backup', label: 'Backup' },
];

// Helper to get rotation status color
export function getRotationStatusColor(status: string): string {
  switch (status) {
    case 'overdue':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'due_soon':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'ok':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
}

// Helper to get rotation status label
export function getRotationStatusLabel(status: string): string {
  switch (status) {
    case 'overdue':
      return 'Overdue';
    case 'due_soon':
      return 'Due Soon';
    case 'ok':
      return 'OK';
    default:
      return 'No Policy';
  }
}
