import { describe, expect, it, vi } from 'vitest';
import {
	CimdEgressError,
	type CimdResolver,
	createCimdLookup,
	isSpecialUseIp,
	validateCimdHostnameEgress,
} from './cimd-egress.js';

function createResolver(
	records: { A?: string[]; AAAA?: string[] },
	errors: { A?: Error; AAAA?: Error } = {},
): CimdResolver {
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
	let reject!: (error: Error) => void;

	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve, reject };
}

async function expectCimdError(promise: Promise<unknown>, reason: CimdEgressError['reason']) {
	let error: unknown;

	try {
		await promise;
	} catch (err) {
		error = err;
	}

	expect(error).toBeInstanceOf(CimdEgressError);
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
		expect(isSpecialUseIp('192.168.1.1')).toBe(true);
		expect(isSpecialUseIp('198.18.0.1')).toBe(true);
		expect(isSpecialUseIp('203.0.113.1')).toBe(true);
		expect(isSpecialUseIp('240.0.0.1')).toBe(true);
		expect(isSpecialUseIp('255.255.255.255')).toBe(true);

		expect(isSpecialUseIp('8.8.8.8')).toBe(false);
		expect(isSpecialUseIp('1.1.1.1')).toBe(false);
		expect(isSpecialUseIp('224.0.0.1')).toBe(false);
	});

	it('rejects representative IPv6 special-use ranges and allows public IPv6 addresses', () => {
		expect(isSpecialUseIp('::')).toBe(true);
		expect(isSpecialUseIp('::1')).toBe(true);
		expect(isSpecialUseIp('64:ff9b::1')).toBe(true);
		expect(isSpecialUseIp('100::1')).toBe(true);
		expect(isSpecialUseIp('2001:db8::1')).toBe(true);
		expect(isSpecialUseIp('fc00::1')).toBe(true);
		expect(isSpecialUseIp('fe80::1')).toBe(true);

		expect(isSpecialUseIp('2606:4700:4700::1111')).toBe(false);
		expect(isSpecialUseIp('2001:4860:4860::8888')).toBe(false);
		expect(isSpecialUseIp('ff00::1')).toBe(false);
	});

	it.each(['::ffff:8.8.8.8', '::ffff:127.0.0.1', '::ffff:169.254.169.254'])('rejects IPv4-mapped address %s', (ip) => {
		expect(isSpecialUseIp(ip)).toBe(true);
	});

	it.each(['not-an-ip', '999.999.999.999', '2001:db8:::1', ''])('rejects malformed IP %s fail-closed', (ip) => {
		expect(isSpecialUseIp(ip)).toBe(true);
	});
});

describe('validateCimdHostnameEgress', () => {
	it('rejects IP literal hostnames before DNS resolution', async () => {
		const resolver = createResolver({ A: ['8.8.8.8'] });

		await expectCimdError(validateCimdHostnameEgress('8.8.8.8', { resolver }), 'cimd_dns_ip_literal');

		expect(resolver.resolve4).not.toHaveBeenCalled();
		expect(resolver.resolve6).not.toHaveBeenCalled();
	});

	it('validates every returned A and AAAA address before returning any result', async () => {
		const resolver = createResolver({
			A: ['8.8.8.8', '127.0.0.1'],
			AAAA: ['2606:4700:4700::1111'],
		});

		await expectCimdError(validateCimdHostnameEgress('directus.io', { resolver }), 'cimd_dns_special_use_ip');
	});

	it('rejects malformed DNS answers as special-use results', async () => {
		const resolver = createResolver({
			A: ['8.8.8.8'],
			AAAA: ['not-an-ip'],
		});

		await expectCimdError(validateCimdHostnameEgress('directus.io', { resolver }), 'cimd_dns_special_use_ip');
	});

	it('returns public A and AAAA DNS answers after validation', async () => {
		const resolver = createResolver({
			A: ['8.8.8.8'],
			AAAA: ['2606:4700:4700::1111'],
		});

		await expect(validateCimdHostnameEgress('directus.io', { resolver })).resolves.toEqual({
			addresses4: ['8.8.8.8'],
			addresses6: ['2606:4700:4700::1111'],
		});
	});

	it('treats ENODATA from one family as empty and allows the other public family', async () => {
		const resolver = createResolver({ A: ['8.8.8.8'] }, { AAAA: dnsError('ENODATA') });

		await expect(validateCimdHostnameEgress('directus.io', { resolver })).resolves.toEqual({
			addresses4: ['8.8.8.8'],
			addresses6: [],
		});
	});

	it('rejects when both DNS families are empty', async () => {
		const resolver = createResolver({}, { A: dnsError('ENOTFOUND'), AAAA: dnsError('ENODATA') });

		await expectCimdError(validateCimdHostnameEgress('empty.directus.io', { resolver }), 'cimd_dns_empty_result');
	});

	it('wraps resolver failures as DNS errors', async () => {
		const resolver = createResolver({ AAAA: ['2606:4700:4700::1111'] }, { A: dnsError('SERVFAIL') });

		await expectCimdError(validateCimdHostnameEgress('directus.io', { resolver }), 'cimd_dns_error');
	});

	it('times out under the shared deadline', async () => {
		const resolver: CimdResolver = {
			resolve4: vi.fn(() => new Promise<string[]>(() => undefined)),
			resolve6: vi.fn(async () => ['2606:4700:4700::1111']),
		};

		await expectCimdError(
			validateCimdHostnameEgress('directus.io', { resolver, deadlineAt: performance.now() + 5 }),
			'cimd_dns_timeout',
		);
	});

	it('caps DNS work at 1000ms even when the caller deadline has more budget', async () => {
		vi.useFakeTimers();

		try {
			const resolver: CimdResolver = {
				resolve4: vi.fn(() => new Promise<string[]>(() => undefined)),
				resolve6: vi.fn(() => new Promise<string[]>(() => undefined)),
			};

			const promise = validateCimdHostnameEgress('directus.io', {
				resolver,
				deadlineAt: performance.now() + 3_000,
			});

			const assertion = expectCimdError(promise, 'cimd_dns_timeout');

			await vi.advanceTimersByTimeAsync(1_000);

			await assertion;
		} finally {
			vi.useRealTimers();
		}
	});

	it('rejects an expired budget without invoking the resolver', async () => {
		const resolver = createResolver({ A: ['8.8.8.8'], AAAA: ['2606:4700:4700::1111'] });

		await expectCimdError(
			validateCimdHostnameEgress('directus.io', { resolver, deadlineAt: performance.now() - 1 }),
			'cimd_dns_timeout',
		);

		expect(resolver.resolve4).not.toHaveBeenCalled();
		expect(resolver.resolve6).not.toHaveBeenCalled();
	});
});

