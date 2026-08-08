const fs = require('fs');
const PDFDocument = require('pdfkit');
const JobRepository = require('./repository');

// Add this block to ensure the directory always exists!
if (!fs.existsSync('./reports')) {
    fs.mkdirSync('./reports');
}
// The function that physically generates and saves the PDF
const generatePDF = (jobId, payload) => {
    return new Promise((resolve, reject) => {
        const fileName = `report_${jobId}.pdf`;
        const filePath = `./reports/${fileName}`;
        const relativeUrl = `/reports/${fileName}`;

        // Initialize PDFKit
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // --- DRAW THE PDF ---
        // Header
        doc.fontSize(25).font('Helvetica-Bold').text(payload.title || 'System Data Report', { align: 'center' });
        doc.moveDown();

        // Metadata
        doc.fontSize(12).font('Helvetica').text(`Job ID: ${jobId}`);
        doc.text(`Generated on: ${new Date().toLocaleString()}`);
        doc.moveDown(2);

        // Body Data
        doc.fontSize(14).font('Helvetica-Bold').text('Aggregated Metrics:');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(payload.data || 'No data provided in payload.');

        // Footer
        doc.moveDown(5);
        doc.fontSize(10).fillColor('gray').text('Generated automatically via FlyRank Background Worker System', { align: 'center' });

        doc.end();

        // Wait for the stream to finish writing to disk
        stream.on('finish', () => resolve(relativeUrl));
        stream.on('error', reject);
    });
};

const startWorker = async () => {
    console.log('👷 PDF Worker started. Polling for jobs...');

    setInterval(async () => {
        try {
            const job = await JobRepository.fetchNextJob();

            if (job) {
                console.log(`\n⚙️ Processing PDF generation for Job #${job.id}...`);
                const payload = JSON.parse(job.payload);

                // Add an artificial delay to simulate heavy data querying
                await new Promise(res => setTimeout(res, 3000));

                // Generate the artifact
                const fileUrl = await generatePDF(job.id, payload);

                // Complete the job with the URL, not the file blob
                await JobRepository.completeJob(job.id, fileUrl);
                console.log(`✅ Job #${job.id} complete. PDF saved to ${fileUrl}`);
            }
        } catch (err) {
            console.error('❌ Worker error:', err.message);
        }
    }, 3000);
};

startWorker();