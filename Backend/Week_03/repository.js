const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const InternRepository = {
    getAll: async () => {
        const result = await pool.query('SELECT * FROM interns');
        return result.rows;
    },
    create: async (name, track) => {
        const result = await pool.query(
            'INSERT INTO interns (name, track) VALUES ($1, $2) RETURNING *',
            [name, track]
        );
        return result.rows[0];
    }
};

module.exports = InternRepository;