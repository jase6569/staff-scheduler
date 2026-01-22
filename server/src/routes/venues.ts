import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { createVenueSchema, updateVenueSchema, venueQuerySchema } from '../lib/validation.js';
import { ZodError } from 'zod';

const router = Router();

// GET /api/venues - List all venues with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = venueQuerySchema.parse(req.query);
    
    const where: any = {};
    
    if (query.type) {
      where.type = query.type;
    }
    
    if (query.town) {
      where.town = {
        contains: query.town,
      };
    }
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { town: { contains: query.search } },
      ];
    }
    
    const venues = await prisma.venue.findMany({
      where,
      orderBy: [{ name: 'asc' }],
    });
    
    // Parse typicalDays JSON for each venue
    const venuesWithParsedDays = venues.map(venue => ({
      ...venue,
      typicalDays: venue.typicalDays ? JSON.parse(venue.typicalDays) : null,
    }));
    
    res.json(venuesWithParsedDays);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error fetching venues:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// GET /api/venues/:id - Get single venue
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const venue = await prisma.venue.findUnique({
      where: { id: req.params.id },
    });
    
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    res.json({
      ...venue,
      typicalDays: venue.typicalDays ? JSON.parse(venue.typicalDays) : null,
    });
  } catch (error) {
    console.error('Error fetching venue:', error);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

// POST /api/venues - Create venue
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createVenueSchema.parse(req.body);
    
    // Check for duplicate (same name + town)
    const existing = await prisma.venue.findFirst({
      where: {
        name: data.name,
        town: data.town,
      },
    });
    
    if (existing && !data.allowDuplicate) {
      return res.status(409).json({
        error: 'Duplicate venue',
        message: `A venue named "${data.name}" in ${data.town} already exists`,
        existingVenue: {
          ...existing,
          typicalDays: existing.typicalDays ? JSON.parse(existing.typicalDays) : null,
        },
      });
    }
    
    const venue = await prisma.venue.create({
      data: {
        type: data.type,
        name: data.name,
        town: data.town,
        address: data.address,
        notes: data.notes,
        typicalDays: data.typicalDays ? JSON.stringify(data.typicalDays) : null,
      },
    });
    
    res.status(201).json({
      ...venue,
      typicalDays: venue.typicalDays ? JSON.parse(venue.typicalDays) : null,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if ((error as any).code === 'P2002') {
      return res.status(409).json({ error: 'Venue with this name and town already exists' });
    }
    console.error('Error creating venue:', error);
    res.status(500).json({ error: 'Failed to create venue' });
  }
});

// PUT /api/venues/:id - Update venue
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = updateVenueSchema.parse(req.body);
    
    const updateData: any = { ...data };
    if (data.typicalDays !== undefined) {
      updateData.typicalDays = data.typicalDays ? JSON.stringify(data.typicalDays) : null;
    }
    
    const venue = await prisma.venue.update({
      where: { id: req.params.id },
      data: updateData,
    });
    
    res.json({
      ...venue,
      typicalDays: venue.typicalDays ? JSON.parse(venue.typicalDays) : null,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Venue not found' });
    }
    if ((error as any).code === 'P2002') {
      return res.status(409).json({ error: 'Venue with this name and town already exists' });
    }
    console.error('Error updating venue:', error);
    res.status(500).json({ error: 'Failed to update venue' });
  }
});

// DELETE /api/venues/:id - Delete venue
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.venue.delete({
      where: { id: req.params.id },
    });
    
    res.status(204).send();
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Venue not found' });
    }
    console.error('Error deleting venue:', error);
    res.status(500).json({ error: 'Failed to delete venue' });
  }
});

export default router;
