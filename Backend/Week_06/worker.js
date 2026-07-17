const JobRepository = require('./repository');

// Simulate a heavy, slow AI operation (e.g., 8 seconds)
const simulateSlowAI = (payload) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`Final AI Analysis complete for prompt: "${payload.prompt}". Data synthesized successfully.`);
        }, 8000);
    });
};

const startWorker = async () => {
    console.log('👷 Background Worker started. Polling for jobs...');

    // Polling interval: Check database every 3 seconds
    setInterval(async () => {
        try {
            const job = await JobRepository.fetchNextJob();
            
            if (job) {
                console.log(`\n⚙️ Found pending job #${job.id}. Setting status to 'processing'...`);
                const payload = JSON.parse(job.payload);

                // Perform the slow operation
                const aiResult = await simulateSlowAI(payload);

                // Mark as completed
                await JobRepository.completeJob(job.id, { success: true, analysis: aiResult });
                console.log(`✅ Job #${job.id} completed and result saved to database.`);
            }
        } catch (err) {
            console.error('❌ Worker error:', err.message);
        }
    }, 3000);
};

startWorker();