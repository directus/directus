import { describe, expect, it, vi } from 'vitest';
import { isSpecialUseIp } from './egress-policy.js';
import {
	createMcpOAuthEgressLookup,
	McpOAuthEgressError,
	type McpOAuthResolver,
	validateMcpOAuthHostnameEgress,
} from './mcp-oauth-egress.js';

function createResolver(
	records: { A?: string[]; AAAA?: string[] },
	errors: { A?: Error; AAAA?: Error } = {},
): McpOAuthResolver {
	return {
		resolve4: vi.fn(async () => {
			if (errors.A) throw errors.A;
			return records.A ?? [];
		}),
		resolve6: vi.fn(async () => {
			if (errors.AAAA) throw errors.AAAA;
			return records.AAAA ?? [];
		}),
	};
}

function dnsError(code: string) {
	const error = new Error(code) as NodeJS.ErrnoException;
	error.code = code;
	return error;
}

function deferred<T>() {
	let resolve!: (value: T) => void;

	const promise = new Promise<T>((res) => {
		resolve = res;
	});

	return { promise, resolve };
}

async function expectMcpOAuthEgressError(promise: Promise<unknown>, reason: McpOAuthEgressError['reason']) {
	let error: unknown;

	try {
		await promise;
	} catch (err) {
		error = err;
	}

	expect(error).toBeInstanceOf(McpOAuthEgressError);
	expect(error).toMatchObject({ reason });
}

describe('isSpecialUseIp', () => {
	it('rejects representative IPv4 special-use ranges and allows public IPv4 addresses', () => {
		expect(isSpecialUseIp('0.0.0.0')).toBe(true);
		expect(isSpecialUseIp('10.0.0.1')).toBe(true);
		expect(isSpecialUseIp('100.64.0.1')).toBe(true);
		expect(isSpecialUseIp('127.0.0.1')).toBe(true);
		expect(isSpecialUseIp('169.254.169.254')).toBe(true);
		expect(isSpecialUseIp('172.16.0.1')).toBe(true);
		expect(isSpecialUseIp('192.0.0.8')).toBe(true);
		expect(isSpecialUseIp('192.88.99.1')).toBe(true);
		expect(isSpecialUseIp('192.168.1.1')).toBe(true);
		expect(isSpecialUseIp('198.18.0.1')).toBe(true);
		expect(isSpecialUseIp('203.0.113.1')).toBe(true);
		expect(isSpecialUseIp('224.0.0.1')).toBe(true);
		expect(isSpecialUseIp('240.0.0.1')).toBe(true);
		expect(isSpecialUseIp('255.255.255.255')).toBe(true);

		expect(isSpecialUseIp('8.8.8.8')).toBe(false);
		expect(isSpecialUseIp('1.1.1.1')).toBe(false);
	});

	it('rejects representative IPv6 special-use ranges and allows public IPv6 addresses', () => {
		expect(isSpecialUseIp('::')).toBe(true);
		expect(isSpecialUseIp('::1')).toBe(true);
		expect(isSpecialUseIp('64:ff9b::1')).toBe(true);
		expect(isSpecialUseIp('100::1')).toBe(true);
		expect(isSpecialUseIp('2001:db8::1')).toBe(true);
		expect(isSpecialUseIp('fc00::1')).toBe(true);
		expect(isSpecialUseIp('fe80::1')).toBe(true);
		expect(isSpecialUseIp('ff00::1')).toBe(true);

		expect(isSpecialUseIp('2606:4700:4700::1111')).toBe(false);
		expect(isSpecialUseIp('2001:4860:4860::8888')).toBe(false);
	});

	it.each(['::ffff:8.8.8.8', '::ffff:127.0.0.1', '::ffff:169.254.169.254'])('rejects IPv4-mapped address %s', (ip) => {
		expect(isSpecialUseIp(ip)).toBe(true);
	});

	it.each(['not-an-ip', '999.999.999.999', '2001:db8:::1', ''])('rejects malformed IP %s fail-closed', (ip) => {
		expect(isSpecialUseIp(ip)).toBe(true);
	});
});

