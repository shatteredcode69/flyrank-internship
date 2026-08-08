const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

let dbPromise = open({
    filename: './report_queue.sqlite',
    driver: sqlite3.Database
}).then(async (db) => {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            status TEXT DEFAULT 'pending', 
            payload TEXT,
            result_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    return db;
});

const JobRepository = {
    createJob: async (payload) => {
        const db = await dbPromise;
        const result = await db.run(
            'INSERT INTO jobs (payload) VALUES (?)',
            [JSON.stringify(payload)]
        );
        return result.lastID;
    },
    
    getJobStatus: async (id) => {
        const db = await dbPromise;
        return await db.get('SELECT id, status, result_url FROM jobs WHERE id = ?', [id]);
    },

    fetchNextJob: async () => {
        const db = await dbPromise;
        const job = await db.get("SELECT * FROM jobs WHERE status = 'pending' ORDER BY id ASC LIMIT 1");
        if (job) {
            await db.run("UPDATE jobs SET status = 'processing' WHERE id = ?", [job.id]);
        }
        return job;
    },

    completeJob: async (id, fileUrl) => {
        const db = await dbPromise;
        await db.run(
            "UPDATE jobs SET status = 'completed', result_url = ? WHERE id = ?", 
            [fileUrl, id]
        );
    }
};

module.exports = JobRepository;