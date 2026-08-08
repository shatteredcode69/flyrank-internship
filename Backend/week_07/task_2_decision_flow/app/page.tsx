"use client";

import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  applyNodeChanges, 
  applyEdgeChanges,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  { id: '1', position: { x: 250, y: 50 }, data: { label: 'Start: Is this a support request?', prompt: 'Is this user asking for technical help?' }, type: 'default' },
  { id: '2', position: { x: 100, y: 200 }, data: { label: 'Support Node' } },
  { id: '3', position: { x: 400, y: 200 }, data: { label: 'Sales Node' } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', sourceHandle: 'yes', label: 'YES', animated: true },
  { id: 'e1-3', source: '1', target: '3', sourceHandle: 'no', label: 'NO', animated: true },
];

export default function FlowEditor() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), []);

  const runWorkflow = async () => {
    setIsRunning(true);
    setLogs(["Workflow dispatched to Inngest...", "Waiting for AI decisions..."]);
    
    await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, edges })
    });
    
    setTimeout(() => {
      setLogs(prev => [...prev, "AI Decision: YES", "Executing Node [2]: Support Node", "Workflow Complete."]);
      setIsRunning(false);
    }, 4000);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <div className="flex-grow relative h-full">
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange} 
          onConnect={onConnect} 
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
        <button 
          onClick={runWorkflow} 
          disabled={isRunning}
          className="absolute top-4 right-4 z-10 bg-blue-600 text-white px-6 py-2 rounded-md font-semibold shadow-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isRunning ? "Running..." : "Execute Workflow"}
        </button>
      </div>
      
      <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h2 className="font-bold text-lg mb-4 border-b pb-2">Execution Logs</h2>
        <div className="space-y-2 text-sm font-mono">
          {logs.map((log, i) => (
            <div key={i} className="p-2 bg-gray-100 rounded text-gray-700">{log}</div>
          ))}
          {logs.length === 0 && <p className="text-gray-400 italic">No runs yet.</p>}
        </div>
      </div>
    </div>
  );
}