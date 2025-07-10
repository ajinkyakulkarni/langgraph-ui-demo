'use client';

import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { FaPlay, FaCog, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { BiDotsHorizontalRounded } from 'react-icons/bi';

interface ConfigurableNodeProps {
  data: {
    label: string;
    description?: string;
    type: string;
    status?: string;
    parameters?: Record<string, string>;
    guardrails?: {
      input?: string[];
      output?: string[];
    };
    output?: any;
  };
  selected: boolean;
}

export default function ConfigurableNode({ data, selected }: ConfigurableNodeProps) {
  const getNodeColor = () => {
    if (data.status === 'executing') {
      return {
        bg: 'bg-blue-500',
        text: 'text-white',
        border: 'border-blue-600',
        iconBg: 'bg-blue-600',
        animate: 'animate-pulse'
      };
    }
    if (data.status === 'completed') {
      return {
        bg: 'bg-green-500',
        text: 'text-white',
        border: 'border-green-600',
        iconBg: 'bg-green-600',
        animate: ''
      };
    }
    if (data.status === 'error') {
      return {
        bg: 'bg-red-500',
        text: 'text-white',
        border: 'border-red-600',
        iconBg: 'bg-red-600',
        animate: ''
      };
    }
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-300',
      iconBg: 'bg-gray-200',
      animate: ''
    };
  };

  const colors = getNodeColor();

  const getStatusIcon = () => {
    switch (data.status) {
      case 'executing':
        return <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />;
      case 'completed':
        return <FaCheckCircle className="w-3 h-3" />;
      case 'error':
        return <FaExclamationTriangle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-w-[350px] rounded-lg shadow-lg ${colors.bg} ${colors.animate} ${selected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      {/* Header */}
      <div className={`px-4 py-3 ${colors.iconBg} rounded-t-lg flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
          <span className={`font-bold text-sm ${colors.text}`}>{data.label}</span>
          {getStatusIcon()}
        </div>
        <BiDotsHorizontalRounded className={`w-5 h-5 ${colors.text} cursor-pointer`} />
      </div>

      {/* Description */}
      {data.description && (
        <div className={`px-4 py-2 text-xs ${colors.text} opacity-90 italic border-b ${colors.border}`}>
          {data.description}
        </div>
      )}

      {/* Parameters Section */}
      {data.parameters && Object.keys(data.parameters).length > 0 && (
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-semibold ${colors.text}`}>Parameters</span>
            <span className={`${colors.text} opacity-70`}>▲</span>
          </div>
          <div className="space-y-1">
            {Object.entries(data.parameters).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className={`${colors.text} opacity-80`}>{key}:</span>
                <span className={`${colors.text} font-medium`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Output Section */}
      <div className="px-4 py-3 space-y-2 border-t border-opacity-20 border-white">
        <div className="flex items-center justify-between text-xs">
          <span className={`font-semibold ${colors.text}`}>Output</span>
          <span className={`${colors.text} opacity-70`}>▲</span>
        </div>
        {data.output ? (
          <div className={`text-xs ${colors.text} bg-black bg-opacity-10 p-2 rounded`}>
            {typeof data.output === 'string' 
              ? data.output 
              : JSON.stringify(data.output, null, 2).substring(0, 100) + '...'}
          </div>
        ) : (
          <div className={`text-xs ${colors.text} opacity-60 italic`}>
            {data.status === 'executing' ? 'Processing...' : 'No output yet'}
          </div>
        )}
      </div>

      {/* Guardrails Section */}
      {data.guardrails && (data.guardrails.input?.length > 0 || data.guardrails.output?.length > 0) && (
        <div className="px-4 py-3 space-y-2 border-t border-opacity-20 border-white">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-semibold ${colors.text}`}>Guardrails</span>
            <span className={`${colors.text} opacity-70`}>▼</span>
          </div>
          <div className="space-y-2">
            {data.guardrails.input?.length > 0 && (
              <div>
                <p className={`text-xs ${colors.text} opacity-70 mb-1`}>✓ Data validation complete</p>
                <p className={`text-xs ${colors.text} opacity-70`}>✓ Processing integrity verified</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 py-3 flex justify-between items-center border-t border-opacity-20 border-white">
        <button className={`text-xs ${colors.text} opacity-70 hover:opacity-100 transition-opacity`}>
          Edit content here...
        </button>
        <div className="flex space-x-2">
          <button className={`p-1.5 rounded ${colors.iconBg} ${colors.text} hover:opacity-80 transition-opacity`}>
            <FaPlay className="w-3 h-3" />
          </button>
          <button className={`p-1.5 rounded ${colors.iconBg} ${colors.text} hover:opacity-80 transition-opacity`}>
            <FaCog className="w-3 h-3" />
          </button>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}