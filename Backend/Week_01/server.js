const express = require('express'); 
const app = express(); 
const PORT = 3000; 
 
// Endpoint 1: Health Check 
app.get('/api/status', (req, res) => { 
    res.json({ status: "success", message: "Server is up and running!" }); 
}); 
 
// Endpoint 2: Intern Details 
app.get('/api/intern', (req, res) => { 
    res.json({ role: "Backend & AI Fluency Intern", track: "FlyRank", week: 1 }); 
}); 
 
app.listen(PORT, () => { 
    console.log(`Server listening on http://localhost:${PORT}`); 
}); 
