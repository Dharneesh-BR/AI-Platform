import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { RequestWithAuth } from './request-with-auth.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    return request.user;
  },
);

