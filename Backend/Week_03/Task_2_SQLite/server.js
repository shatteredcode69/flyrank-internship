const express = require('express');
const { DatabaseSync } = require('node:sqlite'); // Using Node's native built-in SQLite!

const app = express();
app.use(express.json());
const PORT = 3000;

// --- STAGE 0: Initialize SQLite Database ---
const db = new DatabaseSync('tasks.db');

// Create the schema automatically
db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        done INTEGER DEFAULT 0
    )
`);

// Insert default seed data ONLY if the table is currently empty
const rowCount = db.prepare('SELECT COUNT(*) AS count FROM tasks').get();
if (rowCount.count === 0) {
    const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
    insert.run('Audit AI workflows', 1);
    insert.run('Build Node.js CRUD API', 0);
    insert.run('Containerize the stack', 0);
    console.log('📦 Database initialized with default tasks.');
}

// Helper function to map SQLite integers (0/1) to Booleans (false/true)
const formatTask = (task) => ({ ...task, done: task.done === 1 });

// --- STAGE 1: Read Endpoints ---
app.get('/tasks', (req, res) => {
    const tasks = db.prepare('SELECT * FROM tasks').all();
    res.json(tasks.map(formatTask));
});

app.get('/tasks/:id', (req, res) => {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
        return res.status(404).json({ error: "Task not found" });
    }
    res.json(formatTask(task));
});

// --- STAGE 2: Create Endpoint ---
app.post('/tasks', (req, res) => {
    const { title } = req.body;
    
    if (!title || title.trim() === '') {
        return res.status(400).json({ error: "Bad Request: title is required" });
    }
    
    const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, 0)');
    const result = insert.run(title.trim());
    
    res.status(201).json({ id: result.lastInsertRowid, title: title.trim(), done: false });
});

// --- STAGE 3: Update & Delete Endpoints ---
app.put('/tasks/:id', (req, res) => {
    const { title, done } = req.body;
    const id = req.params.id;
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) {
        return res.status(404).json({ error: "Task not found" });
    }
    
    if (title === undefined && done === undefined) {
        return res.status(400).json({ error: "Bad Request: Empty or invalid body" });
    }
    
    const newTitle = title !== undefined ? title : task.title;
    const newDone = done !== undefined ? (done ? 1 : 0) : task.done;
    
    db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(newTitle, newDone, id);
    
    res.json({ id: parseInt(id), title: newTitle, done: newDone === 1 });
});

app.delete('/tasks/:id', (req, res) => {
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
        return res.status(404).json({ error: "Task not found" });
    }
    
    res.status(204).send();
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});