import { getLocalAuthToken } from '../auth/api-access';

interface ApiClientOptions {
  accessToken?: string;
  organizationId?: string;
}

function getLocalBypassHeader() {
  const token = getLocalAuthToken();

  return token ? { 'X-Magnafic-Auth-Bypass': token } : {};
}

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly options: ApiClientOptions = {},
  ) {}

  get<TResponse>(path: string): Promise<TResponse> {
    return this.request<TResponse>(path, { method: 'GET' });
  }

  post<TResponse, TBody = unknown>(path: string, body?: TBody): Promise<TResponse> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<TResponse>(path, {
      method: 'POST',
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  }

  put<TResponse, TBody = unknown>(path: string, body: TBody): Promise<TResponse> {
    return this.request<TResponse>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  patch<TResponse, TBody = unknown>(path: string, body: TBody): Promise<TResponse> {
    return this.request<TResponse>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete<TResponse>(path: string): Promise<TResponse> {
    return this.request<TResponse>(path, { method: 'DELETE' });
  }

  private async request<TResponse>(path: string, init: RequestInit): Promise<TResponse> {
    const headers = new Headers(init.headers);
    if (!(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (this.options.accessToken) {
      headers.set('Authorization', `Bearer ${this.options.accessToken}`);
    } else {
      for (const [key, value] of Object.entries(getLocalBypassHeader())) {
        headers.set(key, value);
      }
    }
    if (this.options.organizationId) {
      headers.set('X-Organization-Id', this.options.organizationId);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      let message = `API request failed: ${response.status} ${response.statusText}`;

      try {
        const errorBody = (await response.json()) as { message?: string | string[] };
        if (Array.isArray(errorBody.message)) {
          message = errorBody.message.join(' ');
        } else if (errorBody.message) {
          message = errorBody.message;
        }
      } catch {
      }

      throw new Error(message);
    }

    return response.json() as Promise<TResponse>;
  }
}

export function createApiClient(options?: ApiClientOptions): ApiClient {
  return new ApiClient(process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001/v1', options);
}