describe('createMcpOAuthEgressLookup', () => {
	it('shapes options.all lookup results for both families', async () => {
		const resolver = createResolver({
			A: ['8.8.8.8'],
			AAAA: ['2606:4700:4700::1111'],
		});

		const lookup = createMcpOAuthEgressLookup({ deadlineAt: performance.now() + 1_000, resolver });
		const callback = vi.fn();

		lookup('directus.io', { all: true }, callback);

		await vi.waitFor(() => {
			expect(callback).toHaveBeenCalledOnce();
		});

		expect(callback).toHaveBeenCalledWith(
			null,
			[
				{ address: '8.8.8.8', family: 4 },
				{ address: '2606:4700:4700::1111', family: 6 },
			],
			undefined,
		);
	});

	it('validates both DNS families before returning a family-specific lookup result', async () => {
		const resolver = createResolver({
			A: ['8.8.8.8'],
			AAAA: ['2606:4700:4700::1111'],
		});

		const lookup = createMcpOAuthEgressLookup({ deadlineAt: performance.now() + 1_000, resolver });
		const callback = vi.fn();

		lookup('directus.io', { all: true, family: 6 }, callback);

		await vi.waitFor(() => {
			expect(callback).toHaveBeenCalledOnce();
		});

		expect(resolver.resolve4).toHaveBeenCalledOnce();
		expect(resolver.resolve6).toHaveBeenCalledOnce();
		expect(callback).toHaveBeenCalledWith(null, [{ address: '2606:4700:4700::1111', family: 6 }], undefined);
	});

	it('fails socket lookup when an unrequested DNS family contains a special-use address', async () => {
		const resolver = createResolver({
			A: ['127.0.0.1'],
			AAAA: ['2606:4700:4700::1111'],
		});

		const lookup = createMcpOAuthEgressLookup({ deadlineAt: performance.now() + 1_000, resolver });
		const callback = vi.fn();

		lookup('directus.io', { all: true, family: 6 }, callback);

		await vi.waitFor(() => {
			expect(callback).toHaveBeenCalledOnce();
		});

		expect(callback.mock.calls[0]?.[0]).toMatchObject({ reason: 'mcp_oauth_dns_special_use_ip' });
	});

	it('shapes single-address lookup results', async () => {
		const resolver = createResolver({
			A: ['8.8.8.8'],
			AAAA: ['2606:4700:4700::1111'],
		});

		const lookup = createMcpOAuthEgressLookup({ deadlineAt: performance.now() + 1_000, resolver });
		const callback = vi.fn();

		lookup('directus.io', { family: 4 }, callback);

		await vi.waitFor(() => {
			expect(callback).toHaveBeenCalledOnce();
		});

		expect(callback).toHaveBeenCalledWith(null, '8.8.8.8', 4);
	});

	it('fails closed when the requested family has no validated address after full validation', async () => {
		const resolver = createResolver({ AAAA: ['2606:4700:4700::1111'] }, { A: dnsError('ENODATA') });

		const lookup = createMcpOAuthEgressLookup({ deadlineAt: performance.now() + 1_000, resolver });
		const callback = vi.fn();

		lookup('directus.io', { family: 4 }, callback);

		await vi.waitFor(() => {
			expect(callback).toHaveBeenCalledOnce();
		});

		expect(callback.mock.calls[0]?.[0]).toBeInstanceOf(McpOAuthEgressError);
		expect(callback.mock.calls[0]?.[0]).toMatchObject({ reason: 'mcp_oauth_dns_empty_result' });
	});

	it('settles the callback only once when resolver completion arrives after timeout', async () => {
		const pendingA = deferred<string[]>();
		const pendingAAAA = deferred<string[]>();

		const resolver: McpOAuthResolver = {
			resolve4: vi.fn(() => pendingA.promise),
			resolve6: vi.fn(() => pendingAAAA.promise),
		};

		const lookup = createMcpOAuthEgressLookup({ deadlineAt: performance.now() + 5, resolver });
		const callback = vi.fn();

		lookup('directus.io', { family: 4 }, callback);

		await vi.waitFor(() => {
			expect(callback).toHaveBeenCalledOnce();
		});

		expect(callback.mock.calls[0]?.[0]).toMatchObject({ reason: 'mcp_oauth_dns_timeout' });

		pendingA.resolve(['8.8.8.8']);
		pendingAAAA.resolve(['2606:4700:4700::1111']);

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(callback).toHaveBeenCalledOnce();
	});
});

