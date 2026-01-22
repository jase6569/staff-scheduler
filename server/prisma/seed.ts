import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.eventAssignment.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.staff.deleteMany();

  // Create staff
  const jason = await prisma.staff.create({
    data: {
      name: 'Jason',
      role: 'Senior Staff',
      active: true,
    },
  });

  const john = await prisma.staff.create({
    data: {
      name: 'John',
      role: 'Staff',
      active: true,
    },
  });

  console.log('✅ Created staff:', jason.name, john.name);

  // Create venues
  const venues = await Promise.all([
    prisma.venue.create({
      data: {
        type: 'MARKET',
        name: 'Festival Place',
        town: 'Christchurch',
        address: 'Festival Place Shopping Centre',
        notes: 'Indoor market, good footfall',
        typicalDays: JSON.stringify(['Saturday', 'Sunday']),
      },
    }),
    prisma.venue.create({
      data: {
        type: 'MARKET',
        name: 'Salisbury Market',
        town: 'Salisbury',
        address: 'Market Square',
        notes: 'Traditional outdoor market',
        typicalDays: JSON.stringify(['Tuesday', 'Saturday']),
      },
    }),
    prisma.venue.create({
      data: {
        type: 'SHOW',
        name: 'Trowbridge Fair',
        town: 'Trowbridge',
        address: 'Trowbridge Park',
        notes: 'Annual summer fair - book early',
        typicalDays: JSON.stringify(['Friday', 'Saturday', 'Sunday']),
      },
    }),
    prisma.venue.create({
      data: {
        type: 'MARKET',
        name: 'Dorchester Market',
        town: 'Dorchester',
        address: 'Cornhill',
        notes: 'Wednesday market is busiest',
        typicalDays: JSON.stringify(['Wednesday', 'Saturday']),
      },
    }),
    prisma.venue.create({
      data: {
        type: 'MARKET',
        name: 'Chippenham Market',
        town: 'Chippenham',
        address: 'High Street',
        typicalDays: JSON.stringify(['Friday', 'Saturday']),
      },
    }),
    prisma.venue.create({
      data: {
        type: 'MARKET',
        name: 'Lymington Market',
        town: 'Lymington',
        address: 'High Street',
        notes: 'Saturday is the main day',
        typicalDays: JSON.stringify(['Saturday']),
      },
    }),
    prisma.venue.create({
      data: {
        type: 'SHOW',
        name: 'New Forest Show',
        town: 'Brockenhurst',
        address: 'New Forest Showground',
        notes: 'Big annual event - July',
        typicalDays: JSON.stringify(['Tuesday', 'Wednesday', 'Thursday']),
      },
    }),
    prisma.venue.create({
      data: {
        type: 'MARKET',
        name: 'Ringwood Market',
        town: 'Ringwood',
        address: 'The Furlong',
        typicalDays: JSON.stringify(['Wednesday']),
      },
    }),
  ]);

  console.log('✅ Created venues:', venues.length);

  // Create some example assignments for the current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Helper to format date as YYYY-MM-DD
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  // Create assignments for various days this month
  const assignments = [];

  // Jason - Festival Place on Saturdays
  for (let day = 1; day <= 28; day++) {
    const date = new Date(year, month, day);
    if (date.getDay() === 6) { // Saturday
      assignments.push({
        date: formatDate(date),
        venueId: venues[0].id, // Festival Place
        staffId: jason.id,
        startTime: '09:00',
        endTime: '17:00',
        status: 'CONFIRMED' as const,
      });
    }
  }

  // John - Salisbury on Tuesdays
  for (let day = 1; day <= 28; day++) {
    const date = new Date(year, month, day);
    if (date.getDay() === 2) { // Tuesday
      assignments.push({
        date: formatDate(date),
        venueId: venues[1].id, // Salisbury Market
        staffId: john.id,
        startTime: '08:30',
        endTime: '16:00',
        status: 'PLANNED' as const,
      });
    }
  }

  // John - Dorchester on Wednesdays
  for (let day = 1; day <= 28; day++) {
    const date = new Date(year, month, day);
    if (date.getDay() === 3) { // Wednesday
      assignments.push({
        date: formatDate(date),
        venueId: venues[3].id, // Dorchester Market
        staffId: john.id,
        startTime: '08:00',
        endTime: '15:00',
        status: 'PLANNED' as const,
      });
    }
  }

  // Jason - Lymington on some Saturdays (alternate with Festival Place)
  // Adding a few specific dates
  const specificDates = [
    new Date(year, month, 7),
    new Date(year, month, 21),
  ];

  for (const date of specificDates) {
    if (date.getMonth() === month) {
      // Remove conflicting Festival Place assignment if exists
      const existingIndex = assignments.findIndex(
        a => a.date === formatDate(date) && a.staffId === jason.id
      );
      if (existingIndex > -1) {
        assignments.splice(existingIndex, 1);
      }
      assignments.push({
        date: formatDate(date),
        venueId: venues[5].id, // Lymington Market
        staffId: jason.id,
        startTime: '09:00',
        endTime: '16:00',
        status: 'PLANNED' as const,
      });
    }
  }

  // Create all assignments
  for (const assignment of assignments) {
    try {
      await prisma.eventAssignment.create({ data: assignment });
    } catch (e) {
      // Skip duplicates
    }
  }

  console.log('✅ Created assignments:', assignments.length);
  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
