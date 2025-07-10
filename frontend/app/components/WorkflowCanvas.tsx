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

    const newNodes: Node[] = [
      {
        id: 'start',
        type: 'start',
        position: { x: 400, y: 50 },
        data: { 
          label: 'Start',
          type: 'start',
          status: 'completed'
        },
      },
    ];

    const newEdges: Edge[] = [];
    let prevNodeId = 'start';
    let yPos = 200;

    // Add planner node
    newNodes.push({
      id: 'planner',
      type: 'configurable',
      position: { x: 400, y: yPos },
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
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    });

    prevNodeId = 'planner';
    yPos += 200;

    // Add nodes for each step in the plan
    plan.steps.forEach((step: any, index: number) => {
      const nodeId = step.agent || step.id || `node_${index}`;
      
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
      
      // Position nodes in a grid
      const xPos = index % 2 === 0 ? 200 : 600;
      
      newNodes.push({
        id: nodeId,
        type: 'configurable',
        position: { x: xPos, y: yPos },
        data: nodeConfig,
      });

      newEdges.push({
        id: `edge_${prevNodeId}_${nodeId}`,
        source: prevNodeId,
        target: nodeId,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      });

      prevNodeId = nodeId;
      if (index % 2 === 1) {
        yPos += 200;
      }
    });

    // Add summarizer node
    yPos += 200; // Add extra space before summarizer
    newNodes.push({
      id: 'summarizer',
      type: 'configurable',
      position: { x: 400, y: yPos },
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

    newEdges.push({
      id: `edge_${prevNodeId}_summarizer`,
      source: prevNodeId,
      target: 'summarizer',
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    });

    prevNodeId = 'summarizer';
    yPos += 200;

    // Add end node
    newNodes.push({
      id: 'end',
      type: 'end',
      position: { x: 400, y: yPos },
      data: { 
        label: 'End',
        type: 'end',
        status: 'pending'
      },
    });

    newEdges.push({
      id: `edge_${prevNodeId}_end`,
      source: prevNodeId,
      target: 'end',
      markerEnd: {
        type: MarkerType.ArrowClosed,
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
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>

      {selectedNode && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-4 w-80">
          <h3 className="font-semibold mb-2">Node Configuration</h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600">ID: {selectedNode.id}</p>
              <p className="text-gray-600">Type: {selectedNode.data.type}</p>
              <p className="text-gray-600">Status: {selectedNode.data.status || 'pending'}</p>
            </div>
            
            {selectedNode.data.description && (
              <div className="border-t pt-2">
                <p className="font-medium">Description:</p>
                <p className="text-gray-600">{selectedNode.data.description}</p>
              </div>
            )}
            
            {selectedNode.data.parameters && Object.keys(selectedNode.data.parameters).length > 0 && (
              <div className="border-t pt-2">
                <p className="font-medium">Parameters:</p>
                {Object.entries(selectedNode.data.parameters).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-gray-600">
                    <span>{key}:</span>
                    <span>{value as string}</span>
                  </div>
                ))}
              </div>
            )}
            
            {selectedNode.data.guardrails && (
              <div className="border-t pt-2">
                <p className="font-medium">Guardrails:</p>
                {selectedNode.data.guardrails.input?.length > 0 && (
                  <div className="text-gray-600">
                    <p className="text-xs">Input:</p>
                    <ul className="list-disc list-inside text-xs">
                      {selectedNode.data.guardrails.input.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedNode.data.guardrails.output?.length > 0 && (
                  <div className="text-gray-600 mt-1">
                    <p className="text-xs">Output:</p>
                    <ul className="list-disc list-inside text-xs">
                      {selectedNode.data.guardrails.output.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="border-t pt-3 flex space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors">
                Execute Node
              </button>
              <button 
                onClick={() => {
                  setEditingNode(selectedNode);
                  setTempParameters(selectedNode.data.parameters || {});
                }}
                className="flex-1 px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
              >
                Configure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parameter Edit Modal */}
      {editingNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Configure {editingNode.data.label}</h3>
            
            <div className="space-y-4">
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
              
              <div className="flex justify-end space-x-2 pt-4">
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
      )}
    </div>
  );
});

WorkflowCanvas.displayName = 'WorkflowCanvas';

export default WorkflowCanvas;