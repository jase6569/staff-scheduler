import type {
  Staff,
  CreateStaffInput,
  UpdateStaffInput,
  Venue,
  CreateVenueInput,
  UpdateVenueInput,
  EventAssignment,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  CopyWeekInput,
  CopyWeekResult,
  ApiError,
} from '../types';

// Use environment variable for API base URL, fallback to /api for production proxy
const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw error;
  }
  
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Staff API
export const staffApi = {
  getAll: async (includeInactive = false): Promise<Staff[]> => {
    const url = `${API_BASE}/staff${includeInactive ? '?includeInactive=true' : ''}`;
    const response = await fetch(url);
    return handleResponse<Staff[]>(response);
  },

  getById: async (id: string): Promise<Staff> => {
    const response = await fetch(`${API_BASE}/staff/${id}`);
    return handleResponse<Staff>(response);
  },

  create: async (data: CreateStaffInput): Promise<Staff> => {
    const response = await fetch(`${API_BASE}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Staff>(response);
  },

  update: async (id: string, data: UpdateStaffInput): Promise<Staff> => {
    const response = await fetch(`${API_BASE}/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Staff>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/staff/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },
};

// Venues API
export const venuesApi = {
  getAll: async (filters?: { type?: string; town?: string; search?: string }): Promise<Venue[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.town) params.set('town', filters.town);
    if (filters?.search) params.set('search', filters.search);

    const url = `${API_BASE}/venues${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    return handleResponse<Venue[]>(response);
  },

  getById: async (id: string): Promise<Venue> => {
    const response = await fetch(`${API_BASE}/venues/${id}`);
    return handleResponse<Venue>(response);
  },

  create: async (data: CreateVenueInput): Promise<Venue> => {
    const response = await fetch(`${API_BASE}/venues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Venue>(response);
  },

  update: async (id: string, data: UpdateVenueInput): Promise<Venue> => {
    const response = await fetch(`${API_BASE}/venues/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Venue>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/venues/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },
};

// Assignments API
export const assignmentsApi = {
  getByDateRange: async (from: string, to: string, staffId?: string, venueId?: string): Promise<EventAssignment[]> => {
    const params = new URLSearchParams({ from, to });
    if (staffId) params.set('staffId', staffId);
    if (venueId) params.set('venueId', venueId);

    const response = await fetch(`${API_BASE}/assignments?${params.toString()}`);
    return handleResponse<EventAssignment[]>(response);
  },

  getById: async (id: string): Promise<EventAssignment> => {
    const response = await fetch(`${API_BASE}/assignments/${id}`);
    return handleResponse<EventAssignment>(response);
  },

  create: async (data: CreateAssignmentInput): Promise<EventAssignment & { replaced?: boolean }> => {
    const response = await fetch(`${API_BASE}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<EventAssignment & { replaced?: boolean }>(response);
  },

  update: async (id: string, data: UpdateAssignmentInput): Promise<EventAssignment> => {
    const response = await fetch(`${API_BASE}/assignments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<EventAssignment>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/assignments/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },

  copyWeek: async (data: CopyWeekInput): Promise<CopyWeekResult> => {
    const response = await fetch(`${API_BASE}/assignments/copy-week`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<CopyWeekResult>(response);
  },
};

// Export API
export const exportApi = {
  getCsvUrl: (from: string, to: string): string => {
    return `${API_BASE}/export/csv?from=${from}&to=${to}`;
  },

  getIcsUrl: (from: string, to: string, staffId?: string): string => {
    const params = new URLSearchParams({ from, to });
    if (staffId) params.set('staffId', staffId);
    return `${API_BASE}/export/ics?${params.toString()}`;
  },

  downloadCsv: async (from: string, to: string): Promise<void> => {
    window.open(exportApi.getCsvUrl(from, to), '_blank');
  },

  downloadIcs: async (from: string, to: string, staffId?: string): Promise<void> => {
    window.open(exportApi.getIcsUrl(from, to, staffId), '_blank');
  },
};

// Error type guard
export function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'error' in error;
}

export function isCollisionError(error: unknown): error is { error: string; existingAssignment: EventAssignment } {
  return isApiError(error) && 'existingAssignment' in error;
}

export function isDuplicateVenueError(error: unknown): error is { error: string; existingVenue: Venue } {
  return isApiError(error) && 'existingVenue' in error;
}
