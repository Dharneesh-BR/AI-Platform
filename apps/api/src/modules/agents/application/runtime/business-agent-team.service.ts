import { Injectable } from '@nestjs/common';
import type { AgentCapability, AgentTeamRoleView, AgentTeamView } from './agent-runtime.types';
import { SanityAgentProfileClient } from './sanity-agent-profile.client';

@Injectable()
export class BusinessAgentTeamService {
  constructor(private readonly sanityClient: SanityAgentProfileClient) {}

  async list(): Promise<AgentTeamView[]> {
    const sanityTeams = await this.sanityClient.listTeams();
    return (sanityTeams.length ? sanityTeams : DEFAULT_AGENT_TEAMS).sort((first, second) => {
      const firstOrder = typeof first.displayOrder === 'number' ? first.displayOrder : 100;
      const secondOrder = typeof second.displayOrder === 'number' ? second.displayOrder : 100;
      return firstOrder - secondOrder || first.teamName.localeCompare(second.teamName);
    });
  }

  async getByAgentSlug(agentSlug?: string): Promise<AgentTeamView | null> {
    const slug = agentSlug ?? 'magnafic-ai';
    const teams = await this.list();
    return teams.find((team) => team.enabled && team.primaryAgentSlug === slug) ?? null;
  }

  async findByIntent(intent: string): Promise<AgentTeamView | null> {
    const normalizedIntent = intent.toLowerCase();
    const teams = await this.list();
    return teams.find((team) => team.enabled && team.supportedIntents.some((supportedIntent) => normalizedIntent.includes(supportedIntent))) ?? null;
  }
}

export function capabilityForRole(role: Pick<AgentTeamRoleView, 'roleType'>): AgentCapability {
  const roleType = role.roleType.toLowerCase();
  if (roleType === 'context') {
    return 'rag';
  }
  if (roleType === 'research') {
    return 'research';
  }
  if (roleType === 'calculation') {
    return 'calculation';
  }
  if (roleType === 'content' || roleType === 'design' || roleType === 'planning' || roleType === 'final_output') {
    return 'writing';
  }
  return 'analysis';
}

