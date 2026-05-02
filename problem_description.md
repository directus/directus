# Request ID correlation for API logs and responses

## 1. Problem Brief
Directus API lacks a first-class request correlation ID, making it difficult to trace a single HTTP request across logs, reverse proxies, and error reports. Add a consistent request ID so every response exposes an identifier and every HTTP log line can be tied to the same request, including failures.

## 2. Requirements

- Accept a client-provided `X-Request-Id` only if it is:
	- non-empty
	- length <= 200 characters
	- matches `^[A-Za-z0-9._-]+$`
- Otherwise generate a new ID that also matches `^[A-Za-z0-9._-]+$`.
- The request ID must be assigned and the response `X-Request-Id` header must be set **before** any auth, rate limit, routing, and request logging middleware executes.
- Always set `X-Request-Id` on the response (including error responses such as 4xx/5xx).
- Never throw due to an invalid `X-Request-Id`; replace it instead.
- Terminal state: once response headers are sent, the request ID must not change.
- Validation timing: header validation must happen at request start (not at import time).

### Logger Integration
- Every HTTP log entry must include a `request_id` field whose value equals the effective `X-Request-Id` for that request.
- This must be implemented via `pino-http` `customProps`.

## 3. Test Assumptions

- The request ID utility module is located at `api/src/utils/request-id.ts` (compiled to `.js`).
- It must export:
	- `__requestIdTestUtils`: an object with numeric counters `resolveCalls`, `getFromHeadersCalls`, and `validateCalls`.
	- `__resetRequestIdTestUtils()`: resets the counters.
