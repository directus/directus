import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type {
	AbstractServiceOptions,
	Accountability,
	FieldOverview,
	Item,
	PermissionsAction,
	PrimaryKey,
	Relation,
	SchemaOverview,
} from '@directus/types';
import type { Knex } from 'knex';
import { isEqual, isPlainObject, pick } from 'lodash-es';
import getDatabase, { getDatabaseClient } from '../database/index.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { transaction } from '../utils/transaction.js';
import { validateLinkAccess } from '../versioning/link-access.js';
import { ItemsService } from './items.js';
import { PayloadService } from './payload.js';
import {
	getLinkTableName,
	getShadowTableName,
	getVersionReferenceField,
	isShadowTable,
	isVersionedCollection,
	VERSION_META_FIELDS,
} from './version-tables/constants.js';

export type VersionMeta = {
	id: number | null;
	name: string | null;
	type: 'draft' | 'published' | 'archived';
	date_created: string | null;
	date_updated: string | null;
	user_created: string | null;
	user_updated: string | null;
};

export type VersionPayload = Item & { directus_version?: Partial<Pick<VersionMeta, 'id' | 'name'>> };

/** Values of these fields are maintained by the live collection on publish */
const MANAGED_SPECIALS = [
	'date-created',
	'date-updated',
	'user-created',
	'user-updated',
	'role-created',
	'role-updated',
];

/** Values of these fields are stored transformed already and have to be copied as is */
const RAW_SPECIALS = ['hash', 'encrypt', 'conceal'];

/**
 * Create, update, delete and publish versions of items, stored in the shadow table of the collection.
 * Version ids refer to the `version_id` of the shadow table.
 */
export class VersionedItemsService {
	collection: string;
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(collection: string, options: AbstractServiceOptions) {
		this.collection = collection;
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;

		if (!(collection in this.schema.collections) || isShadowTable(collection)) {
			throw new ForbiddenError();
		}

		if (!isVersionedCollection(this.schema, collection)) {
			throw new InvalidPayloadError({ reason: `Versioning isn't enabled for collection "${collection}"` });
		}
	}

	async createOne(data: VersionPayload): Promise<number> {
		return transaction(this.knex, (trx) => this.saveVersion(trx, this.collection, null, data));
	}

	async updateOne(versionId: number, data: VersionPayload): Promise<number> {
		return transaction(this.knex, (trx) => this.saveVersion(trx, this.collection, versionId, data));
	}

	async deleteOne(versionId: number): Promise<number> {
		await transaction(this.knex, async (trx) => {
			await this.getShadowService(trx, this.collection).deleteOne(versionId);
		});

		return versionId;
	}

	/**
	 * Publish the version to the live collection, together with the versions of related items it references.
	 * Returns the primary key of the live item.
	 */
	async publish(versionId: number, options?: { deleteVersion?: boolean }): Promise<PrimaryKey> {
		return transaction(this.knex, async (trx) => {
			const liveKey = await this.publishVersion(trx, this.collection, versionId, new Set());

			if (options?.deleteVersion) {
				await trx(getShadowTableName(this.collection)).where(VERSION_META_FIELDS.id, versionId).delete();
			}

			return liveKey;
		});
	}

	/**
	 * Remove the live item of a published version, the version is kept as a draft
	 */
	async unpublish(versionId: number): Promise<number> {
		await transaction(this.knex, async (trx) => {
			const { primary } = this.schema.collections[this.collection]!;
			const row = await this.readVersionRow(trx, this.collection, versionId, 'update');

			if (row[VERSION_META_FIELDS.type] !== 'published' || row[primary] === null) {
				throw new InvalidPayloadError({ reason: `Version "${versionId}" isn't published` });
			}

			await trx(getShadowTableName(this.collection))
				.where(VERSION_META_FIELDS.id, versionId)
				.update({ [VERSION_META_FIELDS.type]: 'draft' });

			await this.removeLiveItem(trx, this.collection, row[primary], { keepReference: false });
		});

		return versionId;
	}

