require('dotenv').config();

const express = require('express');
const cors = require('cors');

const citiesRouter = require('./routes/cities');

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET'],
}));

app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/api/cities', citiesRouter);

// Health check — useful for Render's health probe
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ---------------------------------------------------------------------------
// 404 handler for unmatched routes
// ---------------------------------------------------------------------------

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Breathe Better backend running on http://localhost:${PORT}`);
});
