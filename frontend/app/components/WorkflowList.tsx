'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaFolder, FaShare, FaClock, FaPen, FaCheck, FaTimes } from 'react-icons/fa';
import { mockAPI } from '@/app/lib/mockApi';
import { format } from 'date-fns';

interface Workflow {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  is_public: boolean;
}

interface WorkflowListProps {
  selectedWorkflow: Workflow | null;
  onSelectWorkflow: (workflow: Workflow) => void;
}

export default function WorkflowList({
  selectedWorkflow,
  onSelectWorkflow,
}: WorkflowListProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const data = await mockAPI.getWorkflows();
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    }
  };

  const createWorkflow = async () => {
    if (!newWorkflowName.trim()) return;

    try {
      const workflow = await mockAPI.createWorkflow({
        name: newWorkflowName,
        description: '',
        is_public: false,
        nodes: [
          {
            id: 'start',
            type: 'start',
            position: { x: 100, y: 100 },
            data: { label: 'Start' },
          },
          {
            id: 'end',
            type: 'end',
            position: { x: 100, y: 300 },
            data: { label: 'End' },
          },
        ],
        edges: [],
      });

      setWorkflows([...workflows, workflow]);
      setNewWorkflowName('');
      setIsCreating(false);
      onSelectWorkflow(workflow);
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  };

  const startRenaming = (workflow: Workflow, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(workflow.id);
    setEditingName(workflow.name);
  };

  const saveRename = async (workflowId: number) => {
    if (!editingName.trim() || editingName === workflows.find(w => w.id === workflowId)?.name) {
      setEditingId(null);
      return;
    }

    try {
      // Update the workflow name using mockAPI
      const updatedWorkflow = await mockAPI.updateWorkflow(workflowId, { name: editingName });
      
      // Update local state
      setWorkflows(workflows.map(w => 
        w.id === workflowId ? { ...w, name: editingName } : w
      ));
      
      // If this is the selected workflow, update it
      if (selectedWorkflow?.id === workflowId) {
        onSelectWorkflow({ ...selectedWorkflow, name: editingName });
      }
      
      setEditingId(null);
    } catch (error) {
      console.error('Failed to rename workflow:', error);
    }
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => setIsCreating(true)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <FaPlus className="w-4 h-4" />
          <span>New Workflow</span>
        </button>
      </div>

      {isCreating && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <input
            type="text"
            value={newWorkflowName}
            onChange={(e) => setNewWorkflowName(e.target.value)}
            placeholder="Workflow name..."
            className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
            autoFocus
          />
          <div className="flex space-x-2">
            <button
              onClick={createWorkflow}
              className="flex-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewWorkflowName('');
              }}
              className="flex-1 px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            onClick={() => onSelectWorkflow(workflow)}
            className={`group p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 ${
              selectedWorkflow?.id === workflow.id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {editingId === workflow.id ? (
                  <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveRename(workflow.id);
                        } else if (e.key === 'Escape') {
                          cancelRename();
                        }
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:border-blue-600"
                      autoFocus
                    />
                    <button
                      onClick={() => saveRename(workflow.id)}
                      className="p-1 text-green-600 hover:text-green-800"
                    >
                      <FaCheck className="w-3 h-3" />
                    </button>
                    <button
                      onClick={cancelRename}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                    <button
                      onClick={(e) => startRenaming(workflow, e)}
                      className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaPen className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {workflow.description && !editingId && (
                  <p className="text-sm text-gray-600 mt-1">
                    {workflow.description}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <FaClock className="w-3 h-3" />
                    <span>{format(new Date(workflow.created_at), 'MMM d')}</span>
                  </div>
                  {workflow.is_public && (
                    <div className="flex items-center space-x-1">
                      <FaShare className="w-3 h-3" />
                      <span>Public</span>
                    </div>
                  )}
                </div>
              </div>
              <FaFolder className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}