	/**
	 * Archive the published version of the item and remove the live item, other versions stay drafts.
	 * Returns the id of the archived version.
	 */
	async archive(versionId: number): Promise<number> {
		return transaction(this.knex, async (trx) => {
			const { primary } = this.schema.collections[this.collection]!;
			const shadowTable = getShadowTableName(this.collection);
			const row = await this.readVersionRow(trx, this.collection, versionId, 'update');
			const liveKey = row[primary];

			let archivedId = versionId;

			if (liveKey !== null) {
				const published = await trx(shadowTable)
					.select(VERSION_META_FIELDS.id)
					.where(primary, liveKey)
					.where(VERSION_META_FIELDS.type, 'published')
					.first();

				if (published) archivedId = published[VERSION_META_FIELDS.id];
			}

			await trx(shadowTable)
				.where(VERSION_META_FIELDS.id, archivedId)
				.update({ [VERSION_META_FIELDS.type]: 'archived' });

			if (liveKey !== null) {
				await this.removeLiveItem(trx, this.collection, liveKey, { keepReference: true });
			}

			return archivedId;
		});
	}

	/**
	 * Read a version in the shape of a live item, with the version meta under `directus_version`
	 */
	async readOne(versionId: number, query?: { fields?: string[] | null }): Promise<Item> {
		const row = await this.readVersionRow(this.knex, this.collection, versionId, 'read');
		const { fields } = this.schema.collections[this.collection]!;
		const shadowFields = this.schema.collections[getShadowTableName(this.collection)]!.fields;

		const values: Item = {};

		for (const field of Object.values(fields)) {
			if (!field.alias) values[field.field] = row[field.field];
		}

		const payloadService = new PayloadService(this.collection, {
			knex: this.knex,
			schema: this.schema,
			accountability: this.accountability,
		});

		const item = await payloadService.processValues('read', values);

		// Show references to versions of related items in the same format they're written in
		for (const relation of this.getM2ORelations(this.collection)) {
			const referenceField = getVersionReferenceField(relation.field);

			if (referenceField in shadowFields && item[relation.field] === null && row[referenceField] !== null) {
				item[relation.field] = { directus_version: { id: row[referenceField] } };
			}
		}

		item['directus_version'] = this.toVersionMeta(row);

		return pickFields(item, query?.fields);
	}

	private async saveVersion(
		trx: Knex,
		collection: string,
		versionId: number | null,
		data: VersionPayload,
	): Promise<number> {
		if (!isPlainObject(data)) {
			throw new InvalidPayloadError({ reason: `Version of "${collection}" has to be an object` });
		}

		const { directus_version: meta, ...values } = data;
		const { primary, fields } = this.schema.collections[collection]!;

		versionId ??= meta?.id ?? null;

		const existing = versionId !== null ? await this.readVersionRow(trx, collection, versionId, 'update') : null;

		const record: Item = {};
		const plainValues: Item = {};
		const o2mValues: [Relation, unknown][] = [];

		// A new version of an existing item starts out as a copy of it
		if (!existing && values[primary] !== undefined && values[primary] !== null) {
			Object.assign(record, await this.readLiveRow(trx, collection, values[primary]));
		}

		for (const [field, value] of Object.entries(values)) {
			if (!(field in fields)) {
				throw new InvalidPayloadError({ reason: `Field "${field}" doesn't exist in collection "${collection}"` });
			}

			const m2o = this.getM2ORelations(collection).find((relation) => relation.field === field);

			if (m2o) {
				Object.assign(record, await this.saveM2O(trx, collection, m2o, value, { ...existing, ...values }));
				continue;
			}

			const o2m = this.getO2MRelation(collection, field);

			if (o2m) {
				o2mValues.push([o2m, value]);
				continue;
			}

			if (!fields[field]!.alias) plainValues[field] = value;
		}

		const payloadService = new PayloadService(collection, {
			knex: trx,
			schema: this.schema,
			accountability: this.accountability,
		});

		// Processing adds values for special fields, only the ones that are part of the payload are kept
		const processed = await payloadService.processValues(existing ? 'update' : 'create', { ...plainValues });
		Object.assign(record, pick(processed, Object.keys(plainValues)));

		if (meta && 'name' in meta) {
			record[VERSION_META_FIELDS.name] = meta.name ?? null;
		}

		// Writes go through the shadow collection, so its permissions, validation and presets apply as usual
		const shadowService = this.getShadowService(trx, collection);

		if (existing) {
			record[VERSION_META_FIELDS.dateUpdated] = new Date();
			record[VERSION_META_FIELDS.userUpdated] = this.accountability?.user ?? null;

			await shadowService.updateOne(versionId!, record);
		} else {
			record[VERSION_META_FIELDS.userCreated] = this.accountability?.user ?? null;

			versionId = Number(await shadowService.createOne(record));
		}

		for (const [relation, value] of o2mValues) {
			await this.saveO2M(trx, relation, versionId!, value);
		}

		return versionId!;
	}

