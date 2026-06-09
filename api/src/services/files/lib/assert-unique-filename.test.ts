import { ForbiddenError } from '@directus/errors';
import { afterEach, describe, expect, test } from 'vitest';
import { createMockKnex, resetKnexMocks } from '../../../test-utils/knex.js';
import { assertUniqueFilename } from './assert-unique-filename.js';

describe('assertUniqueFilename', () => {
	const { db, tracker, mockSchemaBuilder } = createMockKnex();

	afterEach(() => {
		resetKnexMocks(tracker, mockSchemaBuilder);
	});

	test('throws ForbiddenError when filename_disk is already used', async () => {
		tracker.on
			.select('select "filename_disk" from "directus_files" where "filename_disk" = ?')
			.response([{ filename_disk: 'dup.jpg' }]);

		await expect(assertUniqueFilename(db, 'dup.jpg')).rejects.toBeInstanceOf(ForbiddenError);
	});

	test('resolves when filename_disk is unique', async () => {
		tracker.on.select('select "filename_disk" from "directus_files" where "filename_disk" = ?').response([]);

		await expect(assertUniqueFilename(db, 'unique.jpg')).resolves.toBeUndefined();
	});

	test('excludes the given id so a record can keep its own filename_disk', async () => {
		tracker.on
			.select('select "filename_disk" from "directus_files" where "filename_disk" = ? and not "id" = ?')
			.response([]);

		await expect(assertUniqueFilename(db, 'same.jpg', 'file-1')).resolves.toBeUndefined();
	});
});
