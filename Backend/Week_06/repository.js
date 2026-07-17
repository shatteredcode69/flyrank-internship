const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Initialize the SQLite connection and create the jobs table
let dbPromise = open({
    filename: './queue_db.sqlite',
    driver: sqlite3.Database
}).then(async (db) => {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_name TEXT NOT NULL,
            status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
            payload TEXT,
            result TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    return db;
});

const JobRepository = {
    createJob: async (taskName, payload) => {
        const db = await dbPromise;
        const result = await db.run(
            'INSERT INTO jobs (task_name, payload) VALUES (?, ?)',
            [taskName, JSON.stringify(payload)]
        );
        return result.lastID;
    },
    
    getJobStatus: async (id) => {
        const db = await dbPromise;
        return await db.get('SELECT id, status, result FROM jobs WHERE id = ?', [id]);
    },

    // Worker method: Finds the oldest pending job and locks it by setting status to 'processing'
    fetchNextJob: async () => {
        const db = await dbPromise;
        const job = await db.get("SELECT * FROM jobs WHERE status = 'pending' ORDER BY id ASC LIMIT 1");
        
        if (job) {
            await db.run("UPDATE jobs SET status = 'processing' WHERE id = ?", [job.id]);
        }
        return job;
    },

    completeJob: async (id, resultData) => {
        const db = await dbPromise;
        await db.run(
            "UPDATE jobs SET status = 'completed', result = ? WHERE id = ?", 
            [JSON.stringify(resultData), id]
        );
    }
};

module.exports = JobRepository;