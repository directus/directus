import { ForbiddenError } from '@directus/errors';
import type { Accountability, Item, PrimaryKey, Query, QueryOptions } from '@directus/types';
import type { ItemsService as ItemsServiceType } from '../../services/index.js';
import { transaction } from '../transaction.js';
import { deepMapWithSchema } from './deep-map-with-schema.js';
import { splitRecursive } from './split-recursive.js';

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

		const version = await versionsService.getVersionSave(queryWithKey.version!, self.collection, key as string);

		return Object.assign(originalData[0]!, version?.delta);
	}

	let result: Item | undefined;

	const versionsService = new VersionsService({
		schema: self.schema,
		accountability: self.accountability,
		knex: self.knex,
	});

	const createdIDs: Record<string, PrimaryKey[]> = {};
	const version = await versionsService.getVersionSave(queryWithKey.version!, self.collection, key as string, false);

	if (!version) {
		throw new ForbiddenError();
	}

	const { delta } = version;

	await transaction(self.knex, async (trx) => {
		const itemsServiceAdmin = new ItemsService<Item>(self.collection, {
			schema: self.schema,
			accountability: {
				admin: true,
			} as Accountability,
			knex: trx,
		});

		if (delta) {
			const { rawDelta, defaultOverwrites } = splitRecursive(delta);

			await itemsServiceAdmin.updateOne(key, rawDelta, {
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

		const itemsServiceUser = new ItemsService<Item>(self.collection, {
			schema: self.schema,
			accountability: self.accountability,
			knex: trx,
		});

		result = (await itemsServiceUser.readByQuery(queryWithKey, opts))[0];

		await trx.rollback();
	});

	if (!result) {
		throw new ForbiddenError();
	}

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
}