describe('createCimdLookup', () => {
	it('shapes options.all lookup results for both families', async () => {
		const resolver = createResolver({
			A: ['8.8.8.8'],
			AAAA: ['2606:4700:4700::1111'],
		});

		const lookup = createCimdLookup({ deadlineAt: performance.now() + 1_000, resolver });
		const callback = vi.fn();

		lookup('directus.io', { all: true }, callback);

		await vi.waitFor(() => {
			expect(callback).toHaveBeenCalledOnce();
		});

		expect(callback).toHaveBeenCalledWith(null, [
			{ address: '8.8.8.8', family: 4 },
			{ address: '2606:4700:4700::1111', family: 6 },
		]);
	});

	it('shapes family-specific all lookup results after validating both DNS families', async () => {
		const resolver = createResolver({
			A: ['8.8.8.8'],
			AAAA: ['2606:4700:4700::1111'],
		});

		const lookup = createCimdLookup({ deadlineAt: performance.now() + 1_000, resolver });
		const callback = vi.fn();

		lookup('directus.io', { all: true, family: 6 }, callback);

		await vi.waitFor(() => {
			expect(callback).toHaveBeenCalledOnce();
		});

		expect(resolver.resolve4).toHaveBeenCalledOnce();
		expect(callback).toHaveBeenCalledWith(null, [{ address: '2606:4700:4700::1111', family: 6 }]);
	});

	it('fails lookup when an unrequested family contains a special-use address', async () => {
		const resolver = createResolver({
			A: ['127.0.0.1'],
			AAAA: ['2606:4700:4700::1111'],
		});

		const lookup = createCimdLookup({ deadlineAt: performance.now() + 1_000, resolver });
		const callback = vi.fn();

		lookup('directus.io', { all: true, family: 6 }, callback);

		await vi.waitFor(() => {
			expect(callback).toHaveBeenCalledOnce();
		});

		expect(callback.mock.calls[0]?.[0]).toMatchObject({ reason: 'cimd_dns_special_use_ip' });
	});

	it('shapes single-address lookup results', async () => {
		const resolver = createResolver({
			A: ['8.8.8.8'],
			AAAA: ['2606:4700:4700::1111'],
		});

		const lookup = createCimdLookup({ deadlineAt: performance.now() + 1_000, resolver });
		const callback = vi.fn();

		lookup('directus.io', { family: 4 }, callback);

		await vi.waitFor(() => {
			expect(callback).toHaveBeenCalledOnce();
		});

		expect(callback).toHaveBeenCalledWith(null, '8.8.8.8', 4);
	});

	it('fails closed when the requested family has no validated address after full validation', async () => {
		const resolver = createResolver({ AAAA: ['2606:4700:4700::1111'] }, { A: dnsError('ENODATA') });

		const lookup = createCimdLookup({ deadlineAt: performance.now() + 1_000, resolver });
		const callback = vi.fn();

		lookup('directus.io', { family: 4 }, callback);

		await vi.waitFor(() => {
			expect(callback).toHaveBeenCalledOnce();
		});

		expect(callback.mock.calls[0]?.[0]).toBeInstanceOf(CimdEgressError);
		expect(callback.mock.calls[0]?.[0]).toMatchObject({ reason: 'cimd_dns_empty_result' });
	});

	it('settles the callback only once when resolver completion arrives after timeout', async () => {
		const pendingA = deferred<string[]>();
		const pendingAAAA = deferred<string[]>();

		const resolver: CimdResolver = {
			resolve4: vi.fn(() => pendingA.promise),
			resolve6: vi.fn(() => pendingAAAA.promise),
		};

		const lookup = createCimdLookup({ deadlineAt: performance.now() + 5, resolver });
		const callback = vi.fn();

		lookup('directus.io', { family: 4 }, callback);

		await vi.waitFor(() => {
			expect(callback).toHaveBeenCalledOnce();
		});

		expect(callback.mock.calls[0]?.[0]).toMatchObject({ reason: 'cimd_dns_timeout' });

		pendingA.resolve(['8.8.8.8']);
		pendingAAAA.resolve(['2606:4700:4700::1111']);

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(callback).toHaveBeenCalledOnce();
	});
});
