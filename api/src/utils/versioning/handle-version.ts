import { ForbiddenError } from '@directus/errors';
import type { Accountability, Item, PrimaryKey, Query, QueryOptions } from '@directus/types';
import type { ItemsService as ItemsServiceType } from '../../services/index.js';
import { deepMapResponse } from '../deep-map-response.js';
import { transaction } from '../transaction.js';
import { mergeVersionsRaw } from './merge-version-data.js';

export async function handleVersion(self: ItemsServiceType, key: PrimaryKey, queryWithKey: Query, opts?: QueryOptions) {
	const { VersionsService } = await import('../../services/versions.js');
	const { ItemsService } = await import('../../services/items.js');

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

		if (!versionData || versionData.length === 0) return [originalData[0]];

		return [mergeVersionsRaw(originalData[0]!, versionData)];
	}

	let results: Item[] = [];

	const versionsService = new VersionsService({
		schema: self.schema,
		accountability: self.accountability,
		knex: self.knex,
	});

	const createdIDs: Record<string, PrimaryKey[]> = {};
	const versionData = await versionsService.getVersionSaves(queryWithKey.version!, self.collection, key as string);

	await transaction(self.knex, async (trx) => {
		const itemsServiceAdmin = new ItemsService<Item>(self.collection, {
			schema: self.schema,
			accountability: {
				admin: true,
			} as Accountability,
			knex: trx,
		});

		await Promise.all(
			(versionData ?? []).map((data) => {
				return itemsServiceAdmin.updateOne(key, data as any, {
					emitEvents: false,
					autoPurgeCache: false,
					skipTracking: true,

					onItemCreate: (collection, pk) => {
						if (collection in createdIDs === false) createdIDs[collection] = [];

						createdIDs[collection]!.push(pk);
					},
				});
			}),
		);

		const itemsServiceUser = new ItemsService<Item>(self.collection, {
			schema: self.schema,
			accountability: self.accountability,
			knex: trx,
		});

		results = await itemsServiceUser.readByQuery(queryWithKey, opts);

		await trx.rollback();
	});

	results = results.map((result) => {
		return deepMapResponse(
			result,
			([key, value], context) => {
				if (context.relationType === 'm2o' || context.relationType === 'a2o') {
					const ids = createdIDs[context.relation!.related_collection!];
					const match = ids?.find((id) => String(id) === String(value));

					if (match) {
						return [key, null];
					}
				} else if (context.relationType === 'o2m' && Array.isArray(value)) {
					const ids = createdIDs[context.relation!.collection];
					return [
						key,
						value.map((val) => {
							const match = ids?.find((id) => String(id) === String(val));

							if (match) {
								return null;
							}

							return val;
						}),
					];
				}

				if (context.field.field === context.collection.primary) {
					const ids = createdIDs[context.collection.collection];
					const match = ids?.find((id) => String(id) === String(value));

					if (match) {
						return [key, null];
					}
				}

				return [key, value];
			},
			{ collection: self.collection, schema: self.schema },
		);
	});

	return results;
}
