import { InvalidPayloadError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMockKnex, resetKnexMocks } from '../test-utils/knex.js';
import { ItemsService } from './items.js';
import { TranslationsService } from './translations.js';

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
		describe('createOne', () => {
			test('rejects a key and language combination that already exists', async () => {
				tracker.on.select('directus_translations').response([{ id: 'row-1' }]);

				const service = new TranslationsService({ knex: db, schema });

				await expect(service.createOne({ key: 'greeting', language: 'en-US', value: 'Hello' })).rejects.toThrow(
					InvalidPayloadError,
				);

				expect(ItemsService.prototype.createOne).not.toHaveBeenCalled();
			});

			test('allows a key and language combination that is still free', async () => {
				tracker.on.select('directus_translations').response([]);

				const service = new TranslationsService({ knex: db, schema });

				await expect(service.createOne({ key: 'greeting', language: 'en-US', value: 'Hello' })).resolves.not.toThrow();

				expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(
					{ key: 'greeting', language: 'en-US', value: 'Hello' },
					undefined,
				);
			});
		});

		describe('updateMany', () => {
			test("allows a single-row update that resends the row's own key and language", async () => {
				vi.mocked(ItemsService.prototype.readMany).mockResolvedValueOnce([
					{ id: 'row-1', key: 'greeting', language: 'en-US' },
				]);

				// `row-1` is the only row holding (greeting, en-US), so an empty result can only mean the
				// uniqueness query excluded the row being updated. Without that exclusion the query does not
				// bind `row-1`, the row finds itself, and the update is rejected.
				tracker.on
					.select('directus_translations')
					.response((rawQuery) => (rawQuery.bindings.includes('row-1') ? [] : [{ id: 'row-1' }]));

				const service = new TranslationsService({ knex: db, schema });

				await expect(service.updateMany(['row-1'], { key: 'greeting', language: 'en-US' })).resolves.not.toThrow();

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

			test('rejects a bulk update that sets both key and language', async () => {
				const service = new TranslationsService({ knex: db, schema });

				await expect(service.updateMany(['row-1', 'row-2'], { key: 'greeting', language: 'en-US' })).rejects.toThrow(
					InvalidPayloadError,
				);

				// Every row would end up on the same combination, so this is rejected up front rather than
				// after reading the affected rows
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

			test('rejects a bulk update when a row other than the first collides with an untouched row', async () => {
				vi.mocked(ItemsService.prototype.readMany).mockResolvedValueOnce([
					{ id: 'row-1', key: 'hello', language: 'fr-FR' },
					{ id: 'row-2', key: 'goodbye', language: 'de-DE' },
				]);

				// (goodbye, en-US) is already taken by a row that is not part of this update, so only the
				// second row of the payload conflicts
				tracker.on
					.select('directus_translations')
					.response((rawQuery) => (rawQuery.bindings.includes('goodbye') ? [{ id: 'row-3' }] : []));

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

				await expect(service.updateMany(['row-1', 'row-2'], { language: 'en-US' })).resolves.not.toThrow();

				expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
					['row-1', 'row-2'],
					{ language: 'en-US' },
					undefined,
				);
			});

			test('skips the uniqueness check entirely when the payload touches neither key nor language', async () => {
				const service = new TranslationsService({ knex: db, schema });

				await expect(service.updateMany(['row-1', 'row-2'], { value: 'Hello' })).resolves.not.toThrow();

				expect(ItemsService.prototype.readMany).not.toHaveBeenCalled();
				expect(tracker.history.select).toHaveLength(0);

				expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
					['row-1', 'row-2'],
					{ value: 'Hello' },
					undefined,
				);
			});
		});
	});
});
