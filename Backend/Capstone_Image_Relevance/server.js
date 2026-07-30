require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cosineSimilarity = require('compute-cosine-similarity');
const db = require('./db');

const app = express();
app.use(express.json());

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

// Cloudflare helper
async function runCloudflareAI(model, input) {
    const response = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
        input,
        { headers: { Authorization: `Bearer ${apiToken}` } }
    );
    return response.data;
}

const THRESHOLD = 0.65; // BGE-Base embeddings often require a higher threshold

app.get('/posts/:id/images', async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // 1. Embed the post text
    let postEmbedding = post.embedding ? JSON.parse(post.embedding) : null;
    if (!postEmbedding) {
        const embedResult = await runCloudflareAI('@cf/baai/bge-base-en-v1.5', {
            text: [post.target_subject + " " + post.content]
        });
        postEmbedding = embedResult.result.data[0];
        db.prepare('UPDATE posts SET embedding = ? WHERE id = ?').run(JSON.stringify(postEmbedding), post.id);
    }

    // 2. Fetch images & calculate similarity
    const images = db.prepare('SELECT id, filename, subject, caption, confidence, embedding FROM images').all();
    let candidates = images.map(img => {
        const imgEmbedding = JSON.parse(img.embedding);
        const score = cosineSimilarity(postEmbedding, imgEmbedding);
        return { ...img, score, embedding: undefined }; 
    }).sort((a, b) => b.score - a.score); 

    if (candidates.length === 0) return res.json({ status: "No images available in database." });

    const bestMatch = candidates[0];

    // 3. THE MISMATCH GUARD 🛡️
    if (bestMatch.score < THRESHOLD) {
        return res.status(406).json({ 
            flag: "REJECTED_BY_GUARD", 
            reason: `Best match score (${bestMatch.score.toFixed(2)}) is below the acceptable threshold of ${THRESHOLD}.`,
            best_attempt: bestMatch 
        });
    }

    const postTarget = post.target_subject.toLowerCase();
    const imageSubject = bestMatch.subject.toLowerCase();
    
    // Tag Conflict Rule
    if (!imageSubject.includes(postTarget) && !postTarget.includes(imageSubject)) {
        return res.status(406).json({
            flag: "REJECTED_BY_GUARD",
            reason: `Subject tag mismatch. Post requires '${postTarget}', but highest ranking image is tagged as '${imageSubject}'.`,
            best_attempt: bestMatch
        });
    }

    res.json({
        status: "MATCH_APPROVED",
        post_title: post.title,
        suggested_image: bestMatch
    });
});

app.listen(3000, () => console.log('🚀 Mismatch Guard API running on http://localhost:3000'));