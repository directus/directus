import { InvalidPayloadError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMockKnex, resetKnexMocks } from '../test-utils/knex.js';
import { ItemsService } from './items.js';
import { TranslationsService } from './translations.js';

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../test-utils/env.js');
	return mockEnv();
});

vi.mock('../../src/database/index', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase();
});

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

const schema = new SchemaBuilder().build();

describe('Integration Tests', () => {
	const { db, tracker, mockSchemaBuilder } = createMockKnex();

	afterEach(() => {
		resetKnexMocks(tracker, mockSchemaBuilder);
	});

	describe('Services / Translations', () => {
		describe('updateMany', () => {
			test("allows a single-row update that resends the row's own key and language", async () => {
				vi.mocked(ItemsService.prototype.readMany).mockResolvedValueOnce([
					{ id: 'row-1', key: 'greeting', language: 'en-US' },
				]);

				tracker.on
					.select('directus_translations')
					.response((rawQuery) => (rawQuery.bindings.includes('row-1') ? [] : [{ id: 'row-1' }]));

				const service = new TranslationsService({ knex: db, schema });

				await expect(service.updateMany(['row-1'], { key: 'greeting', language: 'en-US' })).resolves.toEqual([1]);

				expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
					['row-1'],
					{ key: 'greeting', language: 'en-US' },
					undefined,
				);
			});

			test('still rejects updating a row to a key and language that already exists on another row', async () => {
				vi.mocked(ItemsService.prototype.readMany).mockResolvedValueOnce([
					{ id: 'row-1', key: 'greeting', language: 'en-US' },
				]);

				tracker.on.select('directus_translations').response([{ id: 'row-2' }]);

				const service = new TranslationsService({ knex: db, schema });

				await expect(service.updateMany(['row-1'], { key: 'salutation', language: 'en-US' })).rejects.toThrow(
					InvalidPayloadError,
				);

				expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
			});

			test('rejects a bulk update that sets both key and language without reading from the database', async () => {
				const service = new TranslationsService({ knex: db, schema });

				await expect(service.updateMany(['row-1', 'row-2'], { key: 'greeting', language: 'en-US' })).rejects.toThrow(
					InvalidPayloadError,
				);

				expect(ItemsService.prototype.readMany).not.toHaveBeenCalled();
				expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
			});

			test('rejects a payload that makes two updated rows collide with each other', async () => {
				vi.mocked(ItemsService.prototype.readMany).mockResolvedValueOnce([
					{ id: 'row-1', key: 'greeting', language: 'fr-FR' },
					{ id: 'row-2', key: 'greeting', language: 'en-US' },
				]);

				tracker.on.select('directus_translations').response([]);

				const service = new TranslationsService({ knex: db, schema });

				await expect(service.updateMany(['row-1', 'row-2'], { language: 'en-US' })).rejects.toThrow(
					InvalidPayloadError,
				);

				expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
			});

			test('allows a bulk update changing only the language when the rows stay unique', async () => {
				vi.mocked(ItemsService.prototype.readMany).mockResolvedValueOnce([
					{ id: 'row-1', key: 'hello', language: 'fr-FR' },
					{ id: 'row-2', key: 'goodbye', language: 'de-DE' },
				]);

				tracker.on.select('directus_translations').response([]);

				const service = new TranslationsService({ knex: db, schema });

				await expect(service.updateMany(['row-1', 'row-2'], { language: 'en-US' })).resolves.toEqual([1]);

				expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
					['row-1', 'row-2'],
					{ language: 'en-US' },
					undefined,
				);
			});
		});
	});
});
