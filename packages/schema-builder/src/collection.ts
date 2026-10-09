import { ok as assert } from 'node:assert/strict';
import type { Collection, CollectionMeta, CollectionOverview, Field } from '@directus/types';
import { SchemaBuilder } from './builder.js';
import { COLLECTION_META_DEFAULTS } from './defaults.js';
import { FieldBuilder } from './field.js';

export type CollectionOveriewBuilderOptions = Partial<
	Pick<CollectionOverview, 'singleton' | 'accountability' | 'note' | 'status'> & Pick<CollectionMeta, 'versioning'>
>;

export type BuiltCollection = {
	collection: Collection;
	fields: Field[];
};

export class CollectionBuilder {
	_schemaBuilder: SchemaBuilder | undefined;
	_data: CollectionMeta;
	_primary: string | undefined;
	_fields: FieldBuilder[] = [];

	constructor(name: string, schema?: SchemaBuilder) {
		this._data = {
			collection: name,
			...COLLECTION_META_DEFAULTS,
		};

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

	build(): BuiltCollection {
		assert(this._primary !== undefined, `The collection ${this.get_name()} needs a primary key`);

		const fields: Field[] = [];

		for (const fieldBuilder of this._fields) {
			const field = fieldBuilder.build(this.get_name());

			assert(
				fields.every(({ field: name }) => name !== field.field),
				`Field ${field.field} already exists`,
			);

			fields.push(field);
		}

		return {
			collection: {
				collection: this.get_name(),
				meta: { ...this._data },
				schema: { name: this.get_name() },
			},
			fields,
		};
	}
}
