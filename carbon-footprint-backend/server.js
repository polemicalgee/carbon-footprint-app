const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'carbonwise-secret-key-change-in-production';
const ML_SERVICE = process.env.ML_SERVICE_URL || 'http://localhost:8000';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { require: true, rejectUnauthorized: false }
});
pool.on('error', (err) => console.error('Unexpected DB error:', err.message));
pool.connect()
  .then(() => console.log('Connected to Neon PostgreSQL'))
  .catch(err => console.error('DB connection error:', err.stack));

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role || 'user';
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

app.get('/', (req, res) => res.json({ status: 'CarbonWise API is online', version: '2.0' }));

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    if (!email.includes('@'))
      return res.status(400).json({ message: 'Invalid email address' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0)
      return res.status(409).json({ message: 'An account with this email already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name.trim(), email.toLowerCase(), hashedPassword, 'user']
    );
    res.status(201).json({ message: 'Account created successfully', user: newUser.rows[0] });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0)
      return res.status(401).json({ message: 'Invalid email or password' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.id, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      token,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user'
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.post('/api/reports', authMiddleware, async (req, res) => {
  try {
    const { user_id, activity_type, emissions, scope } = req.body;
    if (!activity_type || !activity_type.trim())
      return res.status(400).json({ message: 'Activity type is required' });
    if (emissions === undefined || isNaN(Number(emissions)) || Number(emissions) < 0)
      return res.status(400).json({ message: 'Emissions must be a positive number' });

    const validScope = [1, 2, 3].includes(Number(scope)) ? Number(scope) : inferScope(activity_type);
    const newReport = await pool.query(
      'INSERT INTO reports (user_id, activity_type, emissions, scope) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, activity_type.trim(), parseFloat(Number(emissions).toFixed(2)), validScope]
    );
    res.status(201).json(newReport.rows[0]);
  } catch (err) {
    console.error('Save report error:', err.message);
    res.status(500).json({ message: 'Could not save carbon report' });
  }
});

app.get('/api/reports/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    if (String(req.userId) !== String(userId))
      return res.status(403).json({ message: 'Access denied' });

    const userReports = await pool.query(
      'SELECT * FROM reports WHERE user_id = $1 ORDER BY date_recorded DESC',
      [userId]
    );
    res.status(200).json(userReports.rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch reports' });
  }
});

app.delete('/api/reports/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const report = await pool.query('SELECT user_id FROM reports WHERE id = $1', [id]);
    if (report.rows.length === 0) return res.status(404).json({ message: 'Report not found' });
    if (String(report.rows[0].user_id) !== String(req.userId))
      return res.status(403).json({ message: 'Access denied' });

    await pool.query('DELETE FROM reports WHERE id = $1', [id]);
    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete report' });
  }
});

app.put('/api/reports/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { activity_type, emissions } = req.body;
    if (!activity_type || isNaN(Number(emissions)) || Number(emissions) < 0)
      return res.status(400).json({ message: 'Invalid data provided' });

    const report = await pool.query('SELECT user_id FROM reports WHERE id = $1', [id]);
    if (report.rows.length === 0) return res.status(404).json({ message: 'Report not found' });
    if (String(report.rows[0].user_id) !== String(req.userId))
      return res.status(403).json({ message: 'Access denied' });

    const updated = await pool.query(
      'UPDATE reports SET activity_type = $1, emissions = $2 WHERE id = $3 RETURNING *',
      [activity_type, parseFloat(Number(emissions).toFixed(2)), id]
    );
    res.status(200).json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not update report' });
  }
});

