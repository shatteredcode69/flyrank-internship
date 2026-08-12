# Job Card: Support Message Triage Engine

- **What it does:** Classifies incoming customer support messages so they land on the correct internal team.
- **Input:** `{ "text": "string, 1-2000 characters" }`
- **Output:**
  ```json
  {
    "category": "billing | bug | feature | other",
    "urgency": "low | normal | high",
    "confidence": 0.0 - 1.0,
    "reason": "one short sentence explaining the classification"
  }