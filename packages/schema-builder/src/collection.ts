import { CollectionOverview } from '@directus/types';
import { SchemaBuilder } from './builder';
import { FieldBuilder } from './field';
import { ok as assert } from 'node:assert/strict';
import { COLLECTION_DEFAULTS } from './defaults';

type InitialCollectionOverview = Omit<CollectionOverview, 'primary' | 'fields'>;
type FinalCollectionOverview = Omit<CollectionOverview, 'fields'>;

export type CollectionOveriewBuilderOptions = Partial<
	Pick<CollectionOverview, 'singleton' | 'accountability' | 'note'>
>;

export class CollectionBuilder {
	_schemaBuilder: SchemaBuilder;
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
		const field = new FieldBuilder(name, this._schemaBuilder, this);
		this._fields.push(field);
		return field;
	}

	build(): CollectionOverview {
		assert('primary' in this._data, 'The collection needs a primary key');

		const fields = {};

		for (const fieldBuilder of this._fields) {
			const field = fieldBuilder.build();
			fields[field.field] = field;
		}

		const collection: CollectionOverview = {
			...this._data,
			fields,
		};

		return collection;
	}
}
