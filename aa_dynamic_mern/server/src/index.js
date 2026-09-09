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

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploaded photos and generated certificates, served as static files
app.use('/uploads/photos', express.static(PHOTO_DIR));
app.use('/uploads/certificates', express.static(CERT_DIR));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/intern', internRoutes);
app.use('/api/customer', customerRoutes);
app.use('/', publicRoutes); // exposes GET /verify/:certNo for the frontend to call

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Centralized error handler (e.g. multer file-size errors, unexpected throws)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`A.A Dynamic API server running on http://localhost:${PORT}`);
});
