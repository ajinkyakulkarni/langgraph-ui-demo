'use client';

import { useState, useEffect, useRef } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  workflow: any;
  onWorkflowUpdate?: (update: any) => void;
}

export default function ChatInterface({ workflow, onWorkflowUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('What are the latest transformer-based architectures for multimodal learning that combine vision and language, and how do they compare to traditional approaches in terms of performance and computational efficiency?');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    
    const connect = () => {
      if (ws?.readyState === WebSocket.OPEN) return;
      
      ws = new WebSocket('ws://localhost:8000/ws/workflow');
      
      ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
        ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        
        if (data.type === 'node_update') {
          // Handle node updates
          const state = data.state;
          
          // Emit workflow update for visualization
          if (onWorkflowUpdate) {
            onWorkflowUpdate({
              type: 'node_update',
              node: data.node,
              state: state,
              timestamp: data.timestamp
            });
          }
          
          if (state.messages && state.messages.length > 0) {
            state.messages.forEach((msg: string) => {
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString() + Math.random(),
                  type: 'system',
                  content: `${data.node}: ${msg}`,
                  timestamp: new Date(),
                },
              ]);
            });
          }
          
          // Update workflow visualization if we have nodes
          if (data.node === 'planner' && state.plan) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString() + Math.random(),
                type: 'assistant',
                content: `Research plan created:\n${JSON.stringify(state.plan, null, 2)}`,
                timestamp: new Date(),
              },
            ]);
          }
          
          if (data.node === 'summarizer' && state.summary) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString() + Math.random(),
                type: 'assistant',
                content: state.summary,
                timestamp: new Date(),
              },
            ]);
          }
        } else if (data.type === 'execution_started') {
          // Emit workflow start for visualization
          if (onWorkflowUpdate) {
            onWorkflowUpdate({
              type: 'execution_started',
              timestamp: data.timestamp
            });
          }
          
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: 'system',
              content: 'Workflow execution started...',
              timestamp: new Date(),
            },
          ]);
        } else if (data.type === 'execution_completed') {
          // Emit workflow completion for visualization
          if (onWorkflowUpdate) {
            onWorkflowUpdate({
              type: 'execution_completed',
              timestamp: data.timestamp
            });
          }
          
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: 'system',
              content: 'Workflow execution completed!',
              timestamp: new Date(),
            },
          ]);
          setIsLoading(false);
        } else if (data.type === 'error') {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: 'system',
              content: `Error: ${data.message}`,
              timestamp: new Date(),
            },
          ]);
          setIsLoading(false);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Reconnect after 3 seconds
        reconnectTimeout = setTimeout(connect, 3000);
      };
      
      wsRef.current = ws;
    };
    
    connect();
    
    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send to WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('Sending message to WebSocket:', { type: 'execute', question: input });
        wsRef.current.send(
          JSON.stringify({
            type: 'execute',
            question: input,
          })
        );
      } else {
        console.error('WebSocket not connected. State:', wsRef.current?.readyState);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'system',
            content: 'WebSocket not connected. Please refresh the page.',
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          type: 'system',
          content: 'Error processing request',
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold">Research Assistant</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'assistant'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-yellow-50 text-yellow-800 text-sm'
              }`}
            >
              {message.type === 'system' ? (
                <div className="font-mono">{message.content}</div>
              ) : (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              )}
              <div
                className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex flex-col space-y-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your research question..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white resize-none"
            disabled={isLoading}
            rows={4}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>Submit</span>
              <FaPaperPlane className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}