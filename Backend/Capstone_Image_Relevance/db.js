const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync('relevance.db');

// Initialize Schema
db.exec(`
    CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE,
        subject TEXT,
        category TEXT,
        caption TEXT,
        confidence REAL,
        embedding JSON,
        cost REAL
    );

    CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        target_subject TEXT,
        embedding JSON
    );
`);

// Seed a test post if none exists
const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get();
if (postCount.count === 0) {
    db.prepare(`INSERT INTO posts (title, content, target_subject) VALUES (?, ?, ?)`).run(
        'The Cunning Red Fox', 
        'The red fox (Vulpes vulpes) is the largest of the true foxes. They have a reddish-brown coat and a bushy tail with a white tip.',
        'red fox'
    );
    console.log('✅ Seeded test blog post.');
}

module.exports = db;