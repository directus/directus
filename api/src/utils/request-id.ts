import type { IncomingHttpHeaders } from 'node:http';
import { nanoid } from 'nanoid';

export const REQUEST_ID_HEADER = 'X-Request-Id' as const;

const shouldTrackRequestIdDebug =
	process.env.NODE_ENV === 'test' || typeof process.env.VITEST !== 'undefined';

export const __requestIdTestUtils = {
	validateCalls: 0,
	getFromHeadersCalls: 0,
	resolveCalls: 0,
};

export const __resetRequestIdTestUtils = () => {
	if (shouldTrackRequestIdDebug === false) return;
	__requestIdTestUtils.validateCalls = 0;
	__requestIdTestUtils.getFromHeadersCalls = 0;
	__requestIdTestUtils.resolveCalls = 0;
};

export type RequestIdValidationResult =
	| { ok: true; value: string }
	| { ok: false; reason: 'missing' | 'empty' | 'too_long' | 'unsafe' };

const MAX_REQUEST_ID_LENGTH = 200;
const SAFE_REQUEST_ID_REGEX = /^[A-Za-z0-9._-]+$/;

export const validateRequestId = (value: unknown): RequestIdValidationResult => {
	if (shouldTrackRequestIdDebug) __requestIdTestUtils.validateCalls++;
	if (value == null) return { ok: false, reason: 'missing' };
	if (typeof value !== 'string') return { ok: false, reason: 'unsafe' };
	if (value.length === 0) return { ok: false, reason: 'empty' };
	if (value.length > MAX_REQUEST_ID_LENGTH) return { ok: false, reason: 'too_long' };
	if (SAFE_REQUEST_ID_REGEX.test(value) === false) return { ok: false, reason: 'unsafe' };
	return { ok: true, value };
};

export const generateRequestId = (): string => nanoid();

export const getRequestIdFromHeaders = (headers: IncomingHttpHeaders): RequestIdValidationResult => {
	if (shouldTrackRequestIdDebug) __requestIdTestUtils.getFromHeadersCalls++;
	const raw = headers['x-request-id'];

	if (Array.isArray(raw)) {
		return validateRequestId(raw[0]);
	}

	return validateRequestId(raw);
};

export const resolveRequestId = (headers: IncomingHttpHeaders): string => {
	if (shouldTrackRequestIdDebug) __requestIdTestUtils.resolveCalls++;
	const validated = getRequestIdFromHeaders(headers);
	return validated.ok ? validated.value : generateRequestId();
};
