import { Action } from '@directus/constants';
import { ForbiddenError, InvalidPayloadError, UnprocessableContentError } from '@directus/errors';
import type {
	AbstractServiceOptions,
	ContentVersion,
	Item,
	MutationOptions,
	PrimaryKey,
	Query,
	QueryOptions,
} from '@directus/types';
import { deepMapWithSchema } from '@directus/utils';
import Joi from 'joi';
import { assign, get, isEqual, isPlainObject, pick } from 'lodash-es';
import objectHash from 'object-hash';
import { getCache } from '../cache.js';
import { getHelpers } from '../database/helpers/index.js';
import emitter from '../emitter.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { shouldClearCache } from '../utils/should-clear-cache.js';
import { splitRecursive } from '../utils/versioning/split-recursive.js';
import { ActivityService } from './activity.js';
import { ItemsService } from './items.js';
import { PayloadService } from './payload.js';
import { RevisionsService } from './revisions.js';

export class VersionsService extends ItemsService<ContentVersion> {
	constructor(options: AbstractServiceOptions) {
		super('directus_versions', options);
	}

	private async validateCreateData(data: Partial<Item>): Promise<void> {
		const versionCreateSchema = Joi.object({
			key: Joi.string().required(),
			name: Joi.string().allow(null),
			collection: Joi.string().required(),
			item: Joi.string().allow(null).required(),
		});

		const { error } = versionCreateSchema.validate(data);
		if (error) throw new InvalidPayloadError({ reason: error.message });

		// Reserves the "main" version key for the version query parameter
		if (data['key'] === 'main') throw new InvalidPayloadError({ reason: `"main" is a reserved version key` });

		if (this.accountability) {
			try {
				await validateAccess(
					{
						accountability: this.accountability,
						action: 'read',
						collection: data['collection'],
						primaryKeys: [data['item']],
					},
					{
						schema: this.schema,
						knex: this.knex,
					},
				);
			} catch {
				throw new ForbiddenError();
			}
		}

		const { CollectionsService } = await import('./collections.js');

		const collectionsService = new CollectionsService({
			knex: this.knex,
			schema: this.schema,
		});

		const existingCollection = await collectionsService.readOne(data['collection']);

		if (!existingCollection.meta?.versioning) {
			throw new UnprocessableContentError({
				reason: `Content Versioning is not enabled for collection "${data['collection']}"`,
			});
		}

		const sudoService = new VersionsService({
			knex: this.knex,
			schema: this.schema,
		});

		const existingVersions = (await sudoService.readByQuery({
			aggregate: { count: ['*'] },
			filter: { key: { _eq: data['key'] }, collection: { _eq: data['collection'] }, item: { _eq: data['item'] } },
		})) as any[];

		if (existingVersions[0]['count'] > 0) {
			throw new UnprocessableContentError({
				reason: `Version "${data['key']}" already exists for item "${data['item']}" in collection "${data['collection']}"`,
			});
		}
	}

