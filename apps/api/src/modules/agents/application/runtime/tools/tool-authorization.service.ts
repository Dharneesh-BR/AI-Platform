import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AgentToolDefinition, ToolExecutionContext } from './agent-tool.types';

@Injectable()
export class ToolAuthorizationService {
  authorize(tool: AgentToolDefinition, context: ToolExecutionContext): void {
    if (!tool.enabled) {
      throw new ForbiddenException(`Tool '${tool.name}' is disabled.`);
    }

    if (!context.userId || !context.organizationId || !context.projectId || !context.agentRunId) {
      throw new ForbiddenException('Tool execution requires trusted user, organization, project, and run context.');
    }

    if (!context.businessAgent.enabled) {
      throw new ForbiddenException('Business agent is disabled.');
    }

    if (!context.businessAgent.allowedTools.includes(tool.name)) {
      throw new ForbiddenException(`Business agent '${context.businessAgent.slug}' cannot use tool '${tool.name}'.`);
    }

    if (
      tool.allowedAgentCapabilities.length > 0 &&
      !tool.allowedAgentCapabilities.some((capability) => context.businessAgent.capabilities.includes(capability as never))
    ) {
      throw new ForbiddenException(`Business agent '${context.businessAgent.slug}' lacks capability for '${tool.name}'.`);
    }

    const missingPermission = tool.requiredPermissions.find((permission) => !context.permissions.includes(permission));
    if (missingPermission) {
      throw new ForbiddenException(`Missing permission '${missingPermission}' for tool '${tool.name}'.`);
    }

    if (tool.mutating && !tool.requiresApproval) {
      throw new ForbiddenException(`Mutating tool '${tool.name}' is not executable without an approval policy.`);
    }
  }
}
