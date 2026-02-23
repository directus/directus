import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type {
	AbstractServiceOptions,
	ContentVersion,
	Field,
	RawCollection,
	RawField,
	Relation,
	Type,
} from '@directus/types';
import { cloneDeep, unset } from 'lodash-es';
import { getSchema } from '../utils/get-schema.js';
import { CollectionsService } from './collections.js';
import { FieldsService } from './fields.js';
import { ItemsService } from './items.js';
import { RelationsService } from './relations.js';
import { toVersionedCollectionName } from './versions/to-versioned-collection-name.js';
import { toVersionedRelationName } from './versions/to-versioned-relation-name.js';
import { VERSION_SYSTEM_FIELDS } from './versions/version-system-fields.js';

export class VersionsService extends ItemsService<ContentVersion> {
	constructor(collection: string, options: AbstractServiceOptions) {
		super(collection, options);
	}

	private toVersionCollection(payload: RawCollection) {
		const node = cloneDeep(payload);

		if (node.collection) {
			node.collection = toVersionedCollectionName(node.collection);
		}

		if (node.meta?.versioning) {
			node.meta.versioning = false;
		}

		const fields = Object.values(VERSION_SYSTEM_FIELDS);

		if (node.fields) {
			node.fields.map((f) => fields.push(this.toVersionField(f)));
		}

		node.fields = fields;

		return node;
	}

	private toVersionField<T extends Partial<RawField | Field>>(field: T, opts?: { shadow?: boolean }): T {
		const node = cloneDeep(field);

		// Treat any existing PK as regular field
		if (node.schema?.is_primary_key === true || node.schema?.has_auto_increment === true) {
			node.schema.is_primary_key = false;
			node.schema.has_auto_increment = false;
			node.schema.is_nullable = true;
		}

		if (opts?.shadow) {
			node.field &&= toVersionedRelationName(node.field);
			node.name &&= toVersionedRelationName(node.name);
			node.collection &&= toVersionedCollectionName(node.collection);

			if (node.meta) {
				node.meta.field &&= toVersionedRelationName(node.meta.field);
				node.meta.collection &&= toVersionedCollectionName(node.meta.collection);
			}

			if (node.schema) {
				node.schema.name &&= toVersionedRelationName(node.schema.name);
				node.schema.table &&= toVersionedCollectionName(node.schema.table);
				node.schema.foreign_key_column &&= VERSION_SYSTEM_FIELDS['primary'].field;
				node.schema.foreign_key_table &&= toVersionedCollectionName(node.schema.foreign_key_table);
			}
		} else {
			node.collection &&= toVersionedCollectionName(node.collection);

			if (node.schema) {
				node.schema.table &&= toVersionedCollectionName(node.schema.table);
			}
		}

		if (node.meta) {
			// clear calculated fields
			unset(node.meta, 'id');
			unset(node.meta, 'sort');
		}

		if (node.schema?.is_unique) {
			unset(node.schema, 'is_unique');
		}

		return node;
	}

	private toVersionRelation(relation: Partial<Relation>, opts?: { shadow?: boolean }) {
		const node = cloneDeep(relation);

		if (opts?.shadow) {
			node.field &&= toVersionedRelationName(node.field);
			node.collection &&= toVersionedCollectionName(node.collection);
			node.related_collection &&= toVersionedCollectionName(node.related_collection);

			if (node.schema) {
				node.schema.table &&= toVersionedCollectionName(node.schema.table);
			}
		} else {
			node.collection &&= toVersionedCollectionName(node.collection);

			if (node.schema) {
				node.schema.table &&= toVersionedCollectionName(node.schema.table);
			}
		}

		if (node.meta?.id) {
			unset(node.meta, 'id');
		}

		return node;
	}

	async createTable(payload: RawCollection) {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenError();
		}

		if (payload.schema === null) {
			throw new InvalidPayloadError({ reason: 'Folders cannot be versioned' });
		}

		const versionPayload = this.toVersionCollection(payload);

		const collectionService = new CollectionsService({
			schema: this.schema,
			knex: this.knex,
			accountability: this.accountability,
		});

		await collectionService.createOne(versionPayload);
	}

	async createField(
		collection: string,
		field: Partial<Field> & { field: string; type: Type | null },
		opts?: { shadow: boolean },
	) {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenError();
		}

		const versionCollection = toVersionedCollectionName(collection);

		const versionField = this.toVersionField(field, opts);

		const fieldsService = new FieldsService({
			schema: this.schema,
			knex: this.knex,
			accountability: this.accountability,
		});

		await fieldsService.createField(versionCollection, versionField);
	}

	async createRelation(relation: Partial<Relation>) {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenError();
		}

		const versionPayload = this.toVersionRelation(relation);

		let relationsService = new RelationsService({
			schema: this.schema,
			knex: this.knex,
			accountability: this.accountability,
		});

		await relationsService.createOne(versionPayload);

		// create duplicate
		const fieldsService = new FieldsService({
			knex: this.knex,
			schema: this.schema,
			accountability: this.accountability,
		});

		const field = (await fieldsService.readOne(relation.collection!, relation.field!)) as Field;

		await this.createField(field.collection, field, { shadow: true });

		const versionDuplicatePayload = this.toVersionRelation(relation, { shadow: true });

		// Refresh schema for field create
		relationsService = new RelationsService({
			schema: await getSchema({ database: this.knex }),
			knex: this.knex,
			accountability: this.accountability,
		});

		await relationsService.createOne(versionDuplicatePayload);
	}

	async dropTable(collectionKey: string) {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenError();
		}

		const collectionService = new CollectionsService({
			schema: this.schema,
			knex: this.knex,
			accountability: this.accountability,
		});

		await collectionService.deleteOne(toVersionedCollectionName(collectionKey));
	}
}
