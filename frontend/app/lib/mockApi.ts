// Mock API for development
// Replace with real API calls in production

interface Workflow {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  is_public: boolean;
  nodes: any[];
  edges: any[];
}

class MockAPI {
  private workflows: Map<number, Workflow> = new Map();
  private nextId = 1;

  constructor() {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mockWorkflows');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.workflows = new Map(parsed);
        this.nextId = Math.max(...Array.from(this.workflows.keys())) + 1;
      }
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mockWorkflows', JSON.stringify(Array.from(this.workflows.entries())));
    }
  }

  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  async createWorkflow(data: {
    name: string;
    description?: string;
    is_public: boolean;
    nodes: any[];
    edges: any[];
  }): Promise<Workflow> {
    const workflow: Workflow = {
      id: this.nextId++,
      ...data,
      created_at: new Date().toISOString(),
    };

    this.workflows.set(workflow.id, workflow);
    this.save();
    return workflow;
  }

  async getWorkflow(id: number): Promise<Workflow | null> {
    return this.workflows.get(id) || null;
  }

  async updateWorkflow(id: number, data: Partial<Workflow>): Promise<Workflow | null> {
    const workflow = this.workflows.get(id);
    if (!workflow) return null;

    const updated = {
      ...workflow,
      ...data,
      updated_at: new Date().toISOString(),
    };

    this.workflows.set(id, updated);
    this.save();
    return updated;
  }

  async deleteWorkflow(id: number): Promise<boolean> {
    const result = this.workflows.delete(id);
    this.save();
    return result;
  }

  async getAgentTypes() {
    return [
      {
        id: "planner",
        name: "Planner Agent",
        description: "Analyzes research questions and creates workflow plans",
        category: "core"
      },
      {
        id: "literature_search",
        name: "Literature Search Agent",
        description: "Searches academic papers and literature",
        category: "research"
      },
      {
        id: "code_search",
        name: "Code Search Agent",
        description: "Searches code repositories and documentation",
        category: "research"
      },
      {
        id: "summarizer",
        name: "Summarizer Agent",
        description: "Summarizes and synthesizes information",
        category: "processing"
      },
      {
        id: "pdf_generator",
        name: "PDF Generator",
        description: "Generates PDF reports from collected data",
        category: "output"
      }
    ];
  }

  async getGuardrailTypes() {
    return [
      {
        id: "content_filter",
        name: "Content Filter",
        description: "Filters inappropriate or irrelevant content"
      },
      {
        id: "quality_check",
        name: "Quality Check",
        description: "Ensures output meets quality standards"
      },
      {
        id: "format_validator",
        name: "Format Validator",
        description: "Validates data format and structure"
      }
    ];
  }
}

export const mockAPI = new MockAPI();