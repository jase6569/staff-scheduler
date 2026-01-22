// Staff types
export interface Staff {
  id: string;
  name: string;
  role: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffInput {
  name: string;
  role?: string | null;
  active?: boolean;
}

export interface UpdateStaffInput {
  name?: string;
  role?: string | null;
  active?: boolean;
}

// Venue types
export type VenueType = 'MARKET' | 'SHOW';

export interface Venue {
  id: string;
  type: VenueType;
  name: string;
  town: string;
  address: string | null;
  notes: string | null;
  typicalDays: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVenueInput {
  type?: VenueType;
  name: string;
  town: string;
  address?: string | null;
  notes?: string | null;
  typicalDays?: string[] | null;
  allowDuplicate?: boolean;
}

export interface UpdateVenueInput {
  type?: VenueType;
  name?: string;
  town?: string;
  address?: string | null;
  notes?: string | null;
  typicalDays?: string[] | null;
}

// Assignment types
export type AssignmentStatus = 'PLANNED' | 'CONFIRMED' | 'CANCELLED';

export interface EventAssignment {
  id: string;
  date: string; // YYYY-MM-DD
  venueId: string;
  staffId: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  venue: Venue;
  staff: Staff;
}

export interface CreateAssignmentInput {
  date: string;
  venueId: string;
  staffId: string;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
  status?: AssignmentStatus;
  replaceExisting?: boolean;
}

export interface UpdateAssignmentInput {
  date?: string;
  venueId?: string;
  staffId?: string;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
  status?: AssignmentStatus;
}

export interface CopyWeekInput {
  sourceStartDate: string;
  targetStartDate: string;
  staffIds?: string[];
}

// API response types
export interface ApiError {
  error: string;
  message?: string;
  details?: any[];
}

export interface CollisionError extends ApiError {
  existingAssignment: EventAssignment;
}

export interface DuplicateVenueError extends ApiError {
  existingVenue: Venue;
}

export interface CopyWeekResult {
  message: string;
  created: EventAssignment[];
  skipped: { date: string; staffId: string; reason: string }[];
}

// UI helper types
export interface DaySchedule {
  date: string;
  dayName: string;
  dayOfMonth: number;
  isWeekend: boolean;
  isToday: boolean;
  assignments: Map<string, EventAssignment>; // staffId -> assignment
}

export interface MonthData {
  year: number;
  month: number;
  days: DaySchedule[];
}