	/**
	 * Primitive values link to live items. Objects create or update a version of the related item,
	 * which is only possible if the related collection is versioned.
	 */
	private async saveM2O(trx: Knex, collection: string, relation: Relation, value: unknown, current: Item) {
		const shadowFields = this.schema.collections[getShadowTableName(collection)]!.fields;
		const referenceField = getVersionReferenceField(relation.field);
		const hasReference = referenceField in shadowFields;

		if (!isPlainObject(value)) {
			return { [relation.field]: value ?? null, ...(hasReference ? { [referenceField]: null } : {}) };
		}

		const relatedCollection = relation.related_collection ?? current[relation.meta?.one_collection_field ?? ''];

		if (!hasReference || !relatedCollection || !isVersionedCollection(this.schema, relatedCollection)) {
			throw new InvalidPayloadError({
				reason: `Field "${relation.field}" in "${collection}" can only link to existing items, as the related collection isn't versioned`,
			});
		}

		const relatedVersion = value as VersionPayload;

		const isLinkOnly =
			Object.keys(relatedVersion).length === 1 && isEqual(Object.keys(relatedVersion.directus_version ?? {}), ['id']);

		let relatedVersionId: number;

		if (isLinkOnly) {
			relatedVersionId = relatedVersion.directus_version!.id!;
			await this.readVersionRow(trx, relatedCollection, relatedVersionId, 'read');
		} else {
			relatedVersionId = await this.saveVersion(trx, relatedCollection, null, relatedVersion);
		}

		return { [relation.field]: null, [referenceField]: relatedVersionId };
	}

	/**
	 * Supports the array format, which replaces all related items, and the detailed `{ create, update, delete }` format.
	 * Keys link live items to the version through the link table of the related collection.
	 * Objects create or update versions of related items that reference this version.
	 */
	private async saveO2M(trx: Knex, relation: Relation, versionId: number, value: unknown) {
		const field = relation.meta!.one_field;

		if (Array.isArray(value)) {
			const linked = await this.linkO2M(trx, relation, versionId, value);
			await this.unlinkO2M(trx, relation, versionId, linked, { except: true });
			return;
		}

		if (!isPlainObject(value)) {
			throw new InvalidPayloadError({
				reason: `Field "${field}" has to be an array or contain create, update or delete`,
			});
		}

		const { create = [], update = [], delete: remove = [] } = value as Record<string, unknown>;

		for (const [key, items] of Object.entries({ create, update, delete: remove })) {
			if (!Array.isArray(items)) {
				throw new InvalidPayloadError({ reason: `"${key}" of field "${field}" has to be an array` });
			}
		}

		await this.linkO2M(trx, relation, versionId, [...(create as unknown[]), ...(update as unknown[])]);

		await this.unlinkO2M(trx, relation, versionId, this.splitO2MItems(relation, remove as unknown[]), {
			except: false,
		});
	}

