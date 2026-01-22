import express from 'express';
import cors from 'cors';
import staffRoutes from './routes/staff.js';
import venuesRoutes from './routes/venues.js';
import assignmentsRoutes from './routes/assignments.js';
import exportRoutes from './routes/export.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Get allowed origins from environment or use defaults
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/staff', staffRoutes);
app.use('/api/venues', venuesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Staff Scheduler API ready`);
});
