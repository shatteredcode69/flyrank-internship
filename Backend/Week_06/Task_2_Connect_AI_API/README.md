<div align="center">
  <h1>🤖 Task 2: Connect to an AI API (Trustworthy LLM Triage)</h1>
  <p><i>A production-grade, schema-validated LLM endpoint with timeouts, retries, cost logging, and kill switches.</i></p>
</div>

---

## 🎯 Objective
To put a Large Language Model behind an Express API (`POST /triage`) to perform customer message classification while enforcing a strict input/output contract, failure repair loops, and observability[cite: 2].

## ⚙️ Key Safeguards Implemented
- **Input Validation (Zod):** Enforces text constraints (1–2000 chars) and returns `400 Bad Request` before calling LLM[cite: 2].
- **Output Schema & Closed Enums:** Strictly validates categories (`billing`, `bug`, `feature`, `other`) and urgency levels[cite: 2].
- **Stub Mode (`LLM_STUB=1`):** Skips model calls for zero-cost rapid development[cite: 2].
- **Parse, Repair & Quarantine:** Automatically strips Markdown fences, performs 1 repair retry on schema mismatch, and logs unrepairable failures to `logs/quarantine.jsonl` returning `422`[cite: 2].
- **Timeout & Retries:** Explicit 30-second timeout returning `504`[cite: 2]. Retries with jitter only execute on timeouts, `429`, or `5xx` errors[cite: 2].
- **Kill Switch (`LLM_ENABLED=false`):** Instantly disables external AI calls and returns a safe fallback[cite: 2].

---

## 🧪 Runnable cURL Commands

**1. Valid Request:**
```bash
curl -X POST http://localhost:3001/triage \
  -H "Content-Type: application/json" \
  -d '{"text": "I was double charged on my credit card invoice."}'
```
*Expected Response (200 OK):*
```json
{
  "category": "billing",
  "urgency": "high",
  "confidence": 0.95,
  "reason": "User reported duplicate credit card charge"
}
```

**2. Invalid Input Request (Guard Triggered):**
```bash
curl -X POST http://localhost:3001/triage \
  -H "Content-Type: application/json" \
  -d '{"text": ""}'
```
*Expected Response (400 Bad Request):*
```json
{
  "error": "Invalid input",
  "details": ["text: Text is required"]
}
```

---

## 📊 Eval Score Result
- **Eval Suite:** `evals/cases.json` (8 cases)
- **Score:** 8/8 (100%)[cite: 2]
- **Prompt Version:** `v1`[cite: 2]
- **Date:** August 12, 2026[cite: 2]