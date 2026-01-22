import { z } from 'zod';

// Staff validation schemas
export const createStaffSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  role: z.string().max(100).optional().nullable(),
  active: z.boolean().optional().default(true),
});

export const updateStaffSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.string().max(100).optional().nullable(),
  active: z.boolean().optional(),
});

// Venue validation schemas
export const venueTypeSchema = z.enum(['MARKET', 'SHOW']);

export const createVenueSchema = z.object({
  type: venueTypeSchema.optional().default('MARKET'),
  name: z.string().min(1, 'Name is required').max(200),
  town: z.string().min(1, 'Town/City is required').max(100),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  typicalDays: z.array(z.string()).optional().nullable(),
  allowDuplicate: z.boolean().optional().default(false),
});

export const updateVenueSchema = z.object({
  type: venueTypeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  town: z.string().min(1).max(100).optional(),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  typicalDays: z.array(z.string()).optional().nullable(),
});

// Assignment validation schemas
export const assignmentStatusSchema = z.enum(['PLANNED', 'CONFIRMED', 'CANCELLED']);

export const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
export const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createAssignmentSchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD format'),
  venueId: z.string().uuid('Invalid venue ID'),
  staffId: z.string().uuid('Invalid staff ID'),
  startTime: z.string().regex(timeRegex, 'Time must be HH:mm format').optional().nullable(),
  endTime: z.string().regex(timeRegex, 'Time must be HH:mm format').optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  status: assignmentStatusSchema.optional().default('PLANNED'),
  replaceExisting: z.boolean().optional().default(false),
});

export const updateAssignmentSchema = z.object({
  date: z.string().regex(dateRegex).optional(),
  venueId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  startTime: z.string().regex(timeRegex).optional().nullable(),
  endTime: z.string().regex(timeRegex).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  status: assignmentStatusSchema.optional(),
});

export const copyWeekSchema = z.object({
  sourceStartDate: z.string().regex(dateRegex, 'Source start date must be YYYY-MM-DD'),
  targetStartDate: z.string().regex(dateRegex, 'Target start date must be YYYY-MM-DD'),
  staffIds: z.array(z.string().uuid()).optional(), // If not provided, copy all staff
});

// Query parameter schemas
export const assignmentQuerySchema = z.object({
  from: z.string().regex(dateRegex, 'From date must be YYYY-MM-DD'),
  to: z.string().regex(dateRegex, 'To date must be YYYY-MM-DD'),
  staffId: z.string().uuid().optional(),
  venueId: z.string().uuid().optional(),
});

export const venueQuerySchema = z.object({
  type: venueTypeSchema.optional(),
  town: z.string().optional(),
  search: z.string().optional(),
});

// Type exports
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type CopyWeekInput = z.infer<typeof copyWeekSchema>;
