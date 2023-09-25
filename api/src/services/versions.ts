import { Action } from '@directus/constants';
import type { Item, PrimaryKey, Query, Version } from '@directus/types';
import Joi from 'joi';
import { assign, pick } from 'lodash-es';
import objectHash from 'object-hash';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import { InvalidPayloadError, UnprocessableContentError } from '../errors/index.js';
import type { AbstractServiceOptions, MutationOptions } from '../types/index.js';
import { ActivityService } from './activity.js';
import { AuthorizationService } from './authorization.js';
import { CollectionsService } from './collections.js';
import { ItemsService } from './items.js';
import { PayloadService } from './payload.js';
import { RevisionsService } from './revisions.js';

const versionUpdateSchema = Joi.object({
	name: Joi.string(),
});

export class VersionsService extends ItemsService {
	authorizationService: AuthorizationService;
	collectionsService: CollectionsService;

	constructor(options: AbstractServiceOptions) {
		super('directus_versions', options);

		this.authorizationService = new AuthorizationService({
			accountability: this.accountability,
			knex: this.knex,
			schema: this.schema,
		});

		this.collectionsService = new CollectionsService({
			accountability: this.accountability,
			knex: this.knex,
			schema: this.schema,
		});
	}

	private async validateCreateData(data: Partial<Item>): Promise<void> {
		if (!data['name']) throw new InvalidPayloadError({ reason: `"name" is required` });

		// Reserves the "main" version name for the version query parameter
		if (data['name'] === 'main') throw new InvalidPayloadError({ reason: `"main" is a reserved version name` });

		if (!data['collection']) {
			throw new InvalidPayloadError({ reason: `"collection" is required` });
		}

		if (!data['item']) throw new InvalidPayloadError({ reason: `"item" is required` });

		// will throw an error if the collection does not exist or the accountability does not have permission to read it
		const existingCollection = await this.collectionsService.readOne(data['collection']);

		if (!existingCollection.meta?.versioning) {
			throw new UnprocessableContentError({
				reason: `Versioning feature is not enabled for collection "${data['collection']}"`,
			});
		}

		const existingVersions = await super.readByQuery({
			fields: ['name', 'collection', 'item'],
			filter: { name: { _eq: data['name'] }, collection: { _eq: data['collection'] }, item: { _eq: data['item'] } },
		});

		if (existingVersions.length > 0) {
			throw new UnprocessableContentError({
				reason: `Version "${data['name']}" already exists for item "${data['item']}" in collection "${data['collection']}"`,
			});
		}

		// will throw an error if the accountability does not have permission to read the item
		await this.authorizationService.checkAccess('read', data['collection'], data['item']);
	}

	private async validateUpdateData(data: Partial<Item>): Promise<void> {
		// Only allow updates on "name" field
		const { error } = versionUpdateSchema.validate(data);
		if (error) throw new InvalidPayloadError({ reason: error.message });

		// Reserves the "main" version name for the version query parameter
		if ('name' in data && data['name'] === 'main') {
			throw new InvalidPayloadError({ reason: `"main" is a reserved version name` });
		}
	}

	async getMainItem(collection: string, item: PrimaryKey, query?: Query): Promise<Item> {
		// will throw an error if the accountability does not have permission to read the item
		await this.authorizationService.checkAccess('read', collection, item);

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
		hash: string
	): Promise<{ outdated: boolean; mainHash: string }> {
		const mainItem = await this.getMainItem(collection, item);

		const mainHash = objectHash(mainItem);

		return { outdated: hash !== mainHash, mainHash };
	}

	async getVersionSaves(key: PrimaryKey): Promise<Partial<Item>[]> {
		const revisionsService = new RevisionsService({
			knex: this.knex,
			schema: this.schema,
		});

		const result = await revisionsService.readByQuery({
			filter: { version: { _eq: key } },
		});

		return result.map((revision) => revision['delta']);
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		await this.validateCreateData(data);

		const mainItem = await this.getMainItem(data['collection'], data['item']);

		data['key'] = data['name'];
		data['hash'] = objectHash(mainItem);

		return super.createOne(data, opts);
	}

	override async createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		if (!Array.isArray(data)) {
			throw new InvalidPayloadError({ reason: 'Input should be an array of items' });
		}

		for (const item of data) {
			await this.validateCreateData(item);

			const mainItem = await this.getMainItem(item['collection'], item['item']);

			item['hash'] = objectHash(mainItem);
		}

		return super.createMany(data, opts);
	}

	override async updateBatch(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		if (!Array.isArray(data)) {
			throw new InvalidPayloadError({ reason: 'Input should be an array of items' });
		}

		for (const item of data) {
			await this.validateUpdateData(item);
		}

		return super.updateBatch(data, opts);
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		await this.validateUpdateData(data);

		return super.updateMany(keys, data, opts);
	}

	override async updateByQuery(query: Query, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		await this.validateUpdateData(data);

		return super.updateByQuery(query, data, opts);
	}

	async save(key: PrimaryKey, data: Partial<Item>) {
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

		const activity = await activityService.createOne({
			action: Action.VERSION_SAVE,
			user: this.accountability?.user ?? null,
			collection: version['collection'],
			ip: this.accountability?.ip ?? null,
			user_agent: this.accountability?.userAgent ?? null,
			origin: this.accountability?.origin ?? null,
			item: version['item'],
		});

		const revisionDelta = await payloadService.prepareDelta(data);

		await revisionsService.createOne({
			activity,
			version: key,
			collection: version['collection'],
			item: version['item'],
			data: revisionDelta,
			delta: revisionDelta,
		});

		return data;
	}

	async promote(version: PrimaryKey, mainHash: string, fields?: string[]) {
		const { id, collection, item } = (await this.readOne(version)) as Version;

		// will throw an error if the accountability does not have permission to update the item
		await this.authorizationService.checkAccess('update', collection, item);

		const { outdated } = await this.verifyHash(collection, item, mainHash);

		if (outdated) {
			throw new UnprocessableContentError({
				reason: `Main item has changed since this version was last updated`,
			});
		}

		const saves = await this.getVersionSaves(id);

		const versionResult = assign({}, ...saves);

		const payloadToUpdate = fields ? pick(versionResult, fields) : versionResult;

		const itemsService = new ItemsService(collection, {
			accountability: this.accountability,
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
				database: getDatabase(),
				schema: this.schema,
				accountability: this.accountability,
			}
		);

		const updatedItemKey = await itemsService.updateOne(item, payloadAfterHooks);

		emitter.emitAction(
			['items.promote', `${collection}.items.promote`],
			{
				payload: payloadAfterHooks,
				collection,
				item: updatedItemKey,
				version,
			},
			{
				database: getDatabase(),
				schema: this.schema,
				accountability: this.accountability,
			}
		);

		return updatedItemKey;
	}
}
