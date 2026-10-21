import { ResourceRestrictedError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ItemsService } from './items.js';
import { SettingsService } from './settings.js';

const entitlements = vi.hoisted(() => ({ isEntitled: vi.fn(), clearCache: vi.fn() }));

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

vi.mock('../license/index.js', () => ({ getEntitlementManager: () => entitlements }));
vi.mock('../telemetry/index.js', () => ({ sendReport: vi.fn() }));

const schema = { collections: {}, relations: [] } as unknown as SchemaOverview;
const accountability = { user: 'admin', admin: true } as Accountability;

afterEach(() => {
	vi.clearAllMocks();
});

describe('custom_llms_enabled not entitled', () => {
	const service = () => new SettingsService({ schema, accountability });

	beforeEach(() => {
		entitlements.isEntitled.mockReturnValue(false);
	});

	test.each([
		[
			'updateMany',
			() =>
				service().updateMany([1], { project_name: 'Acme', ai_openai_compatible_base_url: 'https://llm.example.com' }),
		],
		[
			'createOne',
			() => service().createOne({ project_name: 'Acme', ai_openai_compatible_base_url: 'https://llm.example.com' }),
		],
	])('%s setting an LLM field alongside allowed fields rejects before writing', async (method, mutate) => {
		await expect(mutate()).rejects.toBeInstanceOf(ResourceRestrictedError);
		expect(ItemsService.prototype[method as 'updateMany' | 'createOne']).not.toHaveBeenCalled();
	});

	test('updateMany with only non-LLM fields is allowed', async () => {
		await service().updateMany([1], { project_name: 'Acme' });

		expect(ItemsService.prototype.updateMany).toHaveBeenCalled();
	});

	test('updateMany clearing an LLM field to null is allowed', async () => {
		await service().updateMany([1], { ai_openai_compatible_name: null });

		expect(ItemsService.prototype.updateMany).toHaveBeenCalled();
	});

	test('readByQuery strips configured LLM fields and leaves others intact', async () => {
		vi.mocked(ItemsService.prototype.readByQuery).mockResolvedValue([
			{
				project_name: 'Acme',
				ai_openai_compatible_name: 'leaked',
				ai_openai_compatible_base_url: 'https://llm.example.com',
			},
		]);

		expect(await service().readByQuery({})).toEqual([
			{ project_name: 'Acme', ai_openai_compatible_name: null, ai_openai_compatible_base_url: null },
		]);
	});

	test('readByQuery without accountability (internal use) keeps LLM fields', async () => {
		vi.mocked(ItemsService.prototype.readByQuery).mockResolvedValue([{ ai_openai_compatible_name: 'internal' }]);

		expect(await new SettingsService({ schema, accountability: null }).readByQuery({})).toEqual([
			{ ai_openai_compatible_name: 'internal' },
		]);
	});
});

describe('custom_llms_enabled entitled', () => {
	const service = () => new SettingsService({ schema, accountability });

	beforeEach(() => {
		entitlements.isEntitled.mockReturnValue(true);
	});

	test('updateMany setting an LLM field is allowed and invalidates the cached validity', async () => {
		await service().updateMany([1], { ai_openai_compatible_name: 'gpt-custom' });

		expect(ItemsService.prototype.updateMany).toHaveBeenCalled();
		expect(entitlements.clearCache).toHaveBeenCalledWith('custom_llms_enabled');
	});

	test('readByQuery returns LLM fields', async () => {
		vi.mocked(ItemsService.prototype.readByQuery).mockResolvedValue([{ ai_openai_compatible_name: 'visible' }]);

		expect(await service().readByQuery({})).toEqual([{ ai_openai_compatible_name: 'visible' }]);
	});
});
