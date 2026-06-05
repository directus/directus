import type { Accountability } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createMockRequest, createMockResponse, getRouteHandler } from '../../test-utils/controllers.js';

const readSingleton = vi.fn();
const handleRequest = vi.fn();

const mockEnv = {
	MCP_OAUTH_ENABLED: true,
};

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => mockEnv),
}));

vi.mock('../../services/settings.js', () => ({
	SettingsService: vi.fn().mockImplementation(() => ({
		readSingleton,
	})),
}));

vi.mock('../../ai/mcp/index.js', () => ({
	DirectusMCP: vi.fn().mockImplementation(() => ({
		handleRequest,
	})),
}));

vi.mock('../../middleware/is-locked.js', () => ({
	default: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
}));

const { default: router } = await import('./index.js');
const { DirectusMCP } = await import('../../ai/mcp/index.js');

function makeAccountability(overrides: Partial<Accountability> = {}): Accountability {
	return {
		user: 'user-id',
		role: null,
		roles: [],
		admin: false,
		app: false,
		ip: null,
		...overrides,
	};
}

function mockSettings(overrides: Record<string, unknown> = {}) {
	readSingleton.mockResolvedValue({
		mcp_enabled: true,
		mcp_oauth_enabled: true,
		mcp_allow_deletes: false,
		mcp_prompts_collection: null,
		mcp_system_prompt: null,
		mcp_system_prompt_enabled: false,
		...overrides,
	});
}

describe('mcp controller', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEnv.MCP_OAUTH_ENABLED = true;
		mockSettings();
	});

	test('rejects OAuth accountability when MCP OAuth is disabled in settings', async () => {
		mockSettings({ mcp_oauth_enabled: false });

		const req = createMockRequest({
			accountability: makeAccountability({
				oauth: { client: 'client-id', scopes: ['mcp:access'], aud: ['https://example.com/mcp'] },
			}),
		});

		const res = createMockResponse();
		const next = vi.fn();

		const [handler] = getRouteHandler(router, 'GET', '/');
		await handler!.handle(req, res, next);

		expect(next).toHaveBeenCalledWith(expect.any(Error));
		expect(handleRequest).not.toHaveBeenCalled();
	});

	test('rejects OAuth accountability when MCP OAuth is disabled by env', async () => {
		mockEnv.MCP_OAUTH_ENABLED = false;

		const req = createMockRequest({
			accountability: makeAccountability({
				oauth: { client: 'client-id', scopes: ['mcp:access'], aud: ['https://example.com/mcp'] },
			}),
		});

		const res = createMockResponse();
		const next = vi.fn();

		const [handler] = getRouteHandler(router, 'GET', '/');
		await handler!.handle(req, res, next);

		expect(next).toHaveBeenCalledWith(expect.any(Error));
		expect(handleRequest).not.toHaveBeenCalled();
	});

	test('allows regular Directus accountability when MCP is enabled and MCP OAuth is disabled', async () => {
		mockSettings({ mcp_oauth_enabled: false });

		const req = createMockRequest({
			accountability: makeAccountability(),
		});

		const res = createMockResponse();
		const next = vi.fn();

		const [handler] = getRouteHandler(router, 'POST', '/');
		await handler!.handle(req, res, next);

		expect(next).not.toHaveBeenCalled();

		expect(DirectusMCP).toHaveBeenCalledWith({
			promptsCollection: null,
			allowDeletes: false,
			systemPromptEnabled: false,
			systemPrompt: null,
		});

		expect(handleRequest).toHaveBeenCalledWith(req, res);
	});
});
