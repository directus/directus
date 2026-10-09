import { ok as assert } from 'node:assert/strict';
import type { Collection, DatabaseClient, Field, Relation, SchemaOverview, Snapshot } from '@directus/types';
import { omit } from 'lodash-es';
import { CollectionBuilder, type CollectionOveriewBuilderOptions } from './collection.js';
import { RelationBuilder } from './relation.js';
import { toSchemaOverview } from './schema-overview.js';
import { toTypeScript, type TypeScriptOptions } from './typescript.js';

export type BuiltSchema = {
	collections: Collection[];
	fields: Field[];
	relations: Relation[];
};

export type SnapshotOptions = {
	/** Directus version of the instance the snapshot is applied to, has to match unless the apply is forced */
	directus?: string;
	vendor?: DatabaseClient;
};

export class SchemaBuilder {
	_collections: CollectionBuilder[] = [];
	_relations: RelationBuilder[] = [];
	_last_collection: CollectionBuilder | undefined;
	_last_collection_configured = true;
	_relation_counter = 0;

	collection(name: string, callback: (collection: CollectionBuilder) => void): this {
		const existing_index = this._collections.findIndex((collectionBuilder) => collectionBuilder.get_name() === name);

		if (existing_index !== -1) {
			const existing = this._collections[existing_index]!;
			callback(existing);
			this._last_collection = existing;
			this._last_collection_configured = false;
			return this;
		}

		const collection = new CollectionBuilder(name, this);
		callback(collection);
		this._collections.push(collection);
		this._last_collection = collection;
		this._last_collection_configured = false;

		return this;
	}

	options(options: CollectionOveriewBuilderOptions): this {
		assert(this._last_collection, "You need at least 1 collection to configure it's options");
		assert(this._last_collection_configured === false, 'You can only configure a collection once');

		Object.assign(this._last_collection._data, options);

		this._last_collection_configured = true;

		return this;
	}

	next_relation_index(): number {
		return this._relation_counter++;
	}

	/** Builds the schema as collections, fields and relations including their ids */
	build_schema(): BuiltSchema {
		const schema: BuiltSchema = {
			collections: [],
			fields: [],
			relations: [],
		};

		for (const collectionBuilder of this._collections) {
			const { collection, fields } = collectionBuilder.build();

			assert(
				schema.collections.every(({ collection: name }) => name !== collection.collection),
				`Collection ${collection.collection} already exists`,
			);

			schema.collections.push(collection);
			schema.fields.push(...fields);
		}

		for (const relationBuilder of this._relations) {
			const relation = relationBuilder.build(schema);
			schema.relations.push(relation);
		}

		schema.fields.forEach((field, index) => {
			field.meta!.id = index + 1;
		});

		return schema;
	}

	build(): SchemaOverview {
		return toSchemaOverview(this.build_schema());
	}

	/** Builds a schema snapshot that can be applied to a Directus instance */
	snapshot(options: SnapshotOptions = {}): Snapshot {
		const { collections, fields, relations } = this.build_schema();

		return {
			version: 1,
			directus: options.directus ?? '0.0.0',
			...(options.vendor && { vendor: options.vendor }),
			collections: collections as Snapshot['collections'],
			fields: fields.map((field) => omit(field, ['name', 'meta.id'])) as Snapshot['fields'],
			systemFields: [],
			relations: relations.map((relation) => omit(relation, 'meta.id')) as Snapshot['relations'],
		};
	}

	/** Generates TypeScript interfaces for the schema, in the shape the Directus SDK expects */
	types(options?: TypeScriptOptions): string {
		return toTypeScript(this.build_schema(), options);
	}
}