	private async linkO2M(trx: Knex, relation: Relation, versionId: number, items: unknown[]) {
		const relatedCollection = relation.collection;
		const { primary } = this.schema.collections[relatedCollection]!;
		const linkTable = getLinkTableName(relatedCollection);
		const linked = { keys: [] as PrimaryKey[], versionIds: [] as number[] };

		for (const item of items) {
			const key = this.getO2MLinkKey(relation, item);

			if (key === null) {
				if (!isVersionedCollection(this.schema, relatedCollection)) {
					throw new InvalidPayloadError({
						reason: `Field "${relation.meta!.one_field}" can only link to existing items, as "${relatedCollection}" isn't versioned`,
					});
				}

				linked.versionIds.push(
					await this.saveVersion(trx, relatedCollection, null, {
						...(item as Item),
						[relation.field]: { directus_version: { id: versionId } },
					}),
				);

				continue;
			}

			await validateLinkAccess(
				{ collection: relatedCollection, action: 'update', keys: [key], accountability: this.accountability },
				{ knex: trx, schema: this.schema },
			);

			const updated = await trx(linkTable)
				.update({ [relation.field]: versionId })
				.where(primary, key);

			if (!updated) {
				await trx(linkTable).insert({ [primary]: key, [relation.field]: versionId });
			}

			linked.keys.push(key);
		}

		return linked;
	}

	/**
	 * Unlink the given related items from the version, or all others if `except` is set.
	 * Live items are only ever unlinked, versions are deleted if that's the deselect action of the relation.
	 */
	private async unlinkO2M(
		trx: Knex,
		relation: Relation,
		versionId: number,
		items: { keys: PrimaryKey[]; versionIds: number[] },
		options: { except: boolean },
	) {
		const relatedCollection = relation.collection;
		const { primary } = this.schema.collections[relatedCollection]!;
		const linkTable = getLinkTableName(relatedCollection);
		const relatedShadowTable = getShadowTableName(relatedCollection);
		const referenceField = getVersionReferenceField(relation.field);

		const linkQuery = trx(linkTable).select(primary).where(relation.field, versionId);

		const unlinkedKeys = (
			await (options.except ? linkQuery.whereNotIn(primary, items.keys) : linkQuery.whereIn(primary, items.keys))
		).map((row) => row[primary]);

		if (unlinkedKeys.length > 0) {
			await validateLinkAccess(
				{ collection: relatedCollection, action: 'update', keys: unlinkedKeys, accountability: this.accountability },
				{ knex: trx, schema: this.schema },
			);

			await trx(linkTable)
				.update({ [relation.field]: null })
				.whereIn(primary, unlinkedKeys);
		}

		if (!this.schema.collections[relatedShadowTable]?.fields[referenceField]) return;

		const versionQuery = trx(relatedShadowTable).select(VERSION_META_FIELDS.id).where(referenceField, versionId);

		const unlinkedVersionIds = (
			await (options.except
				? versionQuery.whereNotIn(VERSION_META_FIELDS.id, items.versionIds)
				: versionQuery.whereIn(VERSION_META_FIELDS.id, items.versionIds))
		).map((row) => row[VERSION_META_FIELDS.id]);

		if (unlinkedVersionIds.length === 0) return;

		const relatedShadowService = this.getShadowService(trx, relatedCollection);

		if (relation.meta?.one_deselect_action === 'delete') {
			await relatedShadowService.deleteMany(unlinkedVersionIds);
		} else {
			await relatedShadowService.updateMany(unlinkedVersionIds, { [referenceField]: null });
		}
	}

	/**
	 * Split the items to unlink into keys of live items and ids of versions
	 */
	private splitO2MItems(relation: Relation, items: unknown[]) {
		const result = { keys: [] as PrimaryKey[], versionIds: [] as number[] };

		for (const item of items) {
			const key = this.getO2MLinkKey(relation, item);
			const versionId = (item as VersionPayload)?.directus_version?.id;

			if (key !== null) {
				result.keys.push(key);
			} else if (typeof versionId === 'number') {
				result.versionIds.push(versionId);
			} else {
				throw new InvalidPayloadError({
					reason: `Items to delete from field "${relation.meta!.one_field}" have to be keys or contain "directus_version.id"`,
				});
			}
		}

		return result;
	}

