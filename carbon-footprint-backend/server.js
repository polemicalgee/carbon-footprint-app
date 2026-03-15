const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;


app.use(cors()); 
app.use(express.json()); 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false 
  }
});
pool.on('error', (err, client) => {
  console.error('🔴 Unexpected error on idle client:', err.message);
});

pool.connect()
  .then(() => console.log('🟢 Connected to Neon PostgreSQL cloud successfully!'))
  .catch(err => console.error('🔴 Database connection error:', err.stack));


app.get('/', (req, res) => {
  res.send('CarbonWise API is online and running!');
});

app.get('/', (req, res) => {
  res.send('CarbonWise API is online and running!');
});


app.post('/api/users', async (req, res) => {
  try {
   
    const { name, email, password } = req.body;

    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, password]
    );

   
    res.status(201).json(newUser.rows[0]);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error: Could not create user");
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    
    const validPassword = (password === user.rows[0].password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    
    res.status(200).json({
      id: user.rows[0].id,
      name: user.rows[0].name,
      email: user.rows[0].email
    });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error: Could not log in");
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    
    const { user_id, activity_type, emissions } = req.body;

    
    const newReport = await pool.query(
      "INSERT INTO reports (user_id, activity_type, emissions) VALUES ($1, $2, $3) RETURNING *",
      [user_id, activity_type, emissions]
    );


    res.status(201).json(newReport.rows[0]);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error: Could not save carbon report");
  }
});

app.get('/api/reports/:userId', async (req, res) => {
  try {
    
    const { userId } = req.params;

    
    const userReports = await pool.query(
      "SELECT * FROM reports WHERE user_id = $1 ORDER BY date_recorded DESC",
      [userId]
    );

    
    res.status(200).json(userReports.rows);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error: Could not fetch reports");
  }
});

app.delete('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params; 

    const deleteReport = await pool.query(
      "DELETE FROM reports WHERE id = $1 RETURNING *",
      [id]
    );

    
    if (deleteReport.rows.length === 0) {
      return res.status(404).json({ message: "Report not found!" });
    }

    res.status(200).json({ message: "Report was deleted successfully!" });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error: Could not delete report");
  }
});

app.put('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { activity_type, emissions } = req.body; 

    const updateReport = await pool.query(
      "UPDATE reports SET activity_type = $1, emissions = $2 WHERE id = $3 RETURNING *",
      [activity_type, emissions, id]
    );

    if (updateReport.rows.length === 0) {
      return res.status(404).json({ message: "Report not found!" });
    }

    res.status(200).json(updateReport.rows[0]); 
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error: Could not update report");
  }
});
const { spawn } = require('child_process');
app.post('/api/predict-emissions', (req, res) => {
    const { engineSize, cylinders, fuelConsumption } = req.body;
    const pythonProcess = spawn('python', ['predict.py', engineSize, cylinders, fuelConsumption]);

    let output = '';

    // 1. Collect all data from Python
    pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
    });

    // 2. Log warnings to the terminal, but DO NOT crash the server
    pythonProcess.stderr.on('data', (data) => {
        console.warn(`Python Warning (Ignored): ${data}`); 
    });

    // 3. When Python is completely finished, send the response
    pythonProcess.on('close', (code) => {
        // Grab only the very last line printed by Python (the actual number)
        const cleanOutput = output.trim().split('\n').pop();
        const predictedCO2 = parseFloat(cleanOutput);

        if (isNaN(predictedCO2)) {
            return res.status(500).json({ success: false, message: "Could not read AI output." });
        }

        res.json({ success: true, predicted_emission: predictedCO2 });
    });
});


app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});