app.post('/api/predict-emissions', authMiddleware, async (req, res) => {
  try {
    const { engineSize, cylinders, fuelConsumption } = req.body;
    if (!engineSize || !cylinders || !fuelConsumption)
      return res.status(400).json({ success: false, message: 'All vehicle parameters are required' });

    const mlResponse = await axios.post(`${ML_SERVICE}/predict-vehicle`, {
      engine_size: parseFloat(engineSize),
      cylinders: parseFloat(cylinders),
      fuel_consumption: parseFloat(fuelConsumption)
    }, { timeout: 10000 });

    res.json({ success: true, predicted_emission: mlResponse.data.predicted_emission });
  } catch (err) {
    console.error('ML prediction error - using fallback:', err.message);
    const { fuelConsumption, engineSize } = req.body;
    const fallback = parseFloat(fuelConsumption) * 23.1 + parseFloat(engineSize) * 8.5;
    res.json({ success: true, predicted_emission: Math.round(fallback), fallback: true });
  }
});

app.post('/api/forecast', authMiddleware, async (req, res) => {
  try {
    const { values } = req.body;
    if (!values || values.length < 3)
      return res.status(400).json({ message: 'At least 3 data points needed' });

    const mlResponse = await axios.post(`${ML_SERVICE}/forecast`, { values }, { timeout: 15000 });
    res.json(mlResponse.data);
  } catch (err) {
    console.error('Forecast error:', err.message);
    res.status(500).json({ message: 'Forecast service unavailable. Ensure ML service is running.' });
  }
});

app.post('/api/detect-anomaly', authMiddleware, async (req, res) => {
  try {
    const { history, current } = req.body;
    const mlResponse = await axios.post(`${ML_SERVICE}/detect-anomaly`, { history, current }, { timeout: 10000 });
    res.json(mlResponse.data);
  } catch (err) {
  
    const { history, current } = req.body;
    if (history && history.length > 2) {
      const mean = history.reduce((a, b) => a + b, 0) / history.length;
      const std = Math.sqrt(history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / history.length);
      const zScore = std > 0 ? Math.abs((current - mean) / std) : 0;
      res.json({ is_anomaly: zScore > 2, z_score: parseFloat(zScore.toFixed(2)), mean: parseFloat(mean.toFixed(2)) });
    } else {
      res.json({ is_anomaly: false, z_score: 0 });
    }
  }
});

app.post('/api/calculate-distance', authMiddleware, async (req, res) => {
  try {
    const { start, destination } = req.body;
    if (!start || !destination)
      return res.status(400).json({ message: 'Start and destination are required' });

    const [startGeo, endGeo] = await Promise.all([
      axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: start, format: 'json', limit: 1 },
        headers: { 'User-Agent': 'CarbonWise/2.0 (carbonwise@project.com)' },
        timeout: 8000
      }),
      axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: destination, format: 'json', limit: 1 },
        headers: { 'User-Agent': 'CarbonWise/2.0 (carbonwise@project.com)' },
        timeout: 8000
      })
    ]);

    if (!startGeo.data.length || !endGeo.data.length)
      return res.status(404).json({ message: 'Could not geocode one or both locations. Try being more specific.' });

    const lat1 = parseFloat(startGeo.data[0].lat);
    const lon1 = parseFloat(startGeo.data[0].lon);
    const lat2 = parseFloat(endGeo.data[0].lat);
    const lon2 = parseFloat(endGeo.data[0].lon);
    const distance = haversineKm(lat1, lon1, lat2, lon2);

    res.json({
      distance: Math.round(distance),
      start: { lat: lat1, lon: lon1, display_name: startGeo.data[0].display_name },
      destination: { lat: lat2, lon: lon2, display_name: endGeo.data[0].display_name }
    });
  } catch (err) {
    console.error('Distance error:', err.message);
    res.status(500).json({ message: 'Could not calculate distance. Check location names.' });
  }
});

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function inferScope(activityType) {
  const t = activityType.toLowerCase();
  if (t.includes('route') || t.includes('vehicle') || t.includes('travel') || t.includes('fleet')) return 1;
  if (t.includes('industrial') || t.includes('grid') || t.includes('electricity') || t.includes('energy')) return 2;
  return 3;
}

app.listen(port, () => console.log(`CarbonWise API running on http://localhost:${port}`));
