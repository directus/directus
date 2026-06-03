import { ok as assert } from 'node:assert/strict';
import type { CollectionOverview, FieldOverview, SchemaOverview } from '@directus/types';
import { SchemaBuilder } from './builder.js';
import { COLLECTION_DEFAULTS } from './defaults.js';
import { FieldBuilder } from './field.js';

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
		} satisfies InitialCollectionOverview;

		this._schemaBuilder = schema;
	}

	field(name: string): FieldBuilder {
		const existingField = this._fields.find((fieldBuilder) => fieldBuilder.get_name() === name);

		if (existingField) {
			return existingField;
		}

		const field = new FieldBuilder(name, this._schemaBuilder, this);
		this._fields.push(field);
		return field;
	}

	get_name(): string {
		return this._data.collection;
	}

	build(schema: SchemaOverview): CollectionOverview {
		assert('primary' in this._data, `The collection ${this.get_name()} needs a primary key`);

		const fields: Record<string, FieldOverview> = {};

		for (const fieldBuilder of this._fields) {
			const field = fieldBuilder.build(schema);
			assert(field.field in fields === false, `Field ${field.field} already exists`);

			fields[field.field] = field;
		}

		const collection: CollectionOverview = {
			...this._data,
			fields,
		};

		return collection;
	}
}
