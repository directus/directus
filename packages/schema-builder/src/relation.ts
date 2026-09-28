import { ok as assert } from 'node:assert/strict';
import type { DeepPartial, Relation } from '@directus/types';
import { merge } from 'lodash-es';
import type { BuiltSchema, SchemaBuilder } from './builder.js';
import { CollectionBuilder } from './collection.js';
import { RELATION_DEFAULTS } from './defaults.js';
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

	o2m(related_collection: string, related_field: string): this {
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

	m2o(related_collection: string, related_field?: string): this {
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

	a2o(related_collections: string[]): this {
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

	options(options: RelationOveriewBuilderOptions): this {
		assert(this._data._kind === 'finished', 'Relation is not yet configured');

		merge(this._data, options);

		return this;
	}

	build(schema: BuiltSchema): Relation {
		assert(this._data._kind === 'finished', 'Relation type is not configured');

		const has_collection = (name: string) => schema.collections.some(({ collection }) => collection === name);

		const has_field = (collection: string, name: string) =>
			schema.fields.some((field) => field.collection === collection && field.field === name);

		const add_collection = (name: string) => {
			const collection = new CollectionBuilder(name);

			collection.field('id').id();

			const built = collection.build();
			schema.collections.push(built.collection);
			schema.fields.push(...built.fields);
		};

		// Generate related collection if not exists
		if (this._data._type === 'm2o' || this._data._type === 'o2m') {
			if (this._data.related_collection && has_collection(this._data.related_collection) === false) {
				add_collection(this._data.related_collection);
			}
		}

		// Generate existing collection, if not exists
		if (this._data.collection && has_collection(this._data.collection) === false) {
			add_collection(this._data.collection);
		}

		const collection = this._data.collection;

		// Generate field for collection, if not exists
		if (this._data.field && has_field(collection, this._data.field) === false) {
			const key_type = schema.fields.find(
				(field) => field.collection === collection && field.schema?.is_primary_key,
			)!.type;

			assert(
				key_type === 'integer' || key_type === 'string',
				`Cannot generate related field for primary key type ${key_type}`,
			);

			const field = new FieldBuilder(this._data.field)[key_type]();

			schema.fields.push(field.build(collection));
		}

		// Generate collection field and related a2o collections, for those that don't exist
		if (this._data._type === 'a2o') {
			const collection_field = this._data.meta?.one_collection_field;

			if (collection_field && has_field(collection, collection_field) === false) {
				const field = new FieldBuilder(collection_field).string();

				schema.fields.push(field.build(collection));
			}

			for (const collection_name of this._data.meta?.one_allowed_collections ?? []) {
				if (has_collection(collection_name)) continue;

				add_collection(collection_name);
			}
		}

		const { _kind, _type, ...relation } = this._data;
		return relation;
	}
}
