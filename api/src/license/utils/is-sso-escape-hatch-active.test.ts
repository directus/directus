import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getEntitlementManager } from '../index.js';
import { getLicenseManager } from '../manager.js';
import { isSsoEscapeHatchActive } from './is-sso-escape-hatch-active.js';

vi.mock('../index.js', () => ({
	getEntitlementManager: vi.fn(),
}));

vi.mock('../manager.js', () => ({
	getLicenseManager: vi.fn(),
}));

const isEntitled = vi.fn();
const isLocked = vi.fn();

beforeEach(() => {
	vi.mocked(getEntitlementManager).mockReturnValue({ isEntitled } as any);
	vi.mocked(getLicenseManager).mockReturnValue({ isLocked } as any);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('isSsoEscapeHatchActive', () => {
	test('returns true when sso_enabled is entitled', async () => {
		isEntitled.mockReturnValue(true);

		await expect(isSsoEscapeHatchActive()).resolves.toBe(true);
		expect(isLocked).not.toHaveBeenCalled();
	});

	test('returns false when not entitled and license is not locked', async () => {
		isEntitled.mockReturnValue(false);
		isLocked.mockResolvedValue(false);

		await expect(isSsoEscapeHatchActive()).resolves.toBe(false);
	});

	test('returns true when not entitled but license is locked', async () => {
		isEntitled.mockReturnValue(false);
		isLocked.mockResolvedValue(true);

		await expect(isSsoEscapeHatchActive()).resolves.toBe(true);
	});
});
