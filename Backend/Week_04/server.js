require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserRepository = require('./repository');
const protectRoute = require('./authMiddleware');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// --- AUTHENTICATION ROUTES ---

// 1. Register a new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = await UserRepository.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash the password (cost factor of 10)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Save to database
        const newUser = await UserRepository.createUser(email, passwordHash);
        res.status(201).json({ status: "success", data: newUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Fetch user from DB
        const user = await UserRepository.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Compare provided password with stored hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        res.json({ status: "success", token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PROTECTED ROUTES ---

// 3. A route that requires authentication
app.get('/api/protected/dashboard', protectRoute, (req, res) => {
    // The protectRoute middleware guarantees req.user exists if we get here
    res.json({ 
        status: "success", 
        message: `Welcome to your protected dashboard, ${req.user.email}!`,
        tenantId: req.user.id
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});