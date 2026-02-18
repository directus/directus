import { ForbiddenError } from '@directus/errors';
import {
	type Accountability,
	type Filter,
	type Item,
	NEW_VERSION,
	type PrimaryKey,
	type Query,
	type QueryOptions,
} from '@directus/types';
import { deepMapWithSchema } from '@directus/utils';
import { cloneDeep, uniq } from 'lodash-es';
import type { ItemsService as ItemsServiceType } from '../../services/index.js';
import { transaction } from '../transaction.js';
import { splitRecursive } from './split-recursive.js';

export type VersionError = {
	error: Error;
	item: PrimaryKey | null;
	version_id: string;
	delta: Item;
};

export async function handleVersion(
	self: ItemsServiceType,
	key: PrimaryKey | typeof NEW_VERSION | null,
	query: Query,
	opts?: QueryOptions,
) {
	const { VersionsService } = await import('../../services/versions.js');
	const { ItemsService } = await import('../../services/items.js');

	if (key && key !== NEW_VERSION && query.versionRaw) {
		delete query.version;
		delete query.versionRaw;

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

		return { errors: [], data: [Object.assign(originalData[0]!, versions?.[0]?.delta)] };
	}

	let results: Item[] = [];

	const versionsService = new VersionsService({
		schema: self.schema,
		accountability: self.accountability,
		knex: self.knex,
	});

	const createdIDs: Record<string, PrimaryKey[]> = {};
	const versions = await versionsService.getVersionSaves(query.version!, self.collection, key, false);
	const errors: VersionError[] = [];

	if (versions.length === 0) {
		throw new ForbiddenError();
	}

	await transaction(self.knex, async (trx) => {
		for (const { id, delta, item } of versions) {
			if (!delta) continue;

			const { rawDelta, defaultOverwrites } = splitRecursive(delta);

			try {
				await trx.transaction(async (trx_inner) => {
					const itemsServiceAdmin = new ItemsService<Item>(self.collection, {
						schema: self.schema,
						accountability: {
							admin: true,
						} as Accountability,
						knex: trx_inner,
					});

					try {
						if (!item) {
							await itemsServiceAdmin.createOne(rawDelta, {
								emitEvents: false,
								autoPurgeCache: false,
								skipTracking: true,
								overwriteDefaults: defaultOverwrites as any,
								onItemCreate: (collection, pk) => {
									if (collection in createdIDs === false) createdIDs[collection] = [];

									createdIDs[collection]!.push(pk);
								},
							});
						} else {
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
					} catch (error) {
						trx_inner.rollback(error as Error);

						errors.push({
							error: error as Error,
							item: item ?? null,
							version_id: id,
							delta,
						});
					}
				});
			} catch {
				// Ignore errors
			}
		}

		const itemsServiceUser = new ItemsService<Item>(self.collection, {
			schema: self.schema,
			accountability: self.accountability,
			knex: trx,
		});

		query = cloneDeep(query);
		delete query.version;

		if (query.showMain !== true || key === NEW_VERSION) {
			const ids = uniq(versions.map((version) => version.item ?? createdIDs[self.collection] ?? []).flat());

			query.filter = {
				_and: [
					...(query.filter ? [query.filter] : []),
					{
						id: { _in: ids },
					} as Filter,
				],
			};
		}

		delete query.showMain;

		results = await itemsServiceUser.readByQuery(query, opts);

		await trx.rollback();
	});

	results = results.map((result) => {
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

	return { errors, data: results };
}
