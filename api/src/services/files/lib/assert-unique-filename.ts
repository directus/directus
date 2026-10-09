import { ForbiddenError } from '@directus/errors';
import type { PrimaryKey } from '@directus/types';
import type { Knex } from 'knex';

/**
 * Assert whether a filename is unique
 *
 * @param knex - Database instance
 * @param filename - The filename to check
 * @param excludeId - Id of an existing file to exclude (e.g. the target of a replacement)
 * @throws ForbiddenError if a match is found
 *
 */
export async function assertUniqueFilename(knex: Knex, filename: string, excludeId?: PrimaryKey | null): Promise<void> {
	const query = knex.select('filename_disk').from('directus_files').where({ filename_disk: filename });

	if (excludeId) {
		query.whereNot('id', excludeId);
	}

	const existingFile = await query.first();

	if (existingFile) {
		throw new ForbiddenError();
	}
}
