import { ForbiddenError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMockRequest, createMockResponse, getRouteHandler } from '../test-utils/controllers.js';

const licenseManager = vi.hoisted(() => ({
	preview: vi.fn(),
	getLicense: vi.fn(),
	getStatus: vi.fn(),
	getInvalidReason: vi.fn(),
	getEditable: vi.fn(),
	getSource: vi.fn(),
	billingPortalUrl: vi.fn(),
}));

const isSetupCompleted = vi.hoisted(() => vi.fn());
const getCoreGraceExpiresAt = vi.hoisted(() => vi.fn());

vi.mock('../license/manager.js', () => ({ getLicenseManager: () => licenseManager }));
vi.mock('../license/index.js', () => ({ getEntitlementManager: () => ({ getUsage: vi.fn().mockResolvedValue(0) }) }));
vi.mock('../middleware/respond.js', () => ({ respond: vi.fn() }));

vi.mock('../license/utils/get-core-grace-expires-at.js', () => ({
	getCoreGraceExpiresAt,
	GRACE_PERIOD_MS: 30 * 24 * 60 * 60 * 1000,
}));

vi.mock('../services/server.js', () => ({
	ServerService: vi.fn(function () {
		return { isSetupCompleted };
	}),
}));

const { default: router } = await import('./license.js');

afterEach(() => {
	vi.clearAllMocks();
});

describe('POST /preview', () => {
	const [handler] = getRouteHandler(router, 'POST', '/preview');

	const preview = async (accountability?: Accountability) => {
		const next = vi.fn();

		const req = createMockRequest({
			...(accountability && { accountability }),
			body: { license_key: 'D0000-00000-00000-00000-0000K' },
		});

		await handler!.handle(req, createMockResponse(), next);

		return next.mock.calls[0]?.[0];
	};

	test('rejects a non-admin once setup is complete', async () => {
		isSetupCompleted.mockResolvedValue(true);

		expect(await preview({ user: 'user-1', admin: false } as Accountability)).toBeInstanceOf(ForbiddenError);
		expect(licenseManager.preview).not.toHaveBeenCalled();
	});

	test('is open to anonymous requests during onboarding', async () => {
		isSetupCompleted.mockResolvedValue(false);

		licenseManager.preview.mockResolvedValue({
			plan_name: 'Plan',
			expires_at: 0,
			entitlements: { production_enabled: { default: true } },
		});

		expect(await preview()).toBeUndefined();
		expect(licenseManager.preview).toHaveBeenCalledWith('D0000-00000-00000-00000-0000K');
	});
});

describe('GET /', () => {
	const [, handler] = getRouteHandler(router, 'GET', '/');

	const read = async () => {
		const res = createMockResponse();

		await handler!.handle(createMockRequest(), res, vi.fn());

		return res.locals['payload'].data;
	};

	function licenseInGrace(source: 'settings' | null) {
		licenseManager.getSource.mockReturnValue(source);
		licenseManager.getStatus.mockResolvedValue('grace');
		licenseManager.getLicense.mockResolvedValue({ meta: { expires_at: 1000, grace_period: 60 }, entitlements: {} });
		getCoreGraceExpiresAt.mockResolvedValue(1_780_000_000);
	}

	test('CORE in the upgrade grace period reports the upgrade date and a 30 day grace period', async () => {
		licenseInGrace(null);

		expect(await read()).toMatchObject({ expires_at: 1_780_000_000, grace_period: 2_592_000 });
	});

	test("a license in its grace period reports the license's own expiry", async () => {
		licenseInGrace('settings');

		expect(await read()).toMatchObject({ expires_at: 1000, grace_period: 60 });
	});
});

describe('GET /portal', () => {
	test('redirects to the billing portal', async () => {
		const [, handler] = getRouteHandler(router, 'GET', '/portal');
		const res = createMockResponse({ redirect: vi.fn() } as any);
		licenseManager.billingPortalUrl.mockResolvedValue('https://billing.example.com/session/abc');

		await handler!.handle(createMockRequest(), res, vi.fn());

		expect(res.redirect).toHaveBeenCalledWith('https://billing.example.com/session/abc');
	});
});