const DEFAULT_AGENT_TEAMS: AgentTeamView[] = [
  team('Magnafic AI Team', 'magnafic-ai', 'magnafic-ai', 'General Consulting', 'General consulting workflow for strategy, readiness, knowledge, and executive recommendations.', ['strategy', 'ai_readiness', 'business_plan', 'executive_brief', 'general_consulting'], [
    role(1, 'Request Understanding', 'analysis', 'Clarify the business objective, constraints, and expected decision.'),
    role(2, 'Knowledge Review', 'context', 'Review approved project profile, company profile, documents, and prior reports.'),
    role(3, 'Opportunity Analysis', 'analysis', 'Identify the highest-value business opportunities and tradeoffs.'),
    role(4, 'Action Planning', 'planning', 'Convert findings into a practical staged plan with owners and timing.'),
    role(5, 'Executive Writing', 'content', 'Write a clear executive-ready answer with recommendations and assumptions.'),
    role(6, 'Verification', 'verification', 'Check completeness, grounding, contradictions, and risk caveats.'),
    role(7, 'Final Output', 'final_output', 'Prepare the final response for the user.'),
  ]),
  team('Sales Team', 'sales', 'sales', 'Sales', 'Sales workflow for distributor growth, pipeline improvement, conversion, and account action plans.', ['sales_plan', 'distributor_growth', 'pipeline', 'revenue_growth', 'customer_conversion'], [
    role(1, 'Sales Context Review', 'context', 'Review project, company, customer, distributor, and revenue context.'),
    role(2, 'Opportunity Finder', 'analysis', 'Identify sales opportunities, blockers, target segments, and priority accounts.'),
    role(3, 'Distributor Segmentation', 'analysis', 'Group distributor/customer opportunities by potential, readiness, and actionability.'),
    role(4, 'Sales Action Planner', 'planning', 'Create the sales action sequence, follow-ups, and ownership plan.'),
    role(5, 'Objection And Risk Review', 'analysis', 'Anticipate objections, execution risks, and missing data.'),
    role(6, 'Sales Output Writer', 'content', 'Write the final sales plan with concrete next actions.'),
    role(7, 'Verification', 'verification', 'Check whether the plan is specific, realistic, and grounded.'),
    role(8, 'Final Output', 'final_output', 'Prepare the final sales recommendation.'),
  ]),
  team('Marketing Team', 'marketing', 'marketing', 'Marketing', 'Marketing workflow for product campaigns, positioning, content, creative direction, and channel planning.', ['marketing_campaign', 'product_launch', 'customer_engagement', 'distributor_promotion', 'content_plan'], [
    role(1, 'Product Understanding', 'context', 'Understand the product, company context, customer need, and campaign objective.'),
    role(2, 'Audience Researcher', 'analysis', 'Define target audience, buyer motivations, objections, and segmentation.'),
    role(3, 'Campaign Ideation', 'ideation', 'Generate campaign angles, hooks, themes, and offers.'),
    role(4, 'Content Creator', 'content', 'Draft campaign copy, captions, email/WhatsApp copy, and CTA ideas.'),
    role(5, 'Designer Direction', 'design', 'Define visual direction, creative formats, layouts, and asset ideas.'),
    role(6, 'Channel Planner', 'planning', 'Choose channels, posting rhythm, distributor touchpoints, and activation sequence.'),
    role(7, 'Campaign Calendar', 'planning', 'Organize the next-month campaign into weekly execution milestones.'),
    role(8, 'Verification', 'verification', 'Check campaign fit, completeness, measurement, and assumptions.'),
    role(9, 'Final Output', 'final_output', 'Prepare the final marketing campaign plan.'),
  ]),
  team('Finance Team', 'finance', 'finance', 'Finance', 'Finance workflow for ROI, budget, cost, margin, and decision-risk analysis.', ['roi', 'budget', 'cost_review', 'financial_analysis', 'margin_review'], [
    role(1, 'Financial Context Review', 'context', 'Review available project, company, and financial assumptions.'),
    role(2, 'Assumption Builder', 'analysis', 'Separate known numbers from assumptions and missing financial inputs.'),
    role(3, 'Calculation Reviewer', 'calculation', 'Run or frame calculations, ROI logic, and sensitivity ranges.'),
    role(4, 'Budget Impact Reviewer', 'analysis', 'Explain budget, margin, cost, or revenue impact.'),
    role(5, 'Decision Risk Reviewer', 'verification', 'Check financial caveats, confidence, and data gaps.'),
    role(6, 'Final Output', 'final_output', 'Prepare the final finance view with assumptions and risks.'),
  ]),
  team('Legal Team', 'legal', 'legal', 'Legal', 'Legal support workflow for issue spotting, policy risk, counsel-review questions, and caveats.', ['legal_review', 'compliance', 'policy_risk', 'contract_review', 'governance'], [
    role(1, 'Context And Document Review', 'context', 'Review project context and relevant uploaded legal or policy material.'),
    role(2, 'Issue Spotting', 'analysis', 'Identify likely legal, compliance, or policy issues.'),
    role(3, 'Risk Framing', 'analysis', 'Frame business risks without giving definitive legal advice.'),
    role(4, 'Counsel Questions', 'content', 'Prepare questions and documents for qualified counsel review.'),
    role(5, 'Verification', 'verification', 'Ensure caveats are clear and no legal certainty is overstated.'),
    role(6, 'Final Output', 'final_output', 'Prepare the final legal-support response.'),
  ]),
  team('Production Team', 'production', 'production', 'Production', 'Operations workflow for bottlenecks, automation, throughput, quality, and implementation planning.', ['operations', 'production', 'process_improvement', 'automation', 'quality_improvement'], [
    role(1, 'Operations Context Review', 'context', 'Review production, process, quality, and operational context.'),
    role(2, 'Bottleneck Analysis', 'analysis', 'Identify process bottlenecks, quality risks, and automation opportunities.'),
    role(3, 'Improvement Ideation', 'ideation', 'Generate workflow, quality, or automation improvement options.'),
    role(4, 'Implementation Planner', 'planning', 'Turn options into a practical rollout plan with dependencies.'),
    role(5, 'Measurement Reviewer', 'analysis', 'Define operational metrics and checks for success.'),
    role(6, 'Verification', 'verification', 'Check feasibility, assumptions, and rollout risks.'),
    role(7, 'Final Output', 'final_output', 'Prepare the final operations recommendation.'),
  ]),
];

function team(
  teamName: string,
  teamSlug: string,
  primaryAgentSlug: string,
  department: string,
  description: string,
  supportedIntents: string[],
  internalRoles: AgentTeamRoleView[],
): AgentTeamView {
  return {
    source: 'default',
    teamName,
    teamSlug,
    primaryAgentSlug,
    department,
    description,
    supportedIntents,
    internalRoles,
    enabled: true,
  };
}

function role(order: number, roleName: string, roleType: string, instructions: string, required = true): AgentTeamRoleView {
  return {
    roleName,
    roleSlug: slugify(roleName),
    roleType,
    description: instructions,
    instructions,
    expectedOutput: expectedOutputFor(roleType, roleName),
    required,
    runCondition: required ? '' : 'Run only when the user request needs this role.',
    order,
  };
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function expectedOutputFor(roleType: string, roleName: string): string {
  const outputs: Record<string, string> = {
    context: 'A concise summary of relevant project and company context.',
    research: 'Research notes with useful findings, sources, and caveats.',
    analysis: 'Specific findings, implications, and decision points.',
    ideation: 'A prioritized set of ideas with rationale.',
    content: 'Drafted content or narrative ready for final synthesis.',
    design: 'Creative direction, visual ideas, formats, and asset guidance.',
    planning: 'A sequenced action plan with timing, owners, and dependencies.',
    calculation: 'Assumptions, calculation logic, and decision implications.',
    verification: 'Completeness checks, risks, assumptions, and confidence notes.',
    final_output: 'A user-facing final answer assembled from completed workflow roles.',
  };

  return outputs[roleType] ?? `Output from ${roleName}.`;
}
