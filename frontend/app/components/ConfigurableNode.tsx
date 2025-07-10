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
    color?: string;
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
    // Use custom color if provided
    const baseColor = data.color || 'gray';
    
    if (data.status === 'executing') {
      return {
        bg: `bg-${baseColor}-500`,
        text: 'text-white',
        border: `border-${baseColor}-600`,
        iconBg: `bg-${baseColor}-600`,
        animate: 'animate-pulse',
        style: {
          backgroundColor: getColorHex(baseColor, 500),
          borderColor: getColorHex(baseColor, 600),
        }
      };
    }
    if (data.status === 'completed') {
      return {
        bg: `bg-${baseColor}-500`,
        text: 'text-white',
        border: `border-${baseColor}-600`,
        iconBg: `bg-${baseColor}-600`,
        animate: '',
        style: {
          backgroundColor: getColorHex(baseColor, 500),
          borderColor: getColorHex(baseColor, 600),
          opacity: 0.9
        }
      };
    }
    if (data.status === 'error') {
      return {
        bg: 'bg-red-500',
        text: 'text-white',
        border: 'border-red-600',
        iconBg: 'bg-red-600',
        animate: '',
        style: {
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
        }
      };
    }
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-300',
      iconBg: 'bg-gray-200',
      animate: '',
      style: {
        backgroundColor: '#f3f4f6',
        borderColor: '#d1d5db',
      }
    };
  };

  const getColorHex = (color: string, intensity: number) => {
    const colorMap: Record<string, Record<number, string>> = {
      blue: { 500: '#3b82f6', 600: '#2563eb' },
      green: { 500: '#10b981', 600: '#059669' },
      orange: { 500: '#f97316', 600: '#ea580c' },
      purple: { 500: '#8b5cf6', 600: '#7c3aed' },
      gray: { 500: '#6b7280', 600: '#4b5563' },
    };
    return colorMap[color]?.[intensity] || colorMap.gray[intensity];
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
    <div 
      className={`min-w-[350px] rounded-lg shadow-lg ${colors.animate} ${selected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
      style={{
        backgroundColor: colors.style.backgroundColor,
        border: `2px solid ${colors.style.borderColor}`,
        opacity: colors.style.opacity || 1,
      }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      {/* Header */}
      <div 
        className={`px-4 py-3 rounded-t-lg flex items-center justify-between`}
        style={{
          backgroundColor: colors.style.borderColor || getColorHex(data.color || 'gray', 600),
        }}
      >
        <div className="flex items-center space-x-2">
          <span className="font-bold text-sm text-white">{data.label}</span>
          {getStatusIcon()}
        </div>
        <BiDotsHorizontalRounded className="w-5 h-5 text-white cursor-pointer" />
      </div>

      {/* Description */}
      {data.description && (
        <div className="px-4 py-2 text-xs text-white opacity-90 italic border-b border-white border-opacity-20">
          {data.description}
        </div>
      )}

      {/* Parameters Section */}
      {data.parameters && Object.keys(data.parameters).length > 0 && (
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">Parameters</span>
            <span className="text-white opacity-70">▲</span>
          </div>
          <div className="space-y-1">
            {Object.entries(data.parameters).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-white opacity-80">{key}:</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Output Section */}
      <div className="px-4 py-3 space-y-2 border-t border-opacity-20 border-white">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white">Output</span>
          <span className="text-white opacity-70">▲</span>
        </div>
        {data.output ? (
          <div className="text-xs text-white bg-black bg-opacity-10 p-2 rounded">
            {typeof data.output === 'string' 
              ? data.output 
              : JSON.stringify(data.output, null, 2).substring(0, 100) + '...'}
          </div>
        ) : (
          <div className="text-xs text-white opacity-60 italic">
            {data.status === 'executing' ? 'Processing...' : 'No output yet'}
          </div>
        )}
      </div>

      {/* Guardrails Section */}
      {data.guardrails && (data.guardrails.input?.length > 0 || data.guardrails.output?.length > 0) && (
        <div className="px-4 py-3 space-y-2 border-t border-opacity-20 border-white">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">Guardrails</span>
            <span className="text-white opacity-70">▼</span>
          </div>
          <div className="space-y-2">
            {data.guardrails.input?.length > 0 && (
              <div>
                <p className="text-xs text-white opacity-70 mb-1">✓ Data validation complete</p>
                <p className="text-xs text-white opacity-70">✓ Processing integrity verified</p>
              </div>
            )}
          </div>
        </div>
      )}


      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}