import { isIP } from 'node:net';
import { isDomainAllowed } from './domain.js';
import { normalizeHostname } from './egress-policy.js';

export type JwksUriValidationErrorReason =
	| 'required'
	| 'too_long'
	| 'invalid_url'
	| 'invalid_scheme'
	| 'credentials'
	| 'fragment'
	| 'dot_segments'
	| 'ip_literal'
	| 'cross_origin'
	| 'non_canonical'
	| 'disallowed_domain';

export class JwksUriValidationError extends Error {
	constructor(public reason: JwksUriValidationErrorReason) {
		super(reason);
		this.name = 'JwksUriValidationError';
	}
}

export interface ValidateJwksUriOptions {
	allowedDomains: string[];
	maxLength: number;
}

export function validateJwksUri(value: unknown, clientId: string, options: ValidateJwksUriOptions): string {
	if (typeof value !== 'string' || value.length === 0) {
		throw new JwksUriValidationError('required');
	}

	if (value.length > options.maxLength) {
		throw new JwksUriValidationError('too_long');
	}

	let parsed: URL;
	let parsedClientId: URL;

	try {
		parsed = new URL(value);
		parsedClientId = new URL(clientId);
	} catch {
		throw new JwksUriValidationError('invalid_url');
	}

	if (parsed.protocol !== 'https:') {
		throw new JwksUriValidationError('invalid_scheme');
	}

	if (parsed.username || parsed.password) {
		throw new JwksUriValidationError('credentials');
	}

	if (value.includes('#')) {
		throw new JwksUriValidationError('fragment');
	}

	const rawPath = value.slice(parsed.origin.length).split(/[?#]/, 1)[0] ?? '';

	if (/(?:^|\/)\.\.?(?:\/|$)/.test(parsed.pathname) || /(?:^|\/)\.\.?(?:\/|$)/.test(rawPath)) {
		throw new JwksUriValidationError('dot_segments');
	}

	const hostname = normalizeHostname(parsed.hostname);

	if (isIP(hostname) !== 0) {
		throw new JwksUriValidationError('ip_literal');
	}

	if (parsed.origin !== parsedClientId.origin) {
		throw new JwksUriValidationError('cross_origin');
	}

	if (parsed.href !== value) {
		throw new JwksUriValidationError('non_canonical');
	}

	if (options.allowedDomains.length > 0 && !isDomainAllowed(hostname, options.allowedDomains)) {
		throw new JwksUriValidationError('disallowed_domain');
	}

	return value;
}
