CREATE TABLE IF NOT EXISTS interns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    track VARCHAR(50) NOT NULL
);

-- Seed data for testing the GET endpoint immediately
INSERT INTO interns (name, track) VALUES ('Initial User', 'Backend & AI Engineering');