describe('validateMcpOAuthHostnameEgress', () => {
	it('rejects IP literal hostnames before DNS resolution', async () => {
		const resolver = createResolver({ A: ['8.8.8.8'] });

		await expectMcpOAuthEgressError(
			validateMcpOAuthHostnameEgress('8.8.8.8', { resolver }),
			'mcp_oauth_dns_ip_literal',
		);

		expect(resolver.resolve4).not.toHaveBeenCalled();
		expect(resolver.resolve6).not.toHaveBeenCalled();
	});

	it('validates every returned A and AAAA address before returning any result', async () => {
		const resolver = createResolver({
			A: ['8.8.8.8', '127.0.0.1'],
			AAAA: ['2606:4700:4700::1111'],
		});

		await expectMcpOAuthEgressError(
			validateMcpOAuthHostnameEgress('directus.io', { resolver }),
			'mcp_oauth_dns_special_use_ip',
		);
	});

	it('rejects malformed DNS answers as special-use results', async () => {
		const resolver = createResolver({
			A: ['8.8.8.8'],
			AAAA: ['not-an-ip'],
		});

		await expectMcpOAuthEgressError(
			validateMcpOAuthHostnameEgress('directus.io', { resolver }),
			'mcp_oauth_dns_special_use_ip',
		);
	});

	it('returns public A and AAAA DNS answers after validation', async () => {
		const resolver = createResolver({
			A: ['8.8.8.8'],
			AAAA: ['2606:4700:4700::1111'],
		});

		await expect(validateMcpOAuthHostnameEgress('directus.io', { resolver })).resolves.toEqual({
			addresses4: ['8.8.8.8'],
			addresses6: ['2606:4700:4700::1111'],
		});
	});

	it('treats ENODATA from one family as empty and allows the other public family', async () => {
		const resolver = createResolver({ A: ['8.8.8.8'] }, { AAAA: dnsError('ENODATA') });

		await expect(validateMcpOAuthHostnameEgress('directus.io', { resolver })).resolves.toEqual({
			addresses4: ['8.8.8.8'],
			addresses6: [],
		});
	});

	it('rejects when both DNS families are empty', async () => {
		const resolver = createResolver({}, { A: dnsError('ENOTFOUND'), AAAA: dnsError('ENODATA') });

		await expectMcpOAuthEgressError(
			validateMcpOAuthHostnameEgress('empty.directus.io', { resolver }),
			'mcp_oauth_dns_empty_result',
		);
	});

	it('wraps resolver failures as DNS errors', async () => {
		const resolver = createResolver({ AAAA: ['2606:4700:4700::1111'] }, { A: dnsError('SERVFAIL') });

		await expectMcpOAuthEgressError(validateMcpOAuthHostnameEgress('directus.io', { resolver }), 'mcp_oauth_dns_error');
	});

	it('times out under the shared deadline', async () => {
		const resolver: McpOAuthResolver = {
			resolve4: vi.fn(() => new Promise<string[]>(() => undefined)),
			resolve6: vi.fn(async () => ['2606:4700:4700::1111']),
		};

		await expectMcpOAuthEgressError(
			validateMcpOAuthHostnameEgress('directus.io', { resolver, deadlineAt: performance.now() + 5 }),
			'mcp_oauth_dns_timeout',
		);
	});

	it('caps DNS work at 1000ms even when the caller deadline has more budget', async () => {
		vi.useFakeTimers();

		try {
			const resolver: McpOAuthResolver = {
				resolve4: vi.fn(() => new Promise<string[]>(() => undefined)),
				resolve6: vi.fn(() => new Promise<string[]>(() => undefined)),
			};

			const promise = validateMcpOAuthHostnameEgress('directus.io', {
				resolver,
				deadlineAt: performance.now() + 3_000,
			});

			const assertion = expectMcpOAuthEgressError(promise, 'mcp_oauth_dns_timeout');

			await vi.advanceTimersByTimeAsync(1_000);

			await assertion;
		} finally {
			vi.useRealTimers();
		}
	});

	it('rejects an expired budget without invoking the resolver', async () => {
		const resolver = createResolver({ A: ['8.8.8.8'], AAAA: ['2606:4700:4700::1111'] });

		await expectMcpOAuthEgressError(
			validateMcpOAuthHostnameEgress('directus.io', { resolver, deadlineAt: performance.now() - 1 }),
			'mcp_oauth_dns_timeout',
		);

		expect(resolver.resolve4).not.toHaveBeenCalled();
		expect(resolver.resolve6).not.toHaveBeenCalled();
	});
});
