import { useEnv } from '@directus/env';
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
import { deepMapWithSchema, getRelationInfo } from '@directus/utils';
import { cloneDeep, pick, uniq } from 'lodash-es';
import type { ItemsService as ItemsServiceType } from '../../services/index.js';
import { transaction } from '../transaction.js';
import { splitRecursive } from './split-recursive.js';

export type VersionMeta = {
	version_id: string;
	delta: Item;
	error?: Error;
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

	const itemlessErrors: VersionMeta[] = [];
	const itemMeta: Record<string, VersionMeta> = {};

	if (key && versions.length === 0) {
		throw new ForbiddenError();
	}

	await transaction(self.knex, async (trx) => {
		for (const version of versions) {
			const { id, item } = version;
			let delta = version.delta;

			if (!delta && item) {
				itemMeta[item] = {
					version_id: id,
					delta: {},
				};

				continue;
			}

			delta = delta ?? {};

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

					if (!item) {
						try {
							const item = await itemsServiceAdmin.createOne(rawDelta, {
								emitEvents: false,
								autoPurgeCache: false,
								skipTracking: true,
								overwriteDefaults: defaultOverwrites as any,
								onItemCreate: (collection, pk) => {
									if (collection in createdIDs === false) createdIDs[collection] = [];

									createdIDs[collection]!.push(pk);
								},
							});

							itemMeta[item] = {
								version_id: id,
								delta,
							};
						} catch (error: any) {
							trx_inner.rollback(error);

							itemlessErrors.push({
								error: error,
								version_id: id,
								delta,
							});
						}
					} else {
						try {
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

							itemMeta[item] = {
								version_id: id,
								delta,
							};
						} catch (error: any) {
							trx_inner.rollback(error);

							itemMeta[item] = {
								error: error,
								version_id: id,
								delta,
							};
						}
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

		const ids = uniq([
			...(createdIDs[self.collection] ?? []),
			...versions.map((version) => version.item).filter(Boolean),
		]) as PrimaryKey[];

		query.filter = {
			_and: [
				...(query.filter ? [query.filter] : []),
				{
					id: { _in: ids },
				} as Filter,
			],
		};

		results = await itemsServiceUser.readByQuery(query, { ...opts, stripNonRequested: false });

		await trx.rollback();
	});

	const primaryKeyField = self.schema.collections[self.collection]!.primary;

	const nonRelationFields = Object.values(self.schema.collections[self.collection]!.fields)
		.filter((field) => {
			const relationInfo = getRelationInfo(self.schema.relations, self.collection, field.field);
			return relationInfo.relationType === null;
		})
		.map((field) => field.field);

	results = results.map((result) => {
		const id = result[primaryKeyField];
		const meta = itemMeta[id];

		result = deepMapWithSchema(
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

		if (meta) {
			result['$meta'] = meta;

			if (meta.error) {
				Object.assign(result, pick(meta.delta, nonRelationFields));
			}
		}

		return result;
	});

	const env = useEnv();

	if (results.length < (query.limit ?? Number(env['QUERY_LIMIT_DEFAULT']))) {
		results.push(
			...itemlessErrors.map((errorMeta) => {
				const item = { $meta: errorMeta };

				if (errorMeta.error) {
					Object.assign(item, pick(errorMeta.delta, nonRelationFields));
				}

				return item;
			}),
		);
	}

	return results;
}
