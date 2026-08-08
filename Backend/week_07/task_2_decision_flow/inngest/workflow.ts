// @ts-nocheck
import { inngest } from "./client";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

export const executeDecisionFlow = inngest.createFunction(
  { 
    id: "execute-decision-flow",
    // The new Inngest SDK requires triggers to be defined here in the first argument
    triggers: [{ event: "flow/execute" }] 
  },
  async ({ event, step }) => {
    
    const payload = event.data;
    const nodes = payload.nodes || [];
    const edges = payload.edges || [];
    const logs = [];
    
    let currentNode = nodes.find((n) => !edges.some((e) => e.target === n.id));

    while (currentNode) {
      logs.push(`Executing Node [${currentNode.id}]: ${currentNode.data.label}`);

      const nodeId = currentNode.id;
      const nodePrompt = currentNode.data.prompt || "Is the sky blue?";

      const aiDecision = await step.run(`ai-decision-${nodeId}`, async () => {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3-8b-instruct`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messages: [
                { role: "system", content: "You are a decision engine. Respond ONLY with the exact word 'YES' or 'NO'." },
                { role: "user", content: nodePrompt }
              ]
            })
          }
        );

        const data = await response.json();
        
        const rawText = data.result?.response || "";
        const cleanText = String(rawText).replace(/[^\w\s]/gi, '').trim().toUpperCase();
        
        return cleanText.includes("YES") ? "YES" : "NO";
      });

      logs.push(`AI Decision: ${aiDecision}`);

      const outgoingEdges = edges.filter((e) => e.source === nodeId);
      const selectedEdge = outgoingEdges.find((e) => 
        (aiDecision === "YES" && e.sourceHandle === "yes") || 
        (aiDecision === "NO" && e.sourceHandle === "no")
      );

      if (selectedEdge) {
        currentNode = nodes.find((n) => n.id === selectedEdge.target);
      } else {
        logs.push("End of flow reached.");
        break;
      }
    }

    return { success: true, logs };
  }
);