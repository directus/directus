import { ForbiddenError } from '@directus/errors';
import type { Accountability, Item, PrimaryKey, Query, QueryOptions } from '@directus/types';
import { deepMapWithSchema } from '@directus/utils';
import { cloneDeep, uniq } from 'lodash-es';
import type { ItemsService as ItemsServiceType } from '../../services/index.js';
import { transaction } from '../transaction.js';
import { splitRecursive } from './split-recursive.js';

export async function handleVersion(self: ItemsServiceType, key: PrimaryKey | null, query: Query, opts?: QueryOptions) {
	const { VersionsService } = await import('../../services/versions.js');
	const { ItemsService } = await import('../../services/items.js');

	if (key && query.versionRaw) {
		const originalData = await self.readByQuery(query, opts);

		if (originalData.length === 0) {
			throw new ForbiddenError();
		}

		const versionsService = new VersionsService({
			schema: self.schema,
			accountability: self.accountability,
			knex: self.knex,
		});

		const versions = await versionsService.getVersionSaves(query.version!, self.collection, key);

		return [Object.assign(originalData[0]!, versions?.[0]?.delta)];
	}

	let results: Item[] = [];

	const versionsService = new VersionsService({
		schema: self.schema,
		accountability: self.accountability,
		knex: self.knex,
	});

	const createdIDs: Record<string, PrimaryKey[]> = {};
	const versions = await versionsService.getVersionSaves(query.version!, self.collection, key, false);

	if (versions.length === 0) {
		throw new ForbiddenError();
	}

	query = cloneDeep(query);
	delete query.version;

	if (query.showMain !== true) {
		query.filter = {
			_and: [
				...(query.filter ? [query.filter] : []),
				{
					id: { _in: uniq(versions.map((version) => version.item)) },
				},
			],
		};
	}

	delete query.showMain;

	await transaction(self.knex, async (trx) => {
		const itemsServiceAdmin = new ItemsService<Item>(self.collection, {
			schema: self.schema,
			accountability: {
				admin: true,
			} as Accountability,
			knex: trx,
		});

		for (const { delta, item } of versions) {
			if (delta) {
				const { rawDelta, defaultOverwrites } = splitRecursive(delta);

				await itemsServiceAdmin.updateOne(item, rawDelta, {
					emitEvents: false,
					autoPurgeCache: false,
					skipTracking: true,
					overwriteDefaults: defaultOverwrites as any,
					onItemCreate: (collection, pk) => {
						if (collection in createdIDs === false) createdIDs[collection] = [];

						createdIDs[collection]!.push(pk);
					},
				});
			}
		}

		const itemsServiceUser = new ItemsService<Item>(self.collection, {
			schema: self.schema,
			accountability: self.accountability,
			knex: trx,
		});

		results = await itemsServiceUser.readByQuery(query, opts);

		await trx.rollback();
	});

	return results.map((result) => {
		return deepMapWithSchema(
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
}
