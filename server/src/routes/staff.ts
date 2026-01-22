import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { createStaffSchema, updateStaffSchema } from '../lib/validation.js';
import { ZodError } from 'zod';

const router = Router();

// GET /api/staff - List all staff
router.get('/', async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    
    const staff = await prisma.staff.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { name: 'asc' },
    });
    
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// GET /api/staff/:id - Get single staff member
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: req.params.id },
    });
    
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// POST /api/staff - Create staff
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createStaffSchema.parse(req.body);
    
    const staff = await prisma.staff.create({
      data: {
        name: data.name,
        role: data.role,
        active: data.active,
      },
    });
    
    res.status(201).json(staff);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating staff:', error);
    res.status(500).json({ error: 'Failed to create staff' });
  }
});

// PUT /api/staff/:id - Update staff
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = updateStaffSchema.parse(req.body);
    
    const staff = await prisma.staff.update({
      where: { id: req.params.id },
      data,
    });
    
    res.json(staff);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Staff not found' });
    }
    console.error('Error updating staff:', error);
    res.status(500).json({ error: 'Failed to update staff' });
  }
});

// DELETE /api/staff/:id - Delete staff
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.staff.delete({
      where: { id: req.params.id },
    });
    
    res.status(204).send();
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Staff not found' });
    }
    console.error('Error deleting staff:', error);
    res.status(500).json({ error: 'Failed to delete staff' });
  }
});

export default router;
