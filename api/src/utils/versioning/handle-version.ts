import { transaction } from '../transaction.js';
import { ItemsService, type QueryOptions } from '../../services/index.js';
import type { Item, PrimaryKey, Query } from '@directus/types';
import { deepMapResponse } from '../deep-map-response.js';
import { intersection } from 'lodash-es';
import { GENERATE_SPECIAL } from '../../constants.js';
import { ForbiddenError } from '@directus/errors';
import { mergeVersionsRaw } from './merge-version-data.js';

export async function handleVersion(self: ItemsService, key: PrimaryKey, queryWithKey: Query, opts?: QueryOptions) {
	const { VersionsService } = await import('../../services/versions.js');

	if (queryWithKey.versionRaw) {
		const originalData = await self.readByQuery(queryWithKey, opts);

		if (originalData.length === 0) {
			throw new ForbiddenError();
		}

		const versionsService = new VersionsService({
			schema: self.schema,
			accountability: self.accountability,
			knex: self.knex,
		});

		const versionData = await versionsService.getVersionSaves(queryWithKey.version!, self.collection, key as string);

		if (!versionData || versionData.length === 0) return [];

		return [mergeVersionsRaw(originalData, versionData)];
	}

	let results: Item[] = [];

	await transaction(self.knex, async (trx) => {
		const versionsService = new VersionsService({
			schema: self.schema,
			accountability: self.accountability,
			knex: trx,
		});

		const versionData = await versionsService.getVersionSaves(queryWithKey.version!, self.collection, key as string);

		const itemsService = new ItemsService<Item>(self.collection, {
			schema: self.schema,
			accountability: self.accountability,
			knex: trx,
		});

		let counter = 0;
		const createdIDs: Record<string, [PrimaryKey, number][]> = {};

		for (const data of versionData ?? []) {
			await itemsService.updateOne(key, data as any, {
				emitEvents: false,
				autoPurgeCache: false,
				bypassAccountability: true,

				onItemCreate: (collection, pk) => {
					if (collection in createdIDs === false) createdIDs[collection] = [];

					createdIDs[collection]!.push([pk, counter++]);
				},
			});
		}

		results = await itemsService.readByQuery(queryWithKey, opts);

		results = results.map((result) => {
			return deepMapResponse(
				result,
				([key, value], context) => {
					if (context.field.field === context.collection.primary) {
						const ids = createdIDs[context.collection.collection];
						const match = ids?.find((id) => id[0] === value);

						if (match) {
							return [key, null];
						}
					} else if (context.relationType === 'm2o' || context.relationType === 'a2o') {
						const ids = createdIDs[context.relation!.related_collection!];
						const match = ids?.find((id) => id[0] === value);

						if (match) {
							return [key, null];
						}
					} else if (context.relationType === 'o2m' && Array.isArray(value)) {
						const ids = createdIDs[context.relation!.collection];
						return [
							key,
							value.map((val) => {
								const match = ids?.find((id) => id[0] === val);

								if (match) {
									return null;
								}

								return val;
							}),
						];
					}

					if (context.field.defaultValue || intersection(GENERATE_SPECIAL, context.field.special).length > 0) {
						return [key, null];
					}

					return [key, value];
				},
				{ collection: self.collection, schema: self.schema },
			);
		});

		await trx.rollback();
	});

	return results;
}
