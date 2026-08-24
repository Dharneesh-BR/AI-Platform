interface ApiClientOptions {
  accessToken?: string;
  organizationId?: string;
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
    return this.request<TResponse>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
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
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(this.options.accessToken ? { Authorization: `Bearer ${this.options.accessToken}` } : {}),
        ...(this.options.organizationId ? { 'X-Organization-Id': this.options.organizationId } : {}),
        ...init.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<TResponse>;
  }
}

export function createApiClient(options?: ApiClientOptions): ApiClient {
  return new ApiClient(process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001/api/v1', options);
}

