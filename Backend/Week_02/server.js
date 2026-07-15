require('dotenv').config();
const express = require('express');
const { createClient } = require('redis');
const InternRepository = require('./repository.js');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Initialize Redis Client (Stretch Goal)
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

// 1. Health & Redis Check
app.get('/api/status', async (req, res) => {
    try {
        await redisClient.ping();
        res.json({ status: "success", message: "App, Postgres, and Redis are running!" });
    } catch (err) {
        res.status(500).json({ status: "error", message: "Redis not connected" });
    }
});

// 2. Fetch all interns (Uses Repository)
app.get('/api/interns', async (req, res) => {
    try {
        const data = await InternRepository.getAll();
        res.json({ status: "success", data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Create a new intern (Uses Repository)
app.post('/api/interns', async (req, res) => {
    try {
        const { name, track } = req.body;
        const newIntern = await InternRepository.create(name, track);
        res.status(201).json({ status: "success", data: newIntern });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});