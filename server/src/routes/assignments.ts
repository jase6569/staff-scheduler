import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  assignmentQuerySchema,
  copyWeekSchema,
} from '../lib/validation.js';
import { ZodError } from 'zod';
import { addDays, parseISO, format } from 'date-fns';

const router = Router();

// GET /api/assignments - Get assignments by date range
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = assignmentQuerySchema.parse(req.query);
    
    const where: any = {
      date: {
        gte: query.from,
        lte: query.to,
      },
    };
    
    if (query.staffId) {
      where.staffId = query.staffId;
    }
    
    if (query.venueId) {
      where.venueId = query.venueId;
    }
    
    const assignments = await prisma.eventAssignment.findMany({
      where,
      include: {
        venue: true,
        staff: true,
      },
      orderBy: [{ date: 'asc' }, { staff: { name: 'asc' } }],
    });
    
    // Parse venue typicalDays
    const assignmentsWithParsedVenue = assignments.map(a => ({
      ...a,
      venue: {
        ...a.venue,
        typicalDays: a.venue.typicalDays ? JSON.parse(a.venue.typicalDays) : null,
      },
    }));
    
    res.json(assignmentsWithParsedVenue);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// GET /api/assignments/:id - Get single assignment
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.eventAssignment.findUnique({
      where: { id: req.params.id },
      include: {
        venue: true,
        staff: true,
      },
    });
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    res.json({
      ...assignment,
      venue: {
        ...assignment.venue,
        typicalDays: assignment.venue.typicalDays ? JSON.parse(assignment.venue.typicalDays) : null,
      },
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// POST /api/assignments - Create assignment
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createAssignmentSchema.parse(req.body);
    
    // Check for existing assignment (collision)
    const existing = await prisma.eventAssignment.findUnique({
      where: {
        date_staffId: {
          date: data.date,
          staffId: data.staffId,
        },
      },
      include: { venue: true },
    });
    
    if (existing) {
      if (!data.replaceExisting) {
        return res.status(409).json({
          error: 'Collision detected',
          message: `Staff member already assigned to ${existing.venue.name} on this date`,
          existingAssignment: {
            ...existing,
            venue: {
              ...existing.venue,
              typicalDays: existing.venue.typicalDays ? JSON.parse(existing.venue.typicalDays) : null,
            },
          },
        });
      }
      
      // Replace existing assignment
      const updated = await prisma.eventAssignment.update({
        where: { id: existing.id },
        data: {
          venueId: data.venueId,
          startTime: data.startTime,
          endTime: data.endTime,
          notes: data.notes,
          status: data.status,
        },
        include: {
          venue: true,
          staff: true,
        },
      });
      
      return res.json({
        ...updated,
        venue: {
          ...updated.venue,
          typicalDays: updated.venue.typicalDays ? JSON.parse(updated.venue.typicalDays) : null,
        },
        replaced: true,
      });
    }
    
    // Verify venue and staff exist
    const [venue, staff] = await Promise.all([
      prisma.venue.findUnique({ where: { id: data.venueId } }),
      prisma.staff.findUnique({ where: { id: data.staffId } }),
    ]);
    
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    
    const assignment = await prisma.eventAssignment.create({
      data: {
        date: data.date,
        venueId: data.venueId,
        staffId: data.staffId,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes,
        status: data.status,
      },
      include: {
        venue: true,
        staff: true,
      },
    });
    
    res.status(201).json({
      ...assignment,
      venue: {
        ...assignment.venue,
        typicalDays: assignment.venue.typicalDays ? JSON.parse(assignment.venue.typicalDays) : null,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// PUT /api/assignments/:id - Update assignment
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = updateAssignmentSchema.parse(req.body);
    
    // If changing date or staff, check for collision
    if (data.date || data.staffId) {
      const current = await prisma.eventAssignment.findUnique({
        where: { id: req.params.id },
      });
      
      if (current) {
        const newDate = data.date || current.date;
        const newStaffId = data.staffId || current.staffId;
        
        const existing = await prisma.eventAssignment.findFirst({
          where: {
            date: newDate,
            staffId: newStaffId,
            NOT: { id: req.params.id },
          },
        });
        
        if (existing) {
          return res.status(409).json({
            error: 'Collision detected',
            message: 'Staff member already has an assignment on this date',
          });
        }
      }
    }
    
    const assignment = await prisma.eventAssignment.update({
      where: { id: req.params.id },
      data,
      include: {
        venue: true,
        staff: true,
      },
    });
    
    res.json({
      ...assignment,
      venue: {
        ...assignment.venue,
        typicalDays: assignment.venue.typicalDays ? JSON.parse(assignment.venue.typicalDays) : null,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// DELETE /api/assignments/:id - Delete assignment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.eventAssignment.delete({
      where: { id: req.params.id },
    });
    
    res.status(204).send();
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// POST /api/assignments/copy-week - Copy a week's assignments to another week
router.post('/copy-week', async (req: Request, res: Response) => {
  try {
    const data = copyWeekSchema.parse(req.body);
    
    const sourceStart = parseISO(data.sourceStartDate);
    const targetStart = parseISO(data.targetStartDate);
    
    // Get all assignments from source week (7 days)
    const sourceEnd = addDays(sourceStart, 6);
    
    const where: any = {
      date: {
        gte: format(sourceStart, 'yyyy-MM-dd'),
        lte: format(sourceEnd, 'yyyy-MM-dd'),
      },
    };
    
    if (data.staffIds && data.staffIds.length > 0) {
      where.staffId = { in: data.staffIds };
    }
    
    const sourceAssignments = await prisma.eventAssignment.findMany({
      where,
    });
    
    if (sourceAssignments.length === 0) {
      return res.status(404).json({ error: 'No assignments found in source week' });
    }
    
    // Calculate day offset
    const dayOffset = Math.round((targetStart.getTime() - sourceStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Create new assignments with offset dates
    const created: any[] = [];
    const skipped: any[] = [];
    
    for (const assignment of sourceAssignments) {
      const sourceDate = parseISO(assignment.date);
      const newDate = addDays(sourceDate, dayOffset);
      const newDateStr = format(newDate, 'yyyy-MM-dd');
      
      // Check if assignment already exists
      const existing = await prisma.eventAssignment.findUnique({
        where: {
          date_staffId: {
            date: newDateStr,
            staffId: assignment.staffId,
          },
        },
      });
      
      if (existing) {
        skipped.push({
          date: newDateStr,
          staffId: assignment.staffId,
          reason: 'Already has assignment',
        });
        continue;
      }
      
      const newAssignment = await prisma.eventAssignment.create({
        data: {
          date: newDateStr,
          venueId: assignment.venueId,
          staffId: assignment.staffId,
          startTime: assignment.startTime,
          endTime: assignment.endTime,
          notes: assignment.notes,
          status: 'PLANNED',
        },
        include: {
          venue: true,
          staff: true,
        },
      });
      
      created.push(newAssignment);
    }
    
    res.json({
      message: `Copied ${created.length} assignments, skipped ${skipped.length}`,
      created,
      skipped,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error copying week:', error);
    res.status(500).json({ error: 'Failed to copy week' });
  }
});

export default router;
