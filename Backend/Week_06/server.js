const express = require('express');
const JobRepository = require('./repository');

const app = express();
app.use(express.json());
const PORT = 3000;

// 1. Ingestion Endpoint: Accepts work and returns instantly
app.post('/api/ai/generate-report', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        // Push the job to the database queue
        const jobId = await JobRepository.createJob('generate_ai_report', { prompt });

        // 202 Accepted: The request has been accepted for processing, but processing is not complete.
        res.status(202).json({
            status: "accepted",
            message: "Your AI report is being generated in the background.",
            jobId: jobId,
            statusUrl: `http://localhost:${PORT}/api/jobs/${jobId}/status`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Status Endpoint: Allows clients to check on their job
app.get('/api/jobs/:id/status', async (req, res) => {
    try {
        const job = await JobRepository.getJobStatus(req.params.id);
        
        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        res.json({
            jobId: job.id,
            status: job.status,
            result: job.result ? JSON.parse(job.result) : null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🌐 API Server listening on port ${PORT}`);
});