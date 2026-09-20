import { z } from 'zod';
import type { AgentToolDefinition } from './agent-tool.types';

const EmptyInputSchema = z.object({}).strict();
const KnowledgeSearchInputSchema = z.object({
  query: z.string().trim().min(1).max(2000),
  limit: z.number().int().min(1).max(20).optional(),
}).strict();
const CalculatorInputSchema = z.object({
  expression: z.string().trim().min(1).max(500).optional(),
}).strict();

export const INTERNAL_TOOL_DEFINITIONS: AgentToolDefinition[] = [
  {
    name: 'vector_search',
    description: 'Search approved project knowledge chunks.',
    category: 'knowledge',
    inputSchema: KnowledgeSearchInputSchema,
    requiredPermissions: ['knowledge:read'],
    allowedAgentCapabilities: ['rag'],
    riskLevel: 'LOW',
    mutating: false,
    enabled: true,
  },
  {
    name: 'document_lookup',
    description: 'List safe metadata for approved project documents.',
    category: 'knowledge',
    inputSchema: EmptyInputSchema,
    requiredPermissions: ['knowledge:read'],
    allowedAgentCapabilities: ['document', 'rag'],
    riskLevel: 'LOW',
    mutating: false,
    enabled: true,
  },
  {
    name: 'company_profile',
    description: 'Read approved company profile context.',
    category: 'company',
    inputSchema: EmptyInputSchema,
    requiredPermissions: ['company:read'],
    allowedAgentCapabilities: ['analysis', 'writing'],
    riskLevel: 'LOW',
    mutating: false,
    enabled: true,
  },
  {
    name: 'readiness_report',
    description: 'Read AI readiness report summaries.',
    category: 'reports',
    inputSchema: EmptyInputSchema,
    requiredPermissions: ['report:read'],
    allowedAgentCapabilities: ['analysis', 'writing'],
    riskLevel: 'LOW',
    mutating: false,
    enabled: true,
  },
  {
    name: 'calculator',
    description: 'Run deterministic arithmetic support.',
    category: 'calculation',
    inputSchema: CalculatorInputSchema,
    requiredPermissions: ['calculator:execute'],
    allowedAgentCapabilities: ['calculation'],
    riskLevel: 'LOW',
    mutating: false,
    enabled: true,
  },
  {
    name: 'web_search',
    description: 'External research placeholder; disabled until integrations are configured.',
    category: 'research',
    inputSchema: z.object({ query: z.string().trim().min(1).max(500) }).strict(),
    requiredPermissions: ['research:read'],
    allowedAgentCapabilities: ['research'],
    riskLevel: 'MEDIUM',
    mutating: false,
    enabled: false,
  },
];