	/**
	 * The key of the live item, if the item is a plain link to it (a key or an object with only the primary key)
	 */
	private getO2MLinkKey(relation: Relation, item: unknown): PrimaryKey | null {
		if (!isPlainObject(item)) return item as PrimaryKey;

		const { primary } = this.schema.collections[relation.collection]!;
		const keys = Object.keys(item as Item);

		return keys.length === 1 && keys[0] === primary ? (item as Item)[primary] : null;
	}

	private async publishVersion(
		trx: Knex,
		collection: string,
		versionId: number,
		visited: Set<string>,
	): Promise<PrimaryKey> {
		const { primary, fields } = this.schema.collections[collection]!;
		const shadowTable = getShadowTableName(collection);
		const row = await this.readVersionRow(trx, collection, versionId, 'read');

		// Prevents endless loops for circular references between versions
		const visitKey = `${collection}:${versionId}`;
		if (visited.has(visitKey)) return row[primary];
		visited.add(visitKey);

		const currentKey: PrimaryKey | null = row[primary];
		const liveRow = currentKey !== null ? await trx(collection).where(primary, currentKey).first() : null;

		const values: Item = {};
		const rawValues: Item = {};

		for (const field of Object.values(fields)) {
			if (field.alias || field.field === primary || hasSpecial(field, MANAGED_SPECIALS)) continue;

			// Only send changed values to not require access to fields that stay the same
			if (liveRow && isEqual(liveRow[field.field], row[field.field])) continue;

			if (hasSpecial(field, RAW_SPECIALS)) {
				rawValues[field.field] = row[field.field];
			} else {
				values[field.field] = row[field.field];
			}
		}

		const shadowUpdates: Item = {};

		// Versions of related items are published first, so the live item can reference them
		for (const relation of this.getM2ORelations(collection)) {
			const referenceId = row[getVersionReferenceField(relation.field)];

			// Links to live items take precedence over references to versions
			if (referenceId === undefined || referenceId === null || row[relation.field] !== null) continue;

			const relatedCollection = relation.related_collection ?? row[relation.meta?.one_collection_field ?? ''];

			if (!relatedCollection || !isVersionedCollection(this.schema, relatedCollection)) continue;

			const relatedKey = await this.publishVersion(trx, relatedCollection, referenceId, visited);

			if (relatedKey !== null) {
				values[relation.field] = relatedKey;
				shadowUpdates[relation.field] = relatedKey;
			}
		}

		const payloadService = new PayloadService(collection, { knex: trx, schema: this.schema, accountability: null });
		const payload = await payloadService.processValues('read', values);

		const itemsService = new ItemsService(collection, {
			knex: trx,
			schema: this.schema,
			accountability: this.accountability,
		});

		let liveKey: PrimaryKey;

		if (!liveRow) {
			// Versions of removed items, like archived ones, recreate the item under its original id
			liveKey = await this.withExplicitKey(trx, collection, currentKey !== null, () =>
				itemsService.createOne(currentKey !== null ? { ...payload, [primary]: currentKey } : payload),
			);

			// Some databases, like Oracle, return generated integer keys as strings
			if (fields[primary]?.type === 'integer') liveKey = Number(liveKey);
		} else {
			liveKey = currentKey!;

			if (Object.keys(payload).length > 0) await itemsService.updateOne(liveKey, payload);
		}

		if (Object.keys(rawValues).length > 0) {
			await trx(collection).update(rawValues).where(primary, liveKey);
		}

		// The previously published version of the item goes back to being a draft
		await trx(shadowTable)
			.update({ [VERSION_META_FIELDS.type]: 'draft' })
			.where(primary, liveKey)
			.where(VERSION_META_FIELDS.type, 'published')
			.whereNot(VERSION_META_FIELDS.id, versionId);

		const managedFields = Object.values(fields)
			.filter((field) => !field.alias && hasSpecial(field, MANAGED_SPECIALS))
			.map((field) => field.field);

		const managedValues =
			managedFields.length > 0 ? await trx(collection).select(managedFields).where(primary, liveKey).first() : {};

		await trx(shadowTable)
			.update({
				...shadowUpdates,
				...managedValues,
				[primary]: liveKey,
				[VERSION_META_FIELDS.type]: 'published',
				[VERSION_META_FIELDS.dateUpdated]: trx.fn.now(),
				[VERSION_META_FIELDS.userUpdated]: this.accountability?.user ?? null,
			})
			.where(VERSION_META_FIELDS.id, versionId);

		await this.publishRelatedItems(trx, collection, versionId, liveKey, visited);

		return liveKey;
	}

