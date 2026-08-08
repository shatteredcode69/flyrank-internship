import { inngest } from "../../../inngest/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  
  await inngest.send({
    name: "flow/execute",
    data: { nodes: body.nodes, edges: body.edges },
  });

  return NextResponse.json({ message: "Workflow started" });
}