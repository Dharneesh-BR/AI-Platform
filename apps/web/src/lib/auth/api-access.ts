export function getLocalAuthToken(): string | undefined {
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true'
  ) {
    return process.env.NEXT_PUBLIC_AUTH_BYPASS_TOKEN || undefined;
  }

  return undefined;
}

export function hasApiAuth(context?: { accessToken?: string }): boolean {
  return Boolean(context?.accessToken || getLocalAuthToken());
}