	/**
	 * MSSQL doesn't allow inserting explicit values into identity columns unless it's enabled for the table
	 */
	private async withExplicitKey<T>(
		trx: Knex,
		collection: string,
		hasExplicitKey: boolean,
		callback: () => Promise<T>,
	): Promise<T> {
		const { primary, fields } = this.schema.collections[collection]!;

		const needsIdentityInsert =
			hasExplicitKey && getDatabaseClient(trx) === 'mssql' && fields[primary]?.defaultValue === 'AUTO_INCREMENT';

		if (!needsIdentityInsert) return callback();

		await trx.raw('SET IDENTITY_INSERT ?? ON', [collection]);

		try {
			return await callback();
		} finally {
			await trx.raw('SET IDENTITY_INSERT ?? OFF', [collection]);
		}
	}

	/**
	 * Point items that are related to the version through o2m relations to the published live item
	 */
	private async publishRelatedItems(
		trx: Knex,
		collection: string,
		versionId: number,
		liveKey: PrimaryKey,
		visited: Set<string>,
	) {
		const relations = this.schema.relations.filter(
			(relation) =>
				!isShadowTable(relation.collection) &&
				(relation.related_collection === collection || relation.meta?.one_allowed_collections?.includes(collection)),
		);

		for (const relation of relations) {
			const relatedCollection = relation.collection;
			const { primary } = this.schema.collections[relatedCollection]!;
			const linkTable = getLinkTableName(relatedCollection);
			const relatedShadowTable = getShadowTableName(relatedCollection);
			const referenceField = getVersionReferenceField(relation.field);

			// a2o references only store the id, the collection is in a separate field of the item
			const collectionField = relation.related_collection ? null : relation.meta!.one_collection_field!;

			if (this.schema.collections[linkTable]?.fields[relation.field]) {
				const query = trx(linkTable)
					.select(`${linkTable}.${primary}`)
					.where(`${linkTable}.${relation.field}`, versionId);

				if (collectionField) {
					query
						.join(relatedCollection, `${relatedCollection}.${primary}`, `${linkTable}.${primary}`)
						.where(`${relatedCollection}.${collectionField}`, collection);
				}

				const linkedKeys = (await query).map((row) => row[primary]);

				if (linkedKeys.length > 0) {
					const itemsService = new ItemsService(relatedCollection, {
						knex: trx,
						schema: this.schema,
						accountability: this.accountability,
					});

					await itemsService.updateMany(linkedKeys, { [relation.field]: liveKey });

					await trx(linkTable)
						.update({ [relation.field]: null })
						.whereIn(primary, linkedKeys);
				}
			}

			if (this.schema.collections[relatedShadowTable]?.fields[referenceField]) {
				const query = trx(relatedShadowTable).select(VERSION_META_FIELDS.id).where(referenceField, versionId);

				if (collectionField) query.where(collectionField, collection);

				const relatedVersionIds = (await query).map((row) => row[VERSION_META_FIELDS.id]);

				for (const relatedVersionId of relatedVersionIds) {
					await trx(relatedShadowTable)
						.update({ [relation.field]: liveKey })
						.where(VERSION_META_FIELDS.id, relatedVersionId);

					await this.publishVersion(trx, relatedCollection, relatedVersionId, visited);
				}
			}
		}
	}

