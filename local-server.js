// Local development server to test API functions
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Import and setup API routes
const clinicsHandler = require('./api/clinics.js').default;

// API Routes
app.all('/api/clinics', (req, res) => {
  clinicsHandler(req, res);
});

// Serve static files and handle client-side routing
app.get('*', (req, res) => {
  // Check if it's an API route
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // For all other routes, serve index.html or the requested file
  if (req.path === '/' || req.path.indexOf('.') === -1) {
    res.sendFile(path.resolve('./index.html'));
  } else {
    res.sendFile(path.resolve('.' + req.path));
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api/*`);
});