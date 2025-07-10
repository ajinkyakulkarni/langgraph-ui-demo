'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import ChatInterface from '@/app/components/ChatInterface';
import WorkflowList from '@/app/components/WorkflowList';

const WorkflowCanvas = dynamic(() => import('@/app/components/WorkflowCanvas'), {
  ssr: false,
});

export default function WorkflowPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [workflowState, setWorkflowState] = useState<any>(null);
  const canvasRef = useRef<any>(null);

  const handleWorkflowUpdate = (update: any) => {
    setWorkflowState(update);
    if (canvasRef.current?.updateWorkflow) {
      canvasRef.current.updateWorkflow(update);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">LangGraph Workflow Builder</h1>
          <button className="text-sm text-gray-600 hover:text-gray-900">
            Logout
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar - Workflow List */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <WorkflowList
            selectedWorkflow={selectedWorkflow}
            onSelectWorkflow={setSelectedWorkflow}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Workflow Canvas */}
          <div className="flex-1 bg-gray-100">
            <WorkflowCanvas 
              ref={canvasRef}
              workflow={selectedWorkflow} 
              workflowState={workflowState}
            />
          </div>

          {/* Chat Interface */}
          <div className="w-96 bg-white border-l border-gray-200">
            <ChatInterface 
              workflow={selectedWorkflow} 
              onWorkflowUpdate={handleWorkflowUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}