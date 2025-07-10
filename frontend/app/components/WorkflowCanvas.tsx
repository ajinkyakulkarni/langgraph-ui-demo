'use client';

import React, { useCallback, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  MiniMap,
} from 'react-flow-renderer';
import ConfigurableNode from './ConfigurableNode';

const nodeTypes = {
  agent: ConfigurableNode,
  tool: ConfigurableNode,
  start: ConfigurableNode,
  end: ConfigurableNode,
  configurable: ConfigurableNode,
};

interface WorkflowCanvasProps {
  workflow: any;
  workflowState?: any;
}

const WorkflowCanvas = forwardRef(({ workflow, workflowState }: WorkflowCanvasProps, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [executingNode, setExecutingNode] = useState<string | null>(null);
  const [workflowStarted, setWorkflowStarted] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [tempParameters, setTempParameters] = useState<Record<string, string>>({});

  // Create workflow from plan
  const createWorkflowFromPlan = (plan: any) => {
    if (!plan || !plan.steps) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Tree layout configuration
    const startX = 1200;
    const startY = 50;
    const levelHeight = 400;
    const nodeWidth = 400;
    const siblingSpacing = 700;
    
    // Level 0: Start node
    newNodes.push({
      id: 'start',
      type: 'start',
      position: { x: startX, y: startY },
      data: { 
        label: 'Start',
        type: 'start',
        status: 'completed'
      },
    });

    // Level 1: Planner node
    const plannerY = startY + levelHeight;
    newNodes.push({
      id: 'planner',
      type: 'configurable',
      position: { x: startX, y: plannerY },
      data: {
        label: 'PLANNER',
        description: 'Analyzes research goals and creates AI workflow to achieve them',
        type: 'agent',
        agent: 'planner',
        status: 'completed',
        color: 'blue',
        parameters: {
          'Goal Focus': 'Research objectives',
          'Output': 'AI workflow plan'
        },
        guardrails: {
          input: ['Research question'],
          output: ['Workflow steps', 'Agent selection']
        }
      },
    });

    newEdges.push({
      id: 'edge_start_planner',
      source: 'start',
      target: 'planner',
      type: 'smoothstep',
      style: {
        strokeWidth: 3,
        stroke: '#6b7280',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 25,
        height: 25,
        color: '#6b7280',
      },
    });

    // Level 2: Search agents (side by side)
    const searchAgentsY = plannerY + levelHeight;
    const numSteps = plan.steps.length;
    const totalWidth = (numSteps - 1) * siblingSpacing;
    const startXForSteps = startX - totalWidth / 2;

    plan.steps.forEach((step: any, index: number) => {
      const nodeId = step.agent || step.id || `node_${index}`;
      const xPos = startXForSteps + (index * siblingSpacing);
      
      // Determine node configuration based on agent type
      let nodeConfig: any = {
        label: step.agent?.toUpperCase() || 'AGENT',
        description: step.description || `${step.agent} Agent`,
        type: 'agent',
        agent: step.agent,
        query: step.query,
        status: 'pending',
        parameters: {},
        guardrails: {
          input: [],
          output: []
        }
      };

      if (step.agent === 'literature_search') {
        nodeConfig.label = 'LITERATURE SEARCH AGENT';
        nodeConfig.color = 'orange';
        nodeConfig.parameters = {
          'Type of Review': 'Systematic',
          'Time Range': '2020-2024',
          'Quality Assessment': 'Enabled'
        };
        nodeConfig.guardrails = {
          input: ['Data validation complete', 'Processing integrity verified'],
          output: ['Analysis results', 'Literature findings']
        };
      } else if (step.agent === 'code_search') {
        nodeConfig.label = 'CODE SEARCH AGENT';
        nodeConfig.color = 'purple';
        nodeConfig.parameters = {
          'Search Scope': 'GitHub + GitLab',
          'Languages': 'Python, JavaScript',
          'Stars Threshold': '> 100'
        };
        nodeConfig.guardrails = {
          input: ['Search parameters validated'],
          output: ['Code repositories', 'Implementation examples']
        };
      }
      
      newNodes.push({
        id: nodeId,
        type: 'configurable',
        position: { x: xPos, y: searchAgentsY },
        data: nodeConfig,
      });

      // Connect from planner to each agent
      newEdges.push({
        id: `edge_planner_${nodeId}`,
        source: 'planner',
        target: nodeId,
        type: 'smoothstep',
        style: {
          strokeWidth: 3,
          stroke: '#6b7280',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 25,
          height: 25,
          color: '#6b7280',
        },
      });
    });

    // Level 3: Summarizer node
    const summarizerY = searchAgentsY + levelHeight;
    newNodes.push({
      id: 'summarizer',
      type: 'configurable',
      position: { x: startX, y: summarizerY },
      data: {
        label: 'SUMMARY AGENT',
        description: 'Synthesizes findings and generates comprehensive report',
        type: 'agent',
        agent: 'summarizer',
        status: 'pending',
        color: 'green',
        parameters: {
          'Summary Length': 'Detailed',
          'Include Citations': 'Yes',
          'Report Format': 'PDF'
        },
        guardrails: {
          input: ['Data validation complete', 'Processing integrity verified'],
          output: ['Synthesis Complete']
        }
      },
    });

    // Connect all step nodes to summarizer
    plan.steps.forEach((step: any, index: number) => {
      const nodeId = step.agent || step.id || `node_${index}`;
      newEdges.push({
        id: `edge_${nodeId}_summarizer`,
        source: nodeId,
        target: 'summarizer',
        type: 'smoothstep',
        style: {
          strokeWidth: 3,
          stroke: '#6b7280',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 25,
          height: 25,
          color: '#6b7280',
        },
      });
    });

    // Level 4: End node
    const endY = summarizerY + levelHeight;
    newNodes.push({
      id: 'end',
      type: 'end',
      position: { x: startX, y: endY },
      data: { 
        label: 'End',
        type: 'end',
        status: 'pending'
      },
    });

    newEdges.push({
      id: `edge_summarizer_end`,
      source: 'summarizer',
      target: 'end',
      type: 'smoothstep',
      style: {
        strokeWidth: 3,
        stroke: '#6b7280',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 25,
        height: 25,
        color: '#6b7280',
      },
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  // Update node status based on workflow state
  const updateNodeStatus = (nodeUpdate: any) => {
    if (!nodeUpdate) return;

    if (nodeUpdate.type === 'execution_started') {
      setWorkflowStarted(true);
    }

    setNodes((nds) =>
      nds.map((node) => {
        if (nodeUpdate.type === 'execution_started') {
          // Mark start node as completed and first agent as executing
          if (node.id === 'start') {
            return {
              ...node,
              data: { ...node.data, status: 'completed' },
            };
          }
          if (node.id === 'planner') {
            return {
              ...node,
              data: { ...node.data, status: 'executing' },
            };
          }
        } else if (nodeUpdate.type === 'node_update') {
          // Mark current node as executing
          if (node.data.agent === nodeUpdate.node || node.id === nodeUpdate.node) {
            return {
              ...node,
              data: { ...node.data, status: 'executing' },
            };
          }
          // Mark previous executing node as completed
          if (executingNode && (node.data.agent === executingNode || node.id === executingNode)) {
            return {
              ...node,
              data: { ...node.data, status: 'completed' },
            };
          }
        } else if (nodeUpdate.type === 'execution_completed') {
          // Mark final executing node as completed and end node as completed
          if (executingNode && (node.data.agent === executingNode || node.id === executingNode)) {
            return {
              ...node,
              data: { ...node.data, status: 'completed' },
            };
          }
          if (node.id === 'end') {
            return {
              ...node,
              data: { ...node.data, status: 'completed' },
            };
          }
        }
        return node;
      })
    );

    if (nodeUpdate.type === 'node_update') {
      // If we have a plan from the planner, create the workflow
      if (nodeUpdate.node === 'planner' && nodeUpdate.state?.plan) {
        createWorkflowFromPlan(nodeUpdate.state.plan);
      }
      setExecutingNode(nodeUpdate.node);
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    updateWorkflow: (update: any) => {
      updateNodeStatus(update);
    }
  }));

  useEffect(() => {
    if (workflow?.nodes && workflow?.edges) {
      setNodes(workflow.nodes);
      setEdges(workflow.edges.map((edge: Edge) => ({
        ...edge,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      })));
    }
  }, [workflow, setNodes, setEdges]);

  useEffect(() => {
    if (workflowState) {
      updateNodeStatus(workflowState);
    }
  }, [workflowState]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setEditingNode(node);
    setTempParameters(node.data.parameters || {});
  }, []);

  const onAddNode = (type: string) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'configurable',
      position: { x: 250, y: 250 },
      data: {
        label: `NEW ${type.toUpperCase()} NODE`,
        description: `Configure this ${type}`,
        type,
        status: 'pending',
        parameters: {},
        guardrails: {
          input: [],
          output: []
        }
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const updateNodeParameters = (nodeId: string, parameters: Record<string, string>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              parameters: parameters,
            },
          };
        }
        return node;
      })
    );
  };

  const getNodeStyle = (status: string) => {
    switch (status) {
      case 'executing':
        return { background: '#3B82F6', color: 'white', border: '2px solid #1D4ED8' };
      case 'completed':
        return { background: '#10B981', color: 'white', border: '2px solid #059669' };
      case 'error':
        return { background: '#EF4444', color: 'white', border: '2px solid #DC2626' };
      default:
        return { background: '#E5E7EB', color: '#374151', border: '2px solid #9CA3AF' };
    }
  };

  // Show placeholder when no workflow is active
  if (!workflowStarted && nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">
            Enter Research Question
          </h2>
          <p className="text-gray-500">
            Type your research question in the chat to start building the workflow
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md p-2">
        <div className="space-y-2">
          <button
            onClick={() => onAddNode('agent')}
            className="block w-full px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Agent
          </button>
          <button
            onClick={() => onAddNode('tool')}
            className="block w-full px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add Tool
          </button>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
      >
        <Controls />
        <MiniMap 
          nodeStrokeColor={(n) => {
            if (n.data?.status === 'executing') return '#3b82f6';
            if (n.data?.status === 'completed') return '#10b981';
            return '#6b7280';
          }}
          nodeColor={(n) => {
            if (n.data?.status === 'executing') return '#3b82f6';
            if (n.data?.status === 'completed') return '#10b981';
            return '#e5e7eb';
          }}
          maskColor="rgb(50, 50, 50, 0.8)"
        />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>


      {/* Parameter Edit Modal */}
      {editingNode && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingNode(null);
              setTempParameters({});
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{editingNode.data.label}</h3>
                {editingNode.data.description && (
                  <p className="text-sm text-gray-600 mt-1">{editingNode.data.description}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setEditingNode(null);
                  setTempParameters({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Parameters Section */}
              {Object.keys(tempParameters).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Parameters</h4>
                  <div className="space-y-3">
                    {Object.entries(tempParameters).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {key}
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setTempParameters({
                            ...tempParameters,
                            [key]: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Output Section */}
              {editingNode.data.output && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Output</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {typeof editingNode.data.output === 'string' 
                        ? editingNode.data.output 
                        : JSON.stringify(editingNode.data.output, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Guardrails Section */}
              {editingNode.data.guardrails && (editingNode.data.guardrails.input?.length > 0 || editingNode.data.guardrails.output?.length > 0) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Guardrails</h4>
                  <div className="space-y-2">
                    {editingNode.data.guardrails.input?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Input:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                          {editingNode.data.guardrails.input.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {editingNode.data.guardrails.output?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Output:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                          {editingNode.data.guardrails.output.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  onClick={() => {
                    // TODO: Implement rerun functionality
                    console.log('Rerun node:', editingNode.id);
                  }}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Rerun
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingNode(null);
                      setTempParameters({});
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      updateNodeParameters(editingNode.id, tempParameters);
                      setEditingNode(null);
                      setTempParameters({});
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

WorkflowCanvas.displayName = 'WorkflowCanvas';

export default WorkflowCanvas;