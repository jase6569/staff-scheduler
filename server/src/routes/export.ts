import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { format, parseISO, addMinutes } from 'date-fns';

const router = Router();

// GET /api/export/csv - Export assignments to CSV
router.get('/csv', async (req: Request, res: Response) => {
  try {
    const from = req.query.from as string;
    const to = req.query.to as string;
    
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to dates are required' });
    }
    
    const assignments = await prisma.eventAssignment.findMany({
      where: {
        date: {
          gte: from,
          lte: to,
        },
      },
      include: {
        venue: true,
        staff: true,
      },
      orderBy: [{ date: 'asc' }, { staff: { name: 'asc' } }],
    });
    
    // Build CSV
    const headers = ['Date', 'Day', 'Staff', 'Venue', 'Town', 'Type', 'Start Time', 'End Time', 'Status', 'Notes'];
    const rows = assignments.map(a => {
      const date = parseISO(a.date);
      return [
        a.date,
        format(date, 'EEEE'),
        a.staff.name,
        a.venue.name,
        a.venue.town,
        a.venue.type,
        a.startTime || '',
        a.endTime || '',
        a.status,
        a.notes || '',
      ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="schedule-${from}-to-${to}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// GET /api/export/ics - Export assignments to iCal format
router.get('/ics', async (req: Request, res: Response) => {
  try {
    const from = req.query.from as string;
    const to = req.query.to as string;
    const staffId = req.query.staffId as string | undefined;
    
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to dates are required' });
    }
    
    const where: any = {
      date: {
        gte: from,
        lte: to,
      },
    };
    
    if (staffId) {
      where.staffId = staffId;
    }
    
    const assignments = await prisma.eventAssignment.findMany({
      where,
      include: {
        venue: true,
        staff: true,
      },
      orderBy: { date: 'asc' },
    });
    
    // Build iCal
    const icsLines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Staff Scheduler//Markets & Shows//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Staff Schedule',
      'X-WR-TIMEZONE:Europe/London',
    ];
    
    for (const assignment of assignments) {
      const date = parseISO(assignment.date);
      
      // Default times if not specified
      const startTime = assignment.startTime || '09:00';
      const endTime = assignment.endTime || '17:00';
      
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const startDate = new Date(date);
      startDate.setHours(startHour, startMin, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(endHour, endMin, 0, 0);
      
      const formatIcsDate = (d: Date) => {
        return format(d, "yyyyMMdd'T'HHmmss");
      };
      
      const uid = `${assignment.id}@staff-scheduler`;
      const summary = `${assignment.staff.name} - ${assignment.venue.name}`;
      const location = `${assignment.venue.name}, ${assignment.venue.town}${assignment.venue.address ? ', ' + assignment.venue.address : ''}`;
      const description = [
        `Staff: ${assignment.staff.name}`,
        `Venue: ${assignment.venue.name}`,
        `Town: ${assignment.venue.town}`,
        `Type: ${assignment.venue.type}`,
        `Status: ${assignment.status}`,
        assignment.notes ? `Notes: ${assignment.notes}` : '',
      ].filter(Boolean).join('\\n');
      
      icsLines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatIcsDate(new Date())}`,
        `DTSTART;TZID=Europe/London:${formatIcsDate(startDate)}`,
        `DTEND;TZID=Europe/London:${formatIcsDate(endDate)}`,
        `SUMMARY:${summary}`,
        `LOCATION:${location}`,
        `DESCRIPTION:${description}`,
        `STATUS:${assignment.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED'}`,
        'END:VEVENT',
      );
    }
    
    icsLines.push('END:VCALENDAR');
    
    const ics = icsLines.join('\r\n');
    
    const filename = staffId 
      ? `schedule-${from}-to-${to}-staff.ics`
      : `schedule-${from}-to-${to}-all.ics`;
    
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(ics);
  } catch (error) {
    console.error('Error exporting ICS:', error);
    res.status(500).json({ error: 'Failed to export ICS' });
  }
});

export default router;
