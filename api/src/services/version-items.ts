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
import { getRelationInfo } from '@directus/utils';
import type { Knex } from 'knex';
import { isEqual, isPlainObject, pick } from 'lodash-es';
import { getHelpers } from '../database/helpers/index.js';
import type { VersioningHelper } from '../database/helpers/versioning/types.js';
import getDatabase, { getDatabaseClient } from '../database/index.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { transaction } from '../utils/transaction.js';
import { validateLinkAccess } from '../versioning/link-access.js';
import { getVersionTablesSchema } from '../versioning/schema.js';
import { ItemsService } from './items.js';
import { PayloadService } from './payload.js';
import { VERSION_FIELD, VERSION_SYSTEM_FIELDS } from './version-tables/constants.js';
import { flattenVersionSystemFields, isVersioningTable } from './version-tables/utils.js';

type VersionSystemFields = {
	id: PrimaryKey | null;
	name: string | null;
	type: 'draft' | 'published' | 'archived';
	date_created: string | null;
	date_updated: string | null;
	user_created: string | null;
	user_updated: string | null;
};

type VersionPayload = Item & { [VERSION_FIELD]?: Partial<Pick<VersionSystemFields, 'id' | 'name'>> };

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
	versioning: VersioningHelper;

	constructor(collection: string, options: AbstractServiceOptions) {
		this.collection = collection;
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = getVersionTablesSchema(options.schema);
		this.versioning = getHelpers(this.knex).versioning;

		if (!(collection in this.schema.collections) || isVersioningTable(collection)) {
			throw new ForbiddenError();
		}

		if (!this.schema.collections[collection]?.versioned) {
			throw new InvalidPayloadError({ reason: `Versioning isn't enabled for collection "${collection}"` });
		}
	}

	async createOne(data: VersionPayload): Promise<PrimaryKey> {
		return transaction(this.knex, (trx) => this.saveVersion(trx, this.collection, null, data));
	}

	async updateOne(versionId: PrimaryKey, data: VersionPayload): Promise<PrimaryKey> {
		return transaction(this.knex, (trx) => this.saveVersion(trx, this.collection, versionId, data));
	}

	async deleteOne(versionId: PrimaryKey): Promise<PrimaryKey> {
		return new ItemsService(this.versioning.getShadowTableName(this.collection), {
			knex: this.knex,
			schema: this.schema,
			accountability: this.accountability,
		}).deleteOne(versionId);
	}

	/**
	 * Publish the version to the live collection, together with the versions of related items it references.
	 * Returns the primary key of the live item.
	 */
	async publish(versionId: PrimaryKey, options?: { deleteVersion?: boolean }): Promise<PrimaryKey> {
		return transaction(this.knex, async (trx) => {
			const liveKey = await this.publishVersion(trx, this.collection, versionId, new Set());

			if (options?.deleteVersion) {
				await trx(this.versioning.getShadowTableName(this.collection))
					.where(VERSION_SYSTEM_FIELDS.id, versionId)
					.delete();
			}

			return liveKey;
		});
	}

	/**
	 * Remove the live item of a published version, the version is kept as a draft
	 */
	async unpublish(versionId: PrimaryKey): Promise<PrimaryKey> {
		await transaction(this.knex, async (trx) => {
			const { primary } = this.schema.collections[this.collection]!;
			const row = await this.readVersion(trx, this.collection, versionId, 'update');

			if (row[VERSION_SYSTEM_FIELDS.type] !== 'published' || row[primary] === null) {
				throw new InvalidPayloadError({ reason: `Version "${versionId}" isn't published` });
			}

			await trx(this.versioning.getShadowTableName(this.collection))
				.where(VERSION_SYSTEM_FIELDS.id, versionId)
				.update({ [VERSION_SYSTEM_FIELDS.type]: 'draft' });

			await this.removeLiveItem(trx, this.collection, row[primary], { keepReference: false });
		});

		return versionId;
	}

	/**
	 * Archive the published version of the item and remove the live item, other versions stay drafts.
	 * Returns the id of the archived version.
	 */
	async archive(versionId: PrimaryKey): Promise<PrimaryKey> {
		return transaction(this.knex, async (trx) => {
			const { primary } = this.schema.collections[this.collection]!;
			const shadowTable = this.versioning.getShadowTableName(this.collection);
			const row = await this.readVersion(trx, this.collection, versionId, 'update');
			const liveKey = row[primary];

			const published =
				liveKey !== null
					? await trx(shadowTable)
							.select(VERSION_SYSTEM_FIELDS.id)
							.where(primary, liveKey)
							.where(VERSION_SYSTEM_FIELDS.type, 'published')
							.first()
					: undefined;

			if (!published) {
				throw new InvalidPayloadError({ reason: `Version "${versionId}" doesn't belong to a published item` });
			}

			const archivedId = published[VERSION_SYSTEM_FIELDS.id];

			await trx(shadowTable)
				.where(VERSION_SYSTEM_FIELDS.id, archivedId)
				.update({ [VERSION_SYSTEM_FIELDS.type]: 'archived' });

			await this.removeLiveItem(trx, this.collection, liveKey, { keepReference: true });

			return archivedId;
		});
	}

	private async saveVersion(
		trx: Knex,
		collection: string,
		versionId: PrimaryKey | null,
		data: VersionPayload,
	): Promise<PrimaryKey> {
		if (!isPlainObject(data)) {
			throw new InvalidPayloadError({ reason: `Version of "${collection}" has to be an object` });
		}

		const { [VERSION_FIELD]: system, ...values } = data;
		const { primary, fields } = this.schema.collections[collection]!;
		const shadowFields = this.schema.collections[this.versioning.getShadowTableName(collection)]!.fields;

		versionId ??= system?.id ?? null;

		const existing = versionId !== null ? await this.readVersion(trx, collection, versionId, 'update') : null;

		const record: Item = {};
		const plainValues: Item = {};
		const o2mValues: [Relation, unknown][] = [];

		// A new version of an existing item starts out as a copy of it, if it still exists
		if (!existing && values[primary] !== undefined && values[primary] !== null) {
			const liveRow = await trx.select('*').from(collection).where(primary, values[primary]).first();

			if (liveRow && this.accountability) {
				await validateAccess(
					{ accountability: this.accountability, action: 'read', collection, primaryKeys: [values[primary]] },
					{ knex: trx, schema: this.schema },
				);
			}

			Object.assign(record, liveRow);
		}

		for (const [field, value] of Object.entries(values)) {
			if (!(field in fields)) {
				throw new InvalidPayloadError({ reason: `Field "${field}" doesn't exist in collection "${collection}"` });
			}

			const { relation, relationType } = getRelationInfo(this.schema.relations, collection, field);

			// Primitive values link to live items. Objects create or update a version of the related item,
			// which is only possible if the related collection is versioned.
			if (relationType === 'm2o' || relationType === 'a2o') {
				const referenceField = this.versioning.getVersionReferenceField(field);
				const hasReference = referenceField in shadowFields;

				if (!isPlainObject(value)) {
					record[field] = value ?? null;
					if (hasReference) record[referenceField] = null;
					continue;
				}

				const relatedCollection =
					relation!.related_collection ?? { ...existing, ...values }[relation!.meta?.one_collection_field ?? ''];

				if (!hasReference || !relatedCollection || !this.schema.collections[relatedCollection]?.versioned) {
					throw new InvalidPayloadError({
						reason: `Field "${field}" in "${collection}" can only link to existing items, as the related collection isn't versioned`,
					});
				}

				const relatedVersion = value as VersionPayload;

				const isLinkOnly =
					Object.keys(relatedVersion).length === 1 && isEqual(Object.keys(relatedVersion[VERSION_FIELD] ?? {}), ['id']);

				let relatedVersionId: PrimaryKey;

				if (isLinkOnly) {
					relatedVersionId = relatedVersion[VERSION_FIELD]!.id!;
					await this.readVersion(trx, relatedCollection, relatedVersionId, 'read');
				} else {
					relatedVersionId = await this.saveVersion(trx, relatedCollection, null, relatedVersion);
				}

				record[field] = null;
				record[referenceField] = relatedVersionId;
				continue;
			}

			if (relationType === 'o2m') {
				o2mValues.push([relation!, value]);
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

		const recordSystem: Record<string, unknown> = {};

		if (system && 'name' in system) {
			recordSystem['name'] = system.name ?? null;
		}

		// Writes go through the shadow collection, so its permissions, validation and presets apply as usual
		const shadowService = new ItemsService(this.versioning.getShadowTableName(collection), {
			knex: trx,
			schema: this.schema,
			accountability: this.accountability,
		});

		if (existing) {
			recordSystem['date_updated'] = new Date();
			recordSystem['user_updated'] = this.accountability?.user ?? null;
		} else {
			recordSystem['user_created'] = this.accountability?.user ?? null;
		}

		const row = flattenVersionSystemFields({ ...record, [VERSION_FIELD]: recordSystem });

		if (existing) {
			await shadowService.updateOne(versionId!, row);
		} else {
			versionId = await shadowService.createOne(row);
		}

		// Supports the array format, which replaces all related items, and the detailed `{ create, update, delete }` format.
		// Keys link live items to the version through the link table of the related collection.
		// Objects create or update versions of related items that reference this version.
		for (const [relation, value] of o2mValues) {
			const field = relation.meta!.one_field;

			if (Array.isArray(value)) {
				const linked = await this.linkO2M(trx, relation, versionId!, value);
				await this.unlinkO2M(trx, relation, versionId!, linked, { except: true });
				continue;
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

			await this.linkO2M(trx, relation, versionId!, [...(create as unknown[]), ...(update as unknown[])]);

			const removed = { keys: [] as PrimaryKey[], versionIds: [] as PrimaryKey[] };

			for (const item of remove as unknown[]) {
				const key = this.getO2MLinkKey(relation, item);
				const removedVersionId = (item as VersionPayload)?.[VERSION_FIELD]?.id;

				if (key !== null) {
					removed.keys.push(key);
				} else if (removedVersionId !== undefined && removedVersionId !== null) {
					removed.versionIds.push(removedVersionId);
				} else {
					throw new InvalidPayloadError({
						reason: `Items to delete from field "${field}" have to be keys or contain "directus_version.id"`,
					});
				}
			}

			await this.unlinkO2M(trx, relation, versionId!, removed, { except: false });
		}

		return versionId!;
	}

	private async linkO2M(trx: Knex, relation: Relation, versionId: PrimaryKey, items: unknown[]) {
		const relatedCollection = relation.collection;
		const { primary } = this.schema.collections[relatedCollection]!;
		const linkTable = this.versioning.getLinkTableName(relatedCollection);
		const linked = { keys: [] as PrimaryKey[], versionIds: [] as PrimaryKey[] };

		for (const item of items) {
			const key = this.getO2MLinkKey(relation, item);

			if (key === null) {
				if (!this.schema.collections[relatedCollection]?.versioned) {
					throw new InvalidPayloadError({
						reason: `Field "${relation.meta!.one_field}" can only link to existing items, as "${relatedCollection}" isn't versioned`,
					});
				}

				linked.versionIds.push(
					await this.saveVersion(trx, relatedCollection, null, {
						...(item as Item),
						[relation.field]: { [VERSION_FIELD]: { id: versionId } },
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
		versionId: PrimaryKey,
		items: { keys: PrimaryKey[]; versionIds: PrimaryKey[] },
		options: { except: boolean },
	) {
		const relatedCollection = relation.collection;
		const { primary } = this.schema.collections[relatedCollection]!;
		const linkTable = this.versioning.getLinkTableName(relatedCollection);
		const relatedShadowTable = this.versioning.getShadowTableName(relatedCollection);
		const referenceField = this.versioning.getVersionReferenceField(relation.field);

		const scope = async (query: Knex.QueryBuilder, column: string, values: PrimaryKey[]): Promise<Item[]> =>
			options.except ? query.whereNotIn(column, values) : query.whereIn(column, values);

		const unlinkedKeys = (
			await scope(trx(linkTable).select(primary).where(relation.field, versionId), primary, items.keys)
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

		const unlinkedVersionIds = (
			await scope(
				trx(relatedShadowTable).select(VERSION_SYSTEM_FIELDS.id).where(referenceField, versionId),
				VERSION_SYSTEM_FIELDS.id,
				items.versionIds,
			)
		).map((row) => row[VERSION_SYSTEM_FIELDS.id]);

		if (unlinkedVersionIds.length === 0) return;

		const relatedShadowService = new ItemsService(this.versioning.getShadowTableName(relatedCollection), {
			knex: trx,
			schema: this.schema,
			accountability: this.accountability,
		});

		if (relation.meta?.one_deselect_action === 'delete') {
			await relatedShadowService.deleteMany(unlinkedVersionIds);
		} else {
			await relatedShadowService.updateMany(unlinkedVersionIds, { [referenceField]: null });
		}
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
		versionId: PrimaryKey,
		visited: Set<string>,
	): Promise<PrimaryKey> {
		const { primary, fields } = this.schema.collections[collection]!;
		const shadowTable = this.versioning.getShadowTableName(collection);
		const row = await this.readVersion(trx, collection, versionId, 'read');

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
			const referenceId = row[this.versioning.getVersionReferenceField(relation.field)];

			// Links to live items take precedence over references to versions
			if (referenceId === undefined || referenceId === null || row[relation.field] !== null) continue;

			const relatedCollection = relation.related_collection ?? row[relation.meta?.one_collection_field ?? ''];

			if (!relatedCollection || !this.schema.collections[relatedCollection]?.versioned) continue;

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
			// Versions of removed items, like archived ones, recreate the item under its original id.
			// MSSQL doesn't allow inserting explicit values into identity columns unless it's enabled for the table.
			const needsIdentityInsert =
				currentKey !== null && getDatabaseClient(trx) === 'mssql' && fields[primary]?.defaultValue === 'AUTO_INCREMENT';

			if (needsIdentityInsert) await trx.raw('SET IDENTITY_INSERT ?? ON', [collection]);

			try {
				liveKey = await itemsService.createOne(currentKey !== null ? { ...payload, [primary]: currentKey } : payload);
			} finally {
				if (needsIdentityInsert) await trx.raw('SET IDENTITY_INSERT ?? OFF', [collection]);
			}

			// Some databases, like Oracle, return generated integer keys as strings
			if (fields[primary]?.type === 'integer') liveKey = Number(liveKey);
		} else {
			liveKey = currentKey!;

			if (Object.keys(payload).length > 0) await itemsService.updateOne(liveKey, payload);
		}

		if (Object.keys(rawValues).length > 0) {
			await trx(collection).update(rawValues).where(primary, liveKey);
		}

		// The previously published or archived versions of the item go back to being drafts
		await trx(shadowTable)
			.update({ [VERSION_SYSTEM_FIELDS.type]: 'draft' })
			.where(primary, liveKey)
			.whereIn(VERSION_SYSTEM_FIELDS.type, ['published', 'archived'])
			.whereNot(VERSION_SYSTEM_FIELDS.id, versionId);

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
				[VERSION_SYSTEM_FIELDS.type]: 'published',
				[VERSION_SYSTEM_FIELDS.date_updated]: trx.fn.now(),
				[VERSION_SYSTEM_FIELDS.user_updated]: this.accountability?.user ?? null,
			})
			.where(VERSION_SYSTEM_FIELDS.id, versionId);

		// Point items that are related to the version through o2m relations to the published live item
		const o2mRelations = this.schema.relations.filter(
			(relation) =>
				!isVersioningTable(relation.collection) &&
				(relation.related_collection === collection || relation.meta?.one_allowed_collections?.includes(collection)),
		);

		for (const relation of o2mRelations) {
			const relatedCollection = relation.collection;
			const relatedPrimary = this.schema.collections[relatedCollection]!.primary;
			const linkTable = this.versioning.getLinkTableName(relatedCollection);
			const relatedShadowTable = this.versioning.getShadowTableName(relatedCollection);
			const referenceField = this.versioning.getVersionReferenceField(relation.field);

			// a2o references only store the id, the collection is in a separate field of the item
			const collectionField = relation.related_collection ? null : relation.meta!.one_collection_field!;

			if (this.schema.collections[linkTable]?.fields[relation.field]) {
				const query = trx(linkTable)
					.select(`${linkTable}.${relatedPrimary}`)
					.where(`${linkTable}.${relation.field}`, versionId);

				if (collectionField) {
					query
						.join(relatedCollection, `${relatedCollection}.${relatedPrimary}`, `${linkTable}.${relatedPrimary}`)
						.where(`${relatedCollection}.${collectionField}`, collection);
				}

				const linkedKeys = (await query).map((row) => row[relatedPrimary]);

				if (linkedKeys.length > 0) {
					await new ItemsService(relatedCollection, {
						knex: trx,
						schema: this.schema,
						accountability: this.accountability,
					}).updateMany(linkedKeys, { [relation.field]: liveKey });

					await trx(linkTable)
						.update({ [relation.field]: null })
						.whereIn(relatedPrimary, linkedKeys);
				}
			}

			if (this.schema.collections[relatedShadowTable]?.fields[referenceField]) {
				const query = trx(relatedShadowTable).select(VERSION_SYSTEM_FIELDS.id).where(referenceField, versionId);

				if (collectionField) query.where(collectionField, collection);

				const relatedVersionIds = (await query).map((row) => row[VERSION_SYSTEM_FIELDS.id]);

				for (const relatedVersionId of relatedVersionIds) {
					await trx(relatedShadowTable)
						.update({ [relation.field]: liveKey })
						.where(VERSION_SYSTEM_FIELDS.id, relatedVersionId);

					await this.publishVersion(trx, relatedCollection, relatedVersionId, visited);
				}
			}
		}

		return liveKey;
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
		const shadowTable = this.versioning.getShadowTableName(collection);

		const versionIds = (await trx(shadowTable).select(VERSION_SYSTEM_FIELDS.id).where(primary, liveKey)).map(
			(row) => row[VERSION_SYSTEM_FIELDS.id],
		);

		// Deleting a live item deletes its versions as well, so they are detached while it's removed
		await trx(shadowTable)
			.update({ [primary]: null })
			.whereIn(VERSION_SYSTEM_FIELDS.id, versionIds);

		await new ItemsService(collection, {
			knex: trx,
			schema: this.schema,
			accountability: this.accountability,
		}).deleteOne(liveKey);

		if (options.keepReference && versionIds.length > 0) {
			await trx(shadowTable)
				.update({ [primary]: liveKey })
				.whereIn(VERSION_SYSTEM_FIELDS.id, versionIds);
		}
	}

	private async readVersion(knex: Knex, collection: string, versionId: PrimaryKey, action: PermissionsAction) {
		const shadowTable = this.versioning.getShadowTableName(collection);

		if (this.accountability) {
			await validateAccess(
				{ accountability: this.accountability, action, collection: shadowTable, primaryKeys: [versionId] },
				{ knex, schema: this.schema },
			);
		}

		const row = await knex.select('*').from(shadowTable).where(VERSION_SYSTEM_FIELDS.id, versionId).first();

		if (!row) throw new ForbiddenError();

		return row as Item;
	}

	private getM2ORelations(collection: string) {
		return this.schema.relations.filter(
			(relation) =>
				relation.collection === collection &&
				(relation.related_collection !== null || relation.meta?.one_allowed_collections),
		);
	}
}

function hasSpecial(field: FieldOverview, specials: string[]) {
	return field.special.some((special) => specials.includes(special));
}
