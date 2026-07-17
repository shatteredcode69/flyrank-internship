const express = require('express');
const JobRepository = require('./repository');

const app = express();
app.use(express.json());

// Serve the reports directory so users can download the generated PDFs
app.use('/reports', express.static('reports'));

const PORT = 3000;

// 1. Ingestion Endpoint
app.post('/api/reports/generate', async (req, res) => {
    try {
        const { title, data } = req.body;
        
        // Push the job to the database queue
        const jobId = await JobRepository.createJob({ title, data });

        res.status(202).json({
            status: "accepted",
            message: "Report generation started in the background.",
            jobId: jobId,
            statusUrl: `http://localhost:${PORT}/api/jobs/${jobId}/status`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Status Endpoint
app.get('/api/jobs/:id/status', async (req, res) => {
    try {
        const job = await JobRepository.getJobStatus(req.params.id);
        
        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        const response = { jobId: job.id, status: job.status };
        
        // Only attach the download URL if the job is completed
        if (job.status === 'completed') {
            response.downloadUrl = `http://localhost:${PORT}${job.result_url}`;
        }

        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🌐 Server listening on port ${PORT}. Serving PDFs from /reports`);
});