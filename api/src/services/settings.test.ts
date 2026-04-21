import { SchemaBuilder } from '@directus/schema-builder';
import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLicenseEntitlements } from '../license/summary.js';
import { ItemsService } from './items.js';
import { SettingsService } from './settings.js';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
}));

vi.mock('../license/summary.js', async () => {
	const actual = await vi.importActual<typeof import('../license/summary.js')>('../license/summary.js');
	return {
		...actual,
		getLicenseEntitlements: vi.fn(),
	};
});

const schema = new SchemaBuilder()
	.collection('directus_settings', (collection) => {
		collection.field('id').integer().primary();
		collection.field('ai_openai_api_key').text();
		collection.field('ai_openai_compatible_api_key').text();
		collection.field('ai_openai_compatible_base_url').text();
		collection.field('ai_openai_compatible_name').text();
		collection.field('ai_openai_compatible_models').json();
		collection.field('ai_openai_compatible_headers').json();
	})
	.build();

describe('SettingsService', () => {
	const db = vi.mocked(knex.default({ client: MockClient }));

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('redacts custom LLM provider settings when the entitlement is disabled', async () => {
		vi.mocked(getLicenseEntitlements).mockResolvedValue({
			custom_llm_enabled: false,
		} as any);

		const readSingletonSpy = vi.spyOn(ItemsService.prototype, 'readSingleton').mockResolvedValue({
			ai_openai_api_key: 'openai-key',
			ai_openai_compatible_api_key: 'custom-key',
			ai_openai_compatible_base_url: 'http://localhost:11434/v1',
		});

		const service = new SettingsService({
			knex: db,
			schema,
		});

		const query = {
			fields: ['ai_openai_api_key', 'ai_openai_compatible_api_key', 'ai_openai_compatible_base_url'],
		};

		const result = await service.readSingleton(query);

		expect(readSingletonSpy).toHaveBeenCalledWith(query, undefined);

		expect(result).toStrictEqual({
			ai_openai_api_key: 'openai-key',
			ai_openai_compatible_api_key: null,
			ai_openai_compatible_base_url: null,
		});

		expect(result).not.toHaveProperty('ai_openai_compatible_name');
		expect(result).not.toHaveProperty('ai_openai_compatible_models');
		expect(result).not.toHaveProperty('ai_openai_compatible_headers');
	});

	it('returns custom LLM provider settings unchanged when the entitlement is enabled', async () => {
		vi.mocked(getLicenseEntitlements).mockResolvedValue({
			custom_llm_enabled: true,
		} as any);

		const readSingletonSpy = vi.spyOn(ItemsService.prototype, 'readSingleton').mockResolvedValue({
			ai_openai_compatible_api_key: 'custom-key',
			ai_openai_compatible_base_url: 'http://localhost:11434/v1',
		});

		const service = new SettingsService({
			knex: db,
			schema,
		});

		const query = {
			fields: ['ai_openai_compatible_api_key', 'ai_openai_compatible_base_url'],
		};

		const result = await service.readSingleton(query);

		expect(readSingletonSpy).toHaveBeenCalledWith(query, undefined);

		expect(result).toStrictEqual({
			ai_openai_compatible_api_key: 'custom-key',
			ai_openai_compatible_base_url: 'http://localhost:11434/v1',
		});
	});

	it('skips entitlement lookup when the query does not include custom LLM fields', async () => {
		const readSingletonSpy = vi.spyOn(ItemsService.prototype, 'readSingleton').mockResolvedValue({
			ai_openai_api_key: 'openai-key',
		});

		const service = new SettingsService({
			knex: db,
			schema,
		});

		const query = {
			fields: ['ai_openai_api_key'],
		};

		const result = await service.readSingleton(query);

		expect(readSingletonSpy).toHaveBeenCalledWith(query, undefined);
		expect(getLicenseEntitlements).not.toHaveBeenCalled();

		expect(result).toStrictEqual({
			ai_openai_api_key: 'openai-key',
		});
	});
});
