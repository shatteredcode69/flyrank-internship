require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { outputSchema } = require('./schema');

const PROMPT_VERSION = "v1";

// Load versioned prompt safely
const promptPath = path.join(__dirname, `../prompts/triage-${PROMPT_VERSION}.md`);
const systemPrompt = fs.existsSync(promptPath) ? fs.readFileSync(promptPath, 'utf8') : "";

// Helper for OpenRouter AI call with timeout
async function callModel(userText, customSystemPrompt = systemPrompt) {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY in .env file.");
  }

  const url = `https://openrouter.ai/api/v1/chat/completions`;

  const response = await axios.post(
    url,
    {
      model: "openrouter/free",
      messages: [
        { role: 'system', content: customSystemPrompt },
        { role: 'user', content: String(userText) }
      ],
      temperature: 0.1
    },
    {
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // Strict 30-second timeout
    }
  );

  return response.data?.choices?.[0]?.message?.content || "";
}

// Exponential backoff retry handler (Only retries 429, 5xx, and Timeout)
async function callWithRetry(userText, systemPromptToUse) {
  const maxRetries = 2;
  let delay = 1000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const startTime = Date.now();
    try {
      const rawText = await callModel(userText, systemPromptToUse);
      const duration = Date.now() - startTime;
      return { rawText, duration };
    } catch (err) {
      const status = err.response?.status;
      const isTimeout = err.code === 'ECONNABORTED';
      const isRetriable = isTimeout || status === 429 || (status >= 500 && status < 600);

      if (!isRetriable || attempt === maxRetries) {
        throw err;
      }

      const jitter = Math.random() * 200;
      await new Promise(r => setTimeout(r, delay + jitter));
      delay *= 2;
    }
  }
}

// Parse, Validate, Repair & Quarantine Pipeline
async function runTriagePipeline(inputText) {
  // Stub Mode Check
  if (process.env.LLM_STUB === '1') {
    return {
      status: 200,
      data: { category: "bug", urgency: "normal", confidence: 0.9, reason: "[STUB_MODE] Hardcoded valid response" }
    };
  }

  // Kill Switch Check
  if (process.env.LLM_ENABLED === 'false') {
    return {
      status: 200,
      data: { category: "other", urgency: "low", confidence: 0.0, reason: "[KILL_SWITCH] Service currently operating in offline fallback" }
    };
  }

  let repairAttempts = 0;
  let resultText = "";
  let durationMs = 0;

  try {
    const initialCall = await callWithRetry(inputText, systemPrompt);
    resultText = initialCall.rawText;
    durationMs = initialCall.duration;
  } catch (err) {
    if (err.code === 'ECONNABORTED') return { status: 504, error: "LLM Gateway Timeout after 30s" };
    return { status: 500, error: `LLM API Error: ${err.message}` };
  }

  const cleanJson = (str) => String(str).replace(/```json/g, '').replace(/```/g, '').trim();

  // Parse & Validate Attempt 1
  try {
    const parsed = JSON.parse(cleanJson(resultText));
    const validated = outputSchema.parse(parsed);

    logCost(PROMPT_VERSION, durationMs, repairAttempts);
    return { status: 200, data: validated };
  } catch (err) {
    // Repair Retry
    repairAttempts = 1;
    const repairPrompt = `${systemPrompt}\n\nYour previous response was rejected due to validation error: ${err.message}. Raw answer was: "${resultText}". Return ONLY corrected valid JSON matching the schema.`;

    try {
      const repairCall = await callWithRetry(inputText, repairPrompt);
      durationMs += repairCall.duration;
      const repairedParsed = JSON.parse(cleanJson(repairCall.rawText));
      const repairedValidated = outputSchema.parse(repairedParsed);

      logCost(PROMPT_VERSION, durationMs, repairAttempts);
      return { status: 200, data: repairedValidated };
    } catch (repairErr) {
      quarantineFailure(inputText, resultText, repairErr.message);
      return { status: 422, error: "Model output failed schema validation after repair attempt." };
    }
  }
}

function logCost(version, durationMs, repairs) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    prompt_version: version,
    model: "openrouter/free",
    duration_ms: durationMs,
    repair_count: repairs
  };
  console.log(`[COST_LOG] ${JSON.stringify(logEntry)}`);
}

function quarantineFailure(input, rawOutput, errorMsg) {
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  
  const logPath = path.join(logDir, 'quarantine.jsonl');
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    input,
    rawOutput,
    error: errorMsg,
    prompt_version: PROMPT_VERSION
  }) + '\n';
  fs.appendFileSync(logPath, entry);
}

module.exports = { runTriagePipeline };