	async getMainItem(collection: string, item: PrimaryKey, query?: Query): Promise<Item> {
		const itemsService = new ItemsService(collection, {
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		return await itemsService.readOne(item, query);
	}

	async verifyHash(
		collection: string,
		item: PrimaryKey,
		hash: string,
	): Promise<{ outdated: boolean; mainHash: string }> {
		const mainItem = await this.getMainItem(collection, item);

		const mainHash = objectHash(mainItem);

		return { outdated: hash !== mainHash, mainHash };
	}

	async getVersionSaves(key: string, collection: string, item: PrimaryKey | null, mapDelta = true) {
		let versions = await this.readByQuery({
			filter: {
				key: { _eq: key },
				collection: { _eq: collection },
				...(item ? { item: { _eq: item } } : {}),
			},
			limit: -1,
		});

		versions = versions.map((version) => {
			if (mapDelta && version.delta) version.delta = this.mapDelta(version);
			return version;
		});

		return versions;
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		await this.validateCreateData(data);

		const mainItem = await this.getMainItem(data['collection'], data['item']);

		data['hash'] = objectHash(mainItem);

		return super.createOne(data, opts);
	}

	override async readOne(key: PrimaryKey, query: Query = {}, opts?: QueryOptions): Promise<ContentVersion> {
		const version = await super.readOne(key, query, opts);

		if (version?.delta) version.delta = this.mapDelta(version);

		return version;
	}

	override async createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		if (!Array.isArray(data)) {
			throw new InvalidPayloadError({ reason: 'Input should be an array of items' });
		}

		const keyCombos = new Set();

		for (const item of data) {
			const keyCombo = `${item['key']}-${item['collection']}-${item['item']}`;

			if (keyCombos.has(keyCombo)) {
				throw new UnprocessableContentError({
					reason: `Cannot create multiple versions on "${item['item']}" in collection "${item['collection']}" with the same key "${item['key']}"`,
				});
			}

			keyCombos.add(keyCombo);
		}

		return super.createMany(data, opts);
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		// Only allow updates on "key" and "name" fields
		const versionUpdateSchema = Joi.object({
			key: Joi.string(),
			name: Joi.string().allow(null),
		});

		const { error } = versionUpdateSchema.validate(data);
		if (error) throw new InvalidPayloadError({ reason: error.message });

		if ('key' in data) {
			// Reserves the "main" version key for the version query parameter
			if (data['key'] === 'main') throw new InvalidPayloadError({ reason: `"main" is a reserved version key` });

			const keyCombos = new Set();

			for (const pk of keys) {
				const { collection, item } = await this.readOne(pk, { fields: ['collection', 'item'] });

				const keyCombo = `${data['key']}-${collection}-${item}`;

				if (keyCombos.has(keyCombo)) {
					throw new UnprocessableContentError({
						reason: `Cannot update multiple versions on "${item}" in collection "${collection}" to the same key "${data['key']}"`,
					});
				}

				keyCombos.add(keyCombo);

				const existingVersions = await super.readByQuery({
					aggregate: { count: ['*'] },
					filter: { id: { _neq: pk }, key: { _eq: data['key'] }, collection: { _eq: collection }, item: { _eq: item } },
				});

				if ((existingVersions as any)[0]['count'] > 0) {
					throw new UnprocessableContentError({
						reason: `Version "${data['key']}" already exists for item "${item}" in collection "${collection}"`,
					});
				}
			}
		}

		return super.updateMany(keys, data, opts);
	}

	async save(key: PrimaryKey, delta: Partial<Item>): Promise<Partial<Item>> {
		const version = await super.readOne(key);

		const payloadService = new PayloadService(this.collection, {
			accountability: this.accountability,
			knex: this.knex,
			schema: this.schema,
		});

		const activityService = new ActivityService({
			knex: this.knex,
			schema: this.schema,
		});

		const revisionsService = new RevisionsService({
			knex: this.knex,
			schema: this.schema,
		});

		const { item, collection, delta: existingDelta } = version;

		const activity = await activityService.createOne({
			action: Action.VERSION_SAVE,
			user: this.accountability?.user ?? null,
			collection,
			ip: this.accountability?.ip ?? null,
			user_agent: this.accountability?.userAgent ?? null,
			origin: this.accountability?.origin ?? null,
			item,
		});

		const helpers = getHelpers(this.knex);

		let revisionDelta = await payloadService.prepareDelta(delta);

		await revisionsService.createOne({
			activity,
			version: key,
			collection,
			item,
			data: revisionDelta,
			delta: revisionDelta,
		});

		revisionDelta = revisionDelta ? JSON.parse(revisionDelta) : null;

		const date = new Date(helpers.date.writeTimestamp(new Date().toISOString()));

		deepMapObjects(revisionDelta, (object, path) => {
			const existing = get(existingDelta, path);

			if (existing && isEqual(existing, object)) return;

			object['_user'] = this.accountability?.user;
			object['_date'] = date;
		});

		const finalVersionDelta = assign({}, existingDelta, revisionDelta);

		const sudoService = new ItemsService(this.collection, {
			knex: this.knex,
			schema: this.schema,
			accountability: {
				...this.accountability!,
				admin: true,
			},
		});

		await sudoService.updateOne(key, { delta: finalVersionDelta });

		const { cache } = getCache();

		if (shouldClearCache(cache, undefined, collection)) {
			cache.clear();
		}

		return finalVersionDelta;
	}

	async promote(version: PrimaryKey, mainHash: string, fields?: string[]) {
		const { collection, item, delta } = (await super.readOne(version)) as ContentVersion;

		// will throw an error if the accountability does not have permission to create/update the item
		if (this.accountability) {
			await validateAccess(
				item
					? {
							accountability: this.accountability,
							action: 'update',
							collection,
							primaryKeys: [item],
						}
					: {
							accountability: this.accountability,
							action: 'create',
							collection,
						},
				{
					schema: this.schema,
					knex: this.knex,
				},
			);
		}

		if (!delta) {
			throw new UnprocessableContentError({
				reason: `No changes to promote`,
			});
		}

		if (item) {
			const { outdated } = await this.verifyHash(collection, item, mainHash);

			if (outdated) {
				throw new UnprocessableContentError({
					reason: `Main item has changed since this version was last updated`,
				});
			}
		}

		const { rawDelta, defaultOverwrites } = splitRecursive(delta);

		const payloadToUpdate = fields ? pick(rawDelta, fields) : rawDelta;

		const itemsService = new ItemsService(collection, {
			accountability: this.accountability,
			knex: this.knex,
			schema: this.schema,
		});

		const payloadAfterHooks = await emitter.emitFilter(
			['items.promote', `${collection}.items.promote`],
			payloadToUpdate,
			{
				collection,
				item,
				version,
			},
			{
				database: this.knex,
				schema: this.schema,
				accountability: this.accountability,
			},
		);

		let updatedItemKey;

		if (item) {
			updatedItemKey = await itemsService.updateOne(item, payloadAfterHooks, {
				overwriteDefaults: defaultOverwrites as any,
			});
		} else {
			updatedItemKey = await itemsService.createOne(payloadAfterHooks, {
				overwriteDefaults: defaultOverwrites as any,
			});
		}

		emitter.emitAction(
			['items.promote', `${collection}.items.promote`],
			{
				payload: payloadAfterHooks,
				collection,
				item: updatedItemKey,
				version,
			},
			{
				database: this.knex,
				schema: this.schema,
				accountability: this.accountability,
			},
		);

		return updatedItemKey;
	}

	private mapDelta(version: ContentVersion) {
		const delta = version.delta ?? {};
		delta[this.schema.collections[version.collection]!.primary] = version.item;

		return deepMapWithSchema(
			delta,
			([key, value], context) => {
				if (key === '_user' || key === '_date') return;

				if (context.collection.primary in context.object) {
					if (context.field.special.includes('user-updated')) {
						return [key, context.object['_user']];
					}

					if (context.field.special.includes('date-updated')) {
						return [key, context.object['_date']];
					}
				} else {
					if (context.field.special.includes('user-created')) {
						return [key, context.object['_user']];
					}

					if (context.field.special.includes('date-created')) {
						return [key, context.object['_date']];
					}
				}

				if (key in context.object) return [key, value];

				return undefined;
			},
			{ collection: version.collection, schema: this.schema },
			{ mapNonExistentFields: true, detailedUpdateSyntax: true },
		);
	}
}

/** Deeply maps all objects of a structure. Only calls the callback for objects, not for arrays. Objects in arrays will continued to be mapped. */
function deepMapObjects(
	object: unknown,
	fn: (object: Record<string, any>, path: string[]) => void,
	path: string[] = [],
) {
	if (isPlainObject(object) && typeof object === 'object' && object !== null) {
		fn(object, path);
		Object.entries(object).map(([key, value]) => deepMapObjects(value, fn, [...path, key]));
	} else if (Array.isArray(object)) {
		object.map((value, index) => deepMapObjects(value, fn, [...path, String(index)]));
	}
}
