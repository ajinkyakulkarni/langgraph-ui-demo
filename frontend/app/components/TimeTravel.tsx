'use client';

import { useState, useEffect } from 'react';
import { FaHistory, FaRedo, FaStepBackward } from 'react-icons/fa';

interface TimeTravelProps {
  wsRef: React.MutableRefObject<WebSocket | null>;
  onStateUpdate: (state: any) => void;
}

export default function TimeTravel({ wsRef, onStateUpdate }: TimeTravelProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchHistory = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'get_history' }));
    }
  };

  const rewindToStep = (step: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'rewind',
        step 
      }));
      setCurrentStep(step);
    }
  };

  const updateAndContinue = (updates: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'update_and_continue',
        updates 
      }));
    }
  };

  useEffect(() => {
    // Listen for history updates
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'history') {
        setHistory(data.states);
      } else if (data.type === 'rewound') {
        onStateUpdate(data.state);
      }
    };

    if (wsRef.current) {
      wsRef.current.addEventListener('message', handleMessage);
      return () => {
        wsRef.current?.removeEventListener('message', handleMessage);
      };
    }
  }, [wsRef, onStateUpdate]);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchHistory();
        }}
        className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600"
      >
        <FaHistory className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute bottom-16 left-0 w-96 bg-white rounded-lg shadow-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold flex items-center gap-2">
              <FaHistory /> Workflow History
            </h3>
          </div>

          <div className="max-h-96 overflow-y-auto p-4">
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm">No history available</p>
            ) : (
              <div className="space-y-2">
                {history.map((state, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border cursor-pointer hover:bg-gray-50 ${
                      index === currentStep ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => rewindToStep(index)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">
                          Step {index}: {state.state?.current_step || 'Unknown'}
                        </p>
                        {state.state?.messages?.length > 0 && (
                          <p className="text-xs text-gray-600 mt-1">
                            {state.state.messages[state.state.messages.length - 1]}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          rewindToStep(index);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FaStepBackward className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  const currentState = history[currentStep];
                  // Example: modify the question and continue
                  updateAndContinue({
                    question: currentState.state.question + " (modified)"
                  });
                }}
                className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <FaRedo /> Update & Continue
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}