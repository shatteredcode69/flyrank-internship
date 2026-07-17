// AI Generated Version
const express = require('express');
const app = express();
app.use(express.json());

let tasks = [];
let idCounter = 1;

app.get('/tasks', (req, res) => res.json(tasks));

app.get('/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id == req.params.id);
    if (!task) return res.sendStatus(404); // Flaw: No JSON error message
    res.json(task);
});

app.post('/tasks', (req, res) => {
    if (!req.body.title) return res.status(400).json({ error: "title required" });
    const newTask = { id: idCounter++, title: req.body.title, done: false };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

app.put('/tasks/:id', (req, res) => {
    let task = tasks.find(t => t.id == req.params.id);
    if (!task) return res.sendStatus(404);
    
    // Flaw: Blindly overwrites the entire object instead of merging
    task = { ...task, ...req.body }; 
    res.json(task);
});

app.delete('/tasks/:id', (req, res) => {
    tasks = tasks.filter(t => t.id != req.params.id);
    res.sendStatus(204);
});

app.listen(3000, () => console.log('AI Server running'));