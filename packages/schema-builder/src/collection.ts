import type { CollectionOverview, FieldOverview } from '@directus/types';
import { ok as assert } from 'node:assert/strict';
import { SchemaBuilder } from './builder.js';
import { COLLECTION_DEFAULTS } from './defaults.js';
import { FieldBuilder } from './field.js';
import { COLLECTION_META_DEFAULTS } from './meta-defaults.js';
import type { RawCollection } from './sai.js';

type InitialCollectionOverview = Omit<CollectionOverview, 'primary' | 'fields'>;
type FinalCollectionOverview = Omit<CollectionOverview, 'fields'>;

export type CollectionOveriewBuilderOptions = Partial<
	Pick<CollectionOverview, 'singleton' | 'accountability' | 'note'>
>;

export class CollectionBuilder {
	_schemaBuilder: SchemaBuilder | undefined;
	_data: InitialCollectionOverview | FinalCollectionOverview;
	_fields: FieldBuilder[] = [];

	constructor(name: string, schema?: SchemaBuilder) {
		this._data = {
			collection: name,
			...COLLECTION_DEFAULTS,
		};

		this._schemaBuilder = schema;
	}

	field(name: string): FieldBuilder {
		const existingField = this._getField(name);

		if (existingField) {
			return existingField;
		}

		const field = new FieldBuilder(name, this._schemaBuilder, this);
		this._fields.push(field);
		return field;
	}

	get_name() {
		return this._data.collection;
	}

	_getField(name: string): FieldBuilder | undefined {
		return this._fields.find((fieldBuilder) => fieldBuilder.get_name() === name)
	}

	_getPrimary(): FieldBuilder | undefined {
		assert('primary' in this._data, `The collection ${this.get_name()} needs a primary key`);

		return this._getField(this._data.primary)
	}

	build(): CollectionOverview {
		assert('primary' in this._data, `The collection ${this.get_name()} needs a primary key`);

		const fields: Record<string, FieldOverview> = {};

		for (const fieldBuilder of this._fields) {
			const field = fieldBuilder.build();
			assert(field.field in fields === false, `Field ${field.field} already exists`);

			fields[field.field] = field;
		}

		const collection: CollectionOverview = {
			...this._data,
			fields,
		};

		return collection;
	}

	sai() {
		const collection: RawCollection = {
			collection: this._data.collection,
			fields: [],
			meta: {
				collection: this._data.collection,
				...COLLECTION_META_DEFAULTS,
			},
			schema: {
				name: this._data.collection,
			}
		}

		for (const fieldBuilder of this._fields) {
			const field = fieldBuilder.sai();

			collection.fields!.push(field)
		}



		return collection
	}
}
