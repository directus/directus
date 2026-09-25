import { ForbiddenError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMockRequest, createMockResponse, getRouteHandler } from '../test-utils/controllers.js';

const licenseManager = vi.hoisted(() => ({ preview: vi.fn() }));
const isSetupCompleted = vi.hoisted(() => vi.fn());

vi.mock('../license/manager.js', () => ({ getLicenseManager: () => licenseManager }));
vi.mock('../license/index.js', () => ({ getEntitlementManager: vi.fn() }));
vi.mock('../middleware/respond.js', () => ({ respond: vi.fn() }));

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
