const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./openapi.json');

const app = express();
app.use(express.json());
const PORT = 3000;

// --- STAGE 2: IN-MEMORY DATABASE ---
let tasks = [
    { id: 1, title: "Audit AI workflows", done: true },
    { id: 2, title: "Build Node.js CRUD API", done: false },
    { id: 3, title: "Containerize the stack", done: false }
];
let nextId = 4;

// --- STAGE 5: SWAGGER UI ---
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- STAGE 1: FRONT DOOR & HEALTH CHECK ---
app.get('/', (req, res) => {
    res.json({ name: "Task API", version: "1.0", endpoints: ["/tasks"] });
});

app.get('/health', (req, res) => {
    res.json({ status: "ok" });
});

// --- STAGE 2: READ ENDPOINTS ---
app.get('/tasks', (req, res) => {
    res.json(tasks);
});

app.get('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(t => t.id === id);
    if (!task) {
        return res.status(404).json({ error: `Task ${id} not found` });
    }
    res.json(task);
});

// --- STAGE 3: CREATE ENDPOINT ---
app.post('/tasks', (req, res) => {
    const { title } = req.body;
    
    // Validation
    if (!title || title.trim() === '') {
        return res.status(400).json({ error: "Bad Request: title is required" });
    }
    
    const newTask = { id: nextId++, title: title.trim(), done: false };
    tasks.push(newTask);
    res.status(201).json(newTask); // 201 Created
});

// --- STAGE 4: UPDATE & DELETE ENDPOINTS ---
app.put('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { title, done } = req.body;
    
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
        return res.status(404).json({ error: `Task ${id} not found` });
    }
    
    if (title === undefined && done === undefined) {
        return res.status(400).json({ error: "Bad Request: Empty or invalid body" });
    }
    
    if (title !== undefined) tasks[taskIndex].title = title;
    if (done !== undefined) tasks[taskIndex].done = done;

    res.json(tasks[taskIndex]);
});

app.delete('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
        return res.status(404).json({ error: `Task ${id} not found` });
    }
    
    tasks.splice(taskIndex, 1);
    res.status(204).send(); // 204 No Content
});

// --- STAGE 0: START SERVER ---
app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
    console.log(`📄 Swagger UI available at http://localhost:${PORT}/docs`);
});