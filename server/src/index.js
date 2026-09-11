require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const superadminRoutes = require('./routes/superadmin');
const internRoutes = require('./routes/intern');
const customerRoutes = require('./routes/customer');
const publicRoutes = require('./routes/public');

const { PHOTO_DIR } = require('./middleware/upload');
const { CERT_DIR } = require('./utils/certificates');

const app = express();

const PORT = process.env.PORT || 4000;

// ----------------------------------------------------
// Middleware
// ----------------------------------------------------

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------------------------------------
// Uploaded files
// ----------------------------------------------------

app.use('/uploads/photos', express.static(PHOTO_DIR));
app.use('/uploads/certificates', express.static(CERT_DIR));

// ----------------------------------------------------
// API routes
// ----------------------------------------------------

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/intern', internRoutes);
app.use('/api/customer', customerRoutes);

// Certificate verification
app.use('/', publicRoutes);

// ----------------------------------------------------
// Health check
// ----------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'A.A Dynamic Computer Training Center',
  });
});

// ----------------------------------------------------
// Serve React production build
// ----------------------------------------------------

const clientDist = path.join(__dirname, '../../client/dist');

app.use(express.static(clientDist));

// React Router fallback
app.get('*', (req, res, next) => {
  // Don't send React HTML for API or upload requests
  if (
    req.path.startsWith('/api/') ||
    req.path.startsWith('/uploads/')
  ) {
    return next();
  }

  res.sendFile(path.join(clientDist, 'index.html'));
});

// ----------------------------------------------------
// Error handler
// ----------------------------------------------------

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ----------------------------------------------------
// Start server
// ----------------------------------------------------

app.listen(PORT, '0.0.0.0', () => {
  console.log(`A.A Dynamic Computer Training Center running on port ${PORT}`);
});
