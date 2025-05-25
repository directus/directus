import type { DeepPartial, Relation, SchemaOverview } from '@directus/types';
import { RELATION_DEFAULTS } from './defaults.js';
import { ok as assert } from 'node:assert/strict';
import type { SchemaBuilder } from './builder.js';
import { merge } from 'lodash-es';
import { CollectionBuilder } from './collection.js';
import { FieldBuilder } from './field.js';

export type InitialRelationOverview = Pick<Relation, 'collection' | 'field'> & { _kind: 'initial' };
export type FinalRelationOverview = Relation & { _kind: 'finished'; _type: 'o2m' | 'm2o' | 'a2o' };

export type RelationOveriewBuilderOptions = DeepPartial<{
	meta: Pick<NonNullable<Relation['meta']>, 'id' | 'junction_field' | 'sort_field'>;
	schema: Pick<NonNullable<Relation['schema']>, 'constraint_name' | 'foreign_key_schema'>;
}>;

export class RelationBuilder {
	_schemaBuilder: SchemaBuilder | undefined;
	_data: InitialRelationOverview | FinalRelationOverview;

	constructor(collection: string, field: string, schema?: SchemaBuilder) {
		this._data = {
			collection,
			field,
			_kind: 'initial',
		};

		this._schemaBuilder = schema;
	}

	o2m(related_collection: string, related_field: string) {
		assert(this._data._kind === 'initial', 'Relation is already configured');

		merge(this._data, RELATION_DEFAULTS, {
			collection: related_collection,
			field: related_field,
			related_collection: this._data.collection,
			meta: {
				many_collection: related_collection,
				many_field: related_field,
				one_collection: this._data.collection,
				one_field: this._data.field,
				one_collection_field: null,
				one_allowed_collections: null,
				id: this._schemaBuilder?.next_relation_index() ?? 0,
				junction_field: null,
			},
			schema: {
				constraint_name: `${this._data.collection}_${this._data.field}_foreign`,
				table: this._data.collection,
				column: this._data.field,
				foreign_key_table: related_collection,
			},
			_kind: 'finished',
			_type: 'o2m',
		} satisfies DeepPartial<FinalRelationOverview>);

		return this;
	}

	m2o(related_collection: string, related_field?: string) {
		assert(this._data._kind === 'initial', 'Relation is already configured');

		merge(this._data, RELATION_DEFAULTS, {
			collection: this._data.collection,
			field: this._data.field,
			related_collection,
			meta: {
				many_collection: this._data.collection,
				many_field: this._data.field,
				one_collection: related_collection,
				one_field: related_field ?? null,
				one_collection_field: null,
				one_allowed_collections: null,
				id: this._schemaBuilder?.next_relation_index() ?? 0,
				junction_field: null,
			},
			schema: {
				constraint_name: `${this._data.collection}_${this._data.field}_foreign`,
				table: this._data.collection,
				column: this._data.field,
				foreign_key_table: related_collection,
			},
			_kind: 'finished',
			_type: 'm2o',
		} satisfies DeepPartial<FinalRelationOverview>);

		return this;
	}

	a2o(related_collections: string[]) {
		assert(this._data._kind === 'initial', 'Relation is already configured');

		merge(this._data, RELATION_DEFAULTS, {
			collection: this._data.collection,
			field: this._data.field,
			related_collection: null,
			meta: {
				many_collection: this._data.collection,
				many_field: this._data.field,
				one_collection: null,
				one_field: null,
				one_collection_field: 'collection',
				one_allowed_collections: related_collections,
				id: this._schemaBuilder?.next_relation_index() ?? 0,
				junction_field: null,
			},
			schema: null,
			_kind: 'finished',
			_type: 'a2o',
		} satisfies DeepPartial<FinalRelationOverview>);

		return this;
	}

	options(options: RelationOveriewBuilderOptions) {
		assert(this._data._kind === 'finished', 'Relation is not yet configured');

		merge(this._data, options);

		return this;
	}

	fillGaps() {
		assert(this._schemaBuilder, "Filling gaps only works inside a schema")
		assert(this._data._kind === 'finished', 'Relation type is not configured');

		// Generate related collection if not exists
		if (this._data._type === 'm2o' || this._data._type === 'o2m') {
			if (this._data.related_collection && this._schemaBuilder._getCollection(this._data.related_collection) === undefined) {
				const collection = new CollectionBuilder(this._data.related_collection);

				collection.field('id').id();

				this._schemaBuilder._collections.push(collection)
			}
		}

		// Generate existing collection, if not exists
		if (this._data.collection && this._schemaBuilder._getCollection(this._data.collection) === undefined) {
			const collection = new CollectionBuilder(this._data.collection);

			collection.field('id').id();

			this._schemaBuilder._collections.push(collection)
		}

		const collection = this._schemaBuilder._getCollection(this._data.collection)!;

		// Generate field for collection, if not exists
		if (this._data.field && collection._getField(this._data.field) === undefined) {
			const key_type = collection._getPrimary()!._getType();

			assert(
				key_type === 'integer' || key_type === 'string',
				`Cannot generate related field for primary key type ${key_type}`,
			);

			const field = new FieldBuilder(this._data.field, this._schemaBuilder, collection)[key_type]();

			collection._fields.push(field)
		}

		// Generate collection field and related a2o collections, for those that don't exist
		if (this._data._type === 'a2o') {
			const collection_field = this._data.meta?.one_collection_field;

			if (collection_field && collection._getField(collection_field) === undefined) {
				const field = new FieldBuilder(collection_field, this._schemaBuilder, collection).string();

				collection._fields.push(field)
			}

			for (const collection_name of this._data.meta?.one_allowed_collections ?? []) {
				if (this._schemaBuilder._getCollection(collection_name)) continue;

				const collection = new CollectionBuilder(collection_name);

				collection.field('id').id();

				this._schemaBuilder._collections.push(collection)
			}
		}
	}

	build(): Relation {
		assert(this._data._kind === 'finished', 'Relation type is not configured');

		const { _kind, _type, ...relation } = this._data;
		return relation;
	}

	sai(): Relation {
		return this.build()
	}
}
