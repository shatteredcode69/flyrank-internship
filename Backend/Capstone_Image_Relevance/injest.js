require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const db = require('./db');

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const imagesDir = path.join(__dirname, 'images');

// Helper function to call Cloudflare Workers AI
async function runCloudflareAI(model, input) {
    const response = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
        input,
        { headers: { Authorization: `Bearer ${apiToken}` } }
    );
    return response.data;
}

async function processImages() {
    const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

    for (const file of files) {
        console.log(`\n⏳ Processing: ${file}...`);
        const existing = db.prepare('SELECT id FROM images WHERE filename = ?').get(file);
        if (existing) {
            console.log(`⏭️ Skipped (Already processed)`);
            continue;
        }

        const imagePath = path.join(imagesDir, file);
        // Cloudflare Vision requires a byte array
        const imageBuffer = fs.readFileSync(imagePath);
        const imageArray = Array.from(new Uint8Array(imageBuffer));

        try {
            // --- 1. Vision Tagging (LLaVA via Cloudflare) ---
            const visionResult = await runCloudflareAI('@cf/llava-hf/llava-1.5-7b-hf', {
                image: imageArray,
                prompt: "What is the primary animal in this image? Answer with just the name of the animal in one or two words."
            });
            
            // LLaVA will attempt to answer the prompt directly
            const rawResponse = visionResult.result.description;
            // Clean up the response to isolate the subject (e.g., "A red fox." -> "red fox")
            const subject = rawResponse.toLowerCase().replace(/[^\w\s]/gi, '').trim(); 
            const caption = `An image showing a ${subject}.`;
            const confidence = 0.90; // Default high confidence
            const cost = 0.00; // Cloudflare Free Tier

            // --- 2. Semantic Embedding (BGE via Cloudflare) ---
            const embedResult = await runCloudflareAI('@cf/baai/bge-base-en-v1.5', {
                text: [caption]
            });
            
            const embedding = embedResult.result.data[0];

            // --- 3. Save to SQLite Database ---
            db.prepare(`
                INSERT INTO images (filename, subject, category, caption, confidence, embedding, cost) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(file, subject, "Cloudflare Auto-Tagged", caption, confidence, JSON.stringify(embedding), cost);

            console.log(`✅ Success: Tagged as '${subject}'`);

        } catch (error) {
            console.error(`❌ Failed to process ${file}:`, error.response?.data?.errors || error.message);
        }
    }
}

processImages();