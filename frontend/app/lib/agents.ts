// Agent implementations that call OpenAI
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // Only for development
});

export interface AgentMessage {
  type: 'status' | 'result' | 'error' | 'node_update';
  agentId?: string;
  message?: string;
  data?: any;
}

export class PlannerAgent {
  async *execute(question: string): AsyncGenerator<AgentMessage> {
    yield { type: 'status', agentId: 'planner', message: 'Analyzing research question...' };

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a research planning assistant. Given a research question, 
            create a workflow plan. Output a JSON object with this structure:
            {
              "steps": [
                {
                  "id": "step1",
                  "agent": "literature_search" | "code_search" | "summarizer",
                  "description": "what this step does",
                  "query": "specific query for this agent"
                }
              ]
            }`
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.7,
      });

      const planText = response.choices[0].message.content || '{}';
      const plan = JSON.parse(planText);

      yield { type: 'status', agentId: 'planner', message: 'Workflow plan created!' };
      yield { type: 'result', agentId: 'planner', data: plan };

      // Create visual nodes for the plan
      const nodes = [
        { id: 'start', type: 'start', position: { x: 100, y: 50 }, data: { label: 'Start' } }
      ];
      const edges = [];
      
      let prevId = 'start';
      let yPos = 150;

      for (const step of plan.steps) {
        const nodeId = step.id;
        nodes.push({
          id: nodeId,
          type: 'agent',
          position: { x: 100, y: yPos },
          data: {
            label: step.description,
            agent: step.agent,
            query: step.query,
            status: 'pending'
          }
        });

        edges.push({
          id: `edge-${prevId}-${nodeId}`,
          source: prevId,
          target: nodeId
        });

        prevId = nodeId;
        yPos += 100;
      }

      nodes.push({ 
        id: 'end', 
        type: 'end', 
        position: { x: 100, y: yPos }, 
        data: { label: 'End' } 
      });
      
      edges.push({
        id: `edge-${prevId}-end`,
        source: prevId,
        target: 'end'
      });

      yield { 
        type: 'node_update', 
        data: { nodes, edges, plan } 
      };

    } catch (error) {
      yield { type: 'error', agentId: 'planner', message: `Error: ${error}` };
    }
  }
}

export class LiteratureSearchAgent {
  async *execute(query: string): AsyncGenerator<AgentMessage> {
    yield { type: 'status', agentId: 'literature_search', message: `Searching for papers on: ${query}` };

    try {
      // Simulate API call with OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a literature search agent. Generate 3-5 relevant academic paper titles and summaries for the given query. Format as JSON array.'
          },
          {
            role: 'user',
            content: `Find papers about: ${query}`
          }
        ],
      });

      const papers = JSON.parse(response.choices[0].message.content || '[]');
      
      for (const paper of papers) {
        yield { type: 'status', agentId: 'literature_search', message: `Found: ${paper.title}` };
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
      }

      yield { type: 'result', agentId: 'literature_search', data: papers };
    } catch (error) {
      yield { type: 'error', agentId: 'literature_search', message: `Error: ${error}` };
    }
  }
}

export class CodeSearchAgent {
  async *execute(query: string): AsyncGenerator<AgentMessage> {
    yield { type: 'status', agentId: 'code_search', message: `Searching code for: ${query}` };

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a code search agent. Generate 3-5 relevant code repositories or examples. Format as JSON array with repository name and description.'
          },
          {
            role: 'user',
            content: `Find code examples for: ${query}`
          }
        ],
      });

      const repos = JSON.parse(response.choices[0].message.content || '[]');
      
      for (const repo of repos) {
        yield { type: 'status', agentId: 'code_search', message: `Found: ${repo.name}` };
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      yield { type: 'result', agentId: 'code_search', data: repos };
    } catch (error) {
      yield { type: 'error', agentId: 'code_search', message: `Error: ${error}` };
    }
  }
}

export class SummarizerAgent {
  async *execute(data: any): AsyncGenerator<AgentMessage> {
    yield { type: 'status', agentId: 'summarizer', message: 'Summarizing findings...' };

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a research summarizer. Create a concise summary of the provided research findings.'
          },
          {
            role: 'user',
            content: `Summarize these findings: ${JSON.stringify(data)}`
          }
        ],
      });

      const summary = response.choices[0].message.content;
      yield { type: 'result', agentId: 'summarizer', data: { summary } };
    } catch (error) {
      yield { type: 'error', agentId: 'summarizer', message: `Error: ${error}` };
    }
  }
}

// Agent factory
export function createAgent(type: string) {
  switch (type) {
    case 'planner':
      return new PlannerAgent();
    case 'literature_search':
      return new LiteratureSearchAgent();
    case 'code_search':
      return new CodeSearchAgent();
    case 'summarizer':
      return new SummarizerAgent();
    default:
      throw new Error(`Unknown agent type: ${type}`);
  }
}