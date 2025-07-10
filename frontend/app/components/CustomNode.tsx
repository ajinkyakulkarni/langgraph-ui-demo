'use client';

import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { FaRobot, FaTools, FaPlay, FaStop } from 'react-icons/fa';

interface CustomNodeProps {
  data: {
    label: string;
    type: string;
    status?: string;
    output?: any;
  };
  selected: boolean;
}

export default function CustomNode({ data, selected }: CustomNodeProps) {
  const getIcon = () => {
    switch (data.type) {
      case 'agent':
        return <FaRobot className="w-4 h-4" />;
      case 'tool':
        return <FaTools className="w-4 h-4" />;
      case 'start':
        return <FaPlay className="w-4 h-4" />;
      case 'end':
        return <FaStop className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getNodeColor = () => {
    if (data.status === 'executing') return 'border-blue-500 bg-blue-50 animate-pulse';
    if (data.status === 'completed') return 'border-green-500 bg-green-50';
    if (data.status === 'error') return 'border-red-500 bg-red-50';
    if (data.status === 'pending') return 'border-gray-400 bg-gray-50';
    if (selected) return 'border-blue-500 bg-blue-50';
    return 'border-gray-300 bg-white';
  };

  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 ${getNodeColor()} min-w-[150px]`}
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center space-x-2">
        {getIcon()}
        <span className="text-sm font-medium">{data.label}</span>
      </div>

      {data.status && (
        <div className="mt-1 text-xs text-gray-600">
          Status: {data.status}
        </div>
      )}

      {data.output && (
        <div className="mt-2 text-xs bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
          {typeof data.output === 'string'
            ? data.output
            : JSON.stringify(data.output, null, 2)}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}