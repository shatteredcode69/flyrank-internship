import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { executeDecisionFlow } from "../../../inngest/workflow";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [executeDecisionFlow],
});