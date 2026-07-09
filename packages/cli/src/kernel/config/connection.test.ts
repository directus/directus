import { describe, expect, it } from 'vitest';
import { describeIdentity, mapRequestError } from './connection.js';

describe('describeIdentity', () => {
	it('prefers a full name, then email, then a safe placeholder', () => {
		expect(describeIdentity({ first_name: 'Bryant', last_name: 'G', email: 'b@x.com' }, undefined).user).toBe(
			'Bryant G',
		);

		expect(describeIdentity({ email: 'b@x.com' }, undefined).user).toBe('b@x.com');
		expect(describeIdentity({}, undefined).user).toBe('unknown user');
	});

	it('reads the role name from an expanded role or a bare id string', () => {
		expect(describeIdentity({ role: { name: 'Administrator' } }, undefined).role).toBe('Administrator');
		expect(describeIdentity({ role: 'role-uuid' }, undefined).role).toBe('role-uuid');
		expect(describeIdentity({}, undefined).role).toBe('unknown role');
	});

	it('passes the project name through', () => {
		expect(describeIdentity({}, 'My CMS').projectName).toBe('My CMS');
	});
});

describe('mapRequestError', () => {
	function directusError(status: number, code: string, response: unknown = { status }) {
		return { name: 'RequestError', errors: [{ message: `${code} happened`, extensions: { code } }], response };
	}

	it('maps 401 / auth codes to an AUTH error with a clean message', () => {
		const result = mapRequestError(directusError(401, 'INVALID_CREDENTIALS'), 'https://cms.example.com');

		expect(result.code).toBe('AUTH');
		expect(result.message).toBe('Authentication failed for https://cms.example.com.');
		expect(result.detail).toContain('INVALID_CREDENTIALS');
	});

	it('maps a 403 FORBIDDEN to AUTH', () => {
		expect(mapRequestError(directusError(403, 'FORBIDDEN'), 'https://cms.example.com').code).toBe('AUTH');
	});

	it('maps other statuses to HTTP with the status in the message', () => {
		const result = mapRequestError(directusError(500, 'INTERNAL_SERVER_ERROR'), 'https://cms.example.com');

		expect(result.code).toBe('HTTP');
		expect(result.message).toContain('HTTP 500');
	});

	it('builds detail from error codes only — never the Response, which carries the token', () => {
		// The Response object holds the sent Authorization header; detail must not.
		const withToken = directusError(401, 'INVALID_CREDENTIALS', {
			status: 401,
			headers: { Authorization: 'Bearer super-secret-token-xyz' },
		});

		const result = mapRequestError(withToken, 'https://cms.example.com');

		expect(result.detail).not.toContain('super-secret-token-xyz');
		expect(result.message).not.toContain('super-secret-token-xyz');
	});

	it('maps a transport failure (no Response) to a reachability HTTP error', () => {
		const result = mapRequestError(new Error('fetch failed'), 'https://cms.example.com');

		expect(result.code).toBe('HTTP');
		expect(result.message).toContain('Could not reach');
		expect(result.detail).toBe('fetch failed');
	});
});
