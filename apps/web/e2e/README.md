# Magnafic AI browser E2E

These tests use Playwright against the existing Next.js app. They are designed for local/test infrastructure only.

Required services for the full authenticated suite:

- Web: started automatically by Playwright unless `E2E_SKIP_WEB_SERVER=true`.
- API: `E2E_API_URL` or `NEXT_PUBLIC_API_BASE_URL`, default `http://127.0.0.1:4000`.
- Firebase: use Firebase Auth Emulator where possible via `FIREBASE_AUTH_EMULATOR_HOST`.
- Test user: `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`.
- Test database/Redis/LiteLLM: use local or dedicated E2E instances, never production.

Commands:

- `pnpm --filter @platform/web test:e2e`
- `pnpm --filter @platform/web test:e2e -- auth.spec.ts`
