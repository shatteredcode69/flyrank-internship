require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { runTriagePipeline } = require('../src/llmClient');

async function runEval() {
  const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'cases.json'), 'utf8'));
  let passed = 0;

  console.log(`\n🧪 Running Eval Suite (${cases.length} cases)...\n`);    for (const c of cases) {     const res = await runTriagePipeline(c.text);     const category = res.data?.category;     const isMatch = category === c.expected_category;      if (isMatch) passed++;      console.log(`Case #${c.id}: ${isMatch ? '✅ PASS' : '❌ FAIL'} \vert{} Input: "${c.text}" | Got: ${category} \vert{} Expected:${c.expected_category}`);
  }

  const score = ((passed / cases.length) * 100).toFixed(1);
  console.log(`\n📊 Final Eval Score: ${passed}/${cases.length} (${score}%)\n`);
}

runEval();