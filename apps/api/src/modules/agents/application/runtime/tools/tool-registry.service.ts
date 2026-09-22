import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../common/prisma/prisma.service';
import type { AgentToolDefinition, ToolExecutionContext, ToolExecutionResult } from './agent-tool.types';
import { INTERNAL_TOOL_DEFINITIONS } from './tool-definitions';
import { ToolAuthorizationService } from './tool-authorization.service';

@Injectable()
export class ToolRegistryService {
  private readonly tools = new Map(INTERNAL_TOOL_DEFINITIONS.map((tool) => [tool.name, tool]));

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ToolAuthorizationService,
  ) {}

  list(): AgentToolDefinition[] {
    return [...this.tools.values()];
  }

  get(name: string): AgentToolDefinition {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new ForbiddenException(`Tool '${name}' is not registered.`);
    }

    return tool;
  }

  async execute<TInput, TData>(
    name: string,
    context: ToolExecutionContext,
    input: TInput,
    handler: (validatedInput: TInput) => Promise<ToolExecutionResult<TData>> | ToolExecutionResult<TData>,
  ): Promise<ToolExecutionResult<TData>> {
    const tool = this.get(name);
    const parsed = tool.inputSchema.safeParse(input);

    if (!parsed.success) {
      await this.audit(tool, context, 'DENIED', input, { errorCode: 'VALIDATION_ERROR' }, 'VALIDATION_ERROR');
      throw new BadRequestException(`Invalid input for tool '${tool.name}'.`);
    }

    try {
      this.authorization.authorize(tool, context);
    } catch (error) {
      await this.audit(tool, context, 'DENIED', parsed.data, { errorCode: 'FORBIDDEN' }, 'FORBIDDEN');
      throw error;
    }

    const execution = await this.audit(tool, context, 'RUNNING', parsed.data);
    const startedAt = Date.now();

    try {
      const result = await handler(parsed.data as TInput);
      await this.completeAudit(execution?.id, 'COMPLETED', startedAt, this.outputSummary(result));
      return {
        ok: result.ok,
        data: result.data,
        sources: result.sources,
        errorCode: result.errorCode,
      };
    } catch (error) {
      await this.completeAudit(execution?.id, 'FAILED', startedAt, { errorCode: 'EXECUTION_FAILED' }, 'EXECUTION_FAILED');
      throw error;
    }
  }

  private async audit(
    tool: AgentToolDefinition,
    context: ToolExecutionContext,
    status: string,
    input: unknown,
    output?: unknown,
    errorCode?: string,
  ) {
    if (!context.agentRunId || !context.projectId || !context.userId) {
      return null;
    }

    return this.prisma.toolExecution.create({
      data: {
        agentRunId: context.agentRunId,
        agentStepId: context.agentStepId,
        projectId: context.projectId,
        userId: context.userId,
        agentProfileId: context.agentProfileId,
        agentSlug: context.agentSlug,
        toolName: tool.name,
        category: tool.category,
        status,
        riskLevel: tool.riskLevel,
        mutating: tool.mutating,
        inputSummary: this.safeSummary(input) as Prisma.InputJsonValue,
        outputSummary: this.safeSummary(output ?? {}) as Prisma.InputJsonValue,
        errorCode,
        completedAt: status === 'RUNNING' ? undefined : new Date(),
        createdBy: context.userId,
        updatedBy: context.userId,
      },
    });
  }

  private async completeAudit(id: string | undefined, status: string, startedAt: number, output: unknown, errorCode?: string) {
    if (!id) {
      return;
    }

    await this.prisma.toolExecution.update({
      where: { id },
      data: {
        status,
        completedAt: new Date(),
        durationMs: Math.max(0, Date.now() - startedAt),
        outputSummary: this.safeSummary(output) as Prisma.InputJsonValue,
        errorCode,
      },
    });
  }

  private outputSummary(result: ToolExecutionResult) {
    return {
      ok: result.ok,
      errorCode: result.errorCode,
      sourceCount: Array.isArray(result.sources) ? result.sources.length : 0,
      dataKeys: result.data && typeof result.data === 'object' && !Array.isArray(result.data) ? Object.keys(result.data as Record<string, unknown>) : [],
    };
  }

  private safeSummary(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(record)
        .filter(([key]) => !/token|secret|password|credential|private/i.test(key))
        .slice(0, 20)
        .map(([key, item]) => [key, typeof item === 'string' && item.length > 300 ? `${item.slice(0, 300)}...` : item]),
    );
  }
}
