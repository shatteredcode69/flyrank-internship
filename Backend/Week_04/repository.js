const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Initialize the SQLite database connection and create the table automatically
let dbPromise = open({
    filename: './flyrank_db.sqlite', // The lightweight file that replaces Postgres
    driver: sqlite3.Database
}).then(async (db) => {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    return db;
});

const UserRepository = {
    createUser: async (email, passwordHash) => {
        const db = await dbPromise;
        // SQLite uses ? instead of $1, $2 for variables
        const result = await db.run(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, passwordHash]
        );
        // Fetch and return the newly created user
        return await db.get('SELECT id, email, created_at FROM users WHERE id = ?', result.lastID);
    },
    
    getUserByEmail: async (email) => {
        const db = await dbPromise;
        return await db.get('SELECT * FROM users WHERE email = ?', [email]);
    }
};

module.exports = UserRepository;