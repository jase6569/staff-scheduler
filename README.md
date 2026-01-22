# Staff Markets & Shows Scheduler

A simple, reliable app to schedule staff for market stalls and shows. Built with React, TypeScript, Express, Prisma, and SQLite.

## Features

- **Venue Database**: Manage markets and shows with location details
- **Staff Management**: Track staff members with active/inactive status
- **Monthly Scheduling**: Spreadsheet-style table view with staff columns
- **Calendar View**: Visual month grid showing all assignments
- **Collision Detection**: Warns when double-booking staff
- **Copy Week**: Clone last week's assignments to next week
- **Exports**: CSV, print-friendly view, and iCal (.ics) export

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express + TypeScript
- **Database**: SQLite (local file)
- **ORM**: Prisma
- **Validation**: Zod
- **Dates**: date-fns

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm 9+

### Installation

```bash
# 1. Navigate to project folder
cd staff-scheduler

# 2. Install root dependencies
npm install

# 3. Install server dependencies
cd server
npm install

# 4. Install client dependencies
cd ../client
npm install

# 5. Go back to root
cd ..
```

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates SQLite database)
npm run db:migrate

# Seed with example data
npm run db:seed
```

### Running the App

```bash
# Start both server and client concurrently
npm run dev
```

- **Client**: http://localhost:5173
- **Server**: http://localhost:3001

## Project Structure

```
staff-scheduler/
├── server/                 # Express API
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Seed data
│   └── src/
│       ├── index.ts        # Server entry
│       ├── routes/         # API routes
│       └── lib/            # Utilities
├── client/                 # React frontend
│   └── src/
│       ├── components/     # Reusable components
│       ├── pages/          # Page components
│       ├── api/            # API client
│       └── types/          # TypeScript types
└── README.md
```

## API Endpoints

### Staff
- `GET /api/staff` - List all staff
- `POST /api/staff` - Create staff
- `PUT /api/staff/:id` - Update staff
- `DELETE /api/staff/:id` - Delete staff

### Venues
- `GET /api/venues` - List all venues (with filters)
- `POST /api/venues` - Create venue
- `PUT /api/venues/:id` - Update venue
- `DELETE /api/venues/:id` - Delete venue

### Assignments
- `GET /api/assignments?from=YYYY-MM-DD&to=YYYY-MM-DD` - Get assignments
- `POST /api/assignments` - Create assignment
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment
- `POST /api/assignments/copy-week` - Copy week's assignments

### Exports
- `GET /api/export/csv?from=YYYY-MM-DD&to=YYYY-MM-DD` - Export to CSV
- `GET /api/export/ics?from=YYYY-MM-DD&to=YYYY-MM-DD&staffId=optional` - Export to iCal

## Usage

### Adding a Venue
1. Go to **Venues** page
2. Click **Add Venue**
3. Fill in name, type (Market/Show), town/city
4. Save

### Adding Staff
1. Go to **Staff** page
2. Click **Add Staff**
3. Enter name and optional role
4. Save

### Scheduling
1. Go to **Dashboard**
2. Use month picker to navigate
3. Click any cell in the table (intersection of date and staff)
4. Select a venue from the dropdown
5. Save assignment

### Exporting
1. Go to **Exports** page
2. Select date range
3. Choose export format (CSV, Print, or iCal)

## Seed Data

The app comes pre-loaded with example data:

**Staff:**
- Jason
- John

**Venues:**
- Festival Place (Christchurch) - Market
- Salisbury Market - Market
- Trowbridge Fair - Show
- Dorchester Market - Market
- Chippenham Market - Market
- Lymington Market - Market

## Timezone

All dates use Europe/London timezone for consistency.

## License

Private use only.
