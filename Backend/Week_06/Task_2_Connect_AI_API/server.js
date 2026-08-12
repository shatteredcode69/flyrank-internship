require('dotenv').config();
const express = require('express');
const { inputSchema } = require('./src/schema');
const { runTriagePipeline } = require('./src/llmClient');

const app = express();
app.use(express.json());

app.post('/triage', async (req, res) => {
  // 1. Input Validation Guard (Pre-LLM)
  const validation = inputSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid input",
      details: validation.error.errors.map(e => `${e.path.join('.')}:${e.message}`)
    });
  }

  // 2. Execute LLM Pipeline
  const result = await runTriagePipeline(validation.data.text);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json(result.data);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Triage API listening on port ${PORT}`));