	/**
	 * Delete the live item, while keeping its versions
	 *
	 * @param options.keepReference - Whether the versions should keep the id of the removed item
	 */
	private async removeLiveItem(
		trx: Knex,
		collection: string,
		liveKey: PrimaryKey,
		options: { keepReference: boolean },
	) {
		const { primary } = this.schema.collections[collection]!;
		const shadowTable = getShadowTableName(collection);

		const versionIds = (await trx(shadowTable).select(VERSION_META_FIELDS.id).where(primary, liveKey)).map(
			(row) => row[VERSION_META_FIELDS.id],
		);

		// Deleting a live item deletes its versions as well, so they are detached while it's removed
		await trx(shadowTable)
			.update({ [primary]: null })
			.whereIn(VERSION_META_FIELDS.id, versionIds);

		// The item might already be gone, e.g. when archiving a version of an archived item
		const exists = await trx(collection).select(primary).where(primary, liveKey).first();

		if (exists) {
			const itemsService = new ItemsService(collection, {
				knex: trx,
				schema: this.schema,
				accountability: this.accountability,
			});

			await itemsService.deleteOne(liveKey);
		}

		if (options.keepReference && versionIds.length > 0) {
			await trx(shadowTable)
				.update({ [primary]: liveKey })
				.whereIn(VERSION_META_FIELDS.id, versionIds);
		}
	}

	private getShadowService(knex: Knex, collection: string) {
		return new ItemsService(getShadowTableName(collection), {
			knex,
			schema: this.schema,
			accountability: this.accountability,
		});
	}

	private async readVersionRow(knex: Knex, collection: string, versionId: number, action: PermissionsAction) {
		const shadowTable = getShadowTableName(collection);

		if (this.accountability) {
			await validateAccess(
				{ accountability: this.accountability, action, collection: shadowTable, primaryKeys: [versionId] },
				{ knex, schema: this.schema },
			);
		}

		const row = await knex.select('*').from(shadowTable).where(VERSION_META_FIELDS.id, versionId).first();

		if (!row) throw new ForbiddenError();

		return row as Item;
	}

	/**
	 * Read the raw values of a live item, returns nothing if it doesn't exist (anymore)
	 */
	private async readLiveRow(knex: Knex, collection: string, key: PrimaryKey) {
		const row = await knex
			.select('*')
			.from(collection)
			.where(this.schema.collections[collection]!.primary, key)
			.first();

		if (!row) return {};

		if (this.accountability) {
			await validateAccess(
				{ accountability: this.accountability, action: 'read', collection, primaryKeys: [key] },
				{ knex, schema: this.schema },
			);
		}

		return row as Item;
	}

	private getM2ORelations(collection: string) {
		return this.schema.relations.filter(
			(relation) =>
				relation.collection === collection &&
				(relation.related_collection !== null || relation.meta?.one_allowed_collections),
		);
	}

	private getO2MRelation(collection: string, field: string) {
		return this.schema.relations.find(
			(relation) => relation.related_collection === collection && relation.meta?.one_field === field,
		);
	}

	private toVersionMeta(row: Item): VersionMeta {
		return {
			id: row[VERSION_META_FIELDS.id],
			name: row[VERSION_META_FIELDS.name],
			type: row[VERSION_META_FIELDS.type],
			date_created: row[VERSION_META_FIELDS.dateCreated],
			date_updated: row[VERSION_META_FIELDS.dateUpdated],
			user_created: row[VERSION_META_FIELDS.userCreated],
			user_updated: row[VERSION_META_FIELDS.userUpdated],
		};
	}
}

function hasSpecial(field: FieldOverview, specials: string[]) {
	return field.special.some((special) => specials.includes(special));
}

/**
 * Limit the item to the requested fields, nested selections are only supported for objects like `directus_version`
 */
export function pickFields(item: Item, fields?: string[] | null): Item {
	if (!fields || fields.includes('*')) return item;

	const result: Item = {};

	for (const field of fields) {
		const [root, ...nested] = field.split('.');

		if (!root || !(root in item)) continue;

		const value = item[root];

		if (nested.length === 0 || !isPlainObject(value)) {
			result[root] = value;
		} else {
			result[root] = { ...result[root], ...pickFields(value, [nested.join('.')]) };
		}
	}

	return result;
}
