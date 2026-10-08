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
	/** Suffixes all collection names with `_1234`, so the e2e tests can replace them with unique names */
	test_schema?: boolean;
};

export const TEST_SCHEMA_SUFFIX = '_1234';

export class SchemaBuilder {
	_collections: CollectionBuilder[] = [];
	_relations: RelationBuilder[] = [];
	_last_collection_configured = true;
	_relation_counter = 0;

	collection(name: string, callback: (collection: CollectionBuilder) => void): this {
		const existing_index = this._collections.findIndex((collectionBuilder) => collectionBuilder.get_name() === name);

		if (existing_index !== -1) {
			callback(this._collections[existing_index]!);
			this._last_collection_configured = false;
			return this;
		}

		const collection = new CollectionBuilder(name, this);
		callback(collection);
		this._collections.push(collection);
		this._last_collection_configured = false;

		return this;
	}

	options(options: CollectionOveriewBuilderOptions): this {
		assert(this._collections.length > 0, "You need at least 1 collection to configure it's options");
		assert(this._last_collection_configured === false, 'You can only configure a collection once');

		const lastCollection = this._collections.at(-1)!;

		Object.assign(lastCollection._data, options);

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
		let schema = this.build_schema();

		if (options.test_schema) schema = suffix_collections(schema);

		const { collections, fields, relations } = schema;

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

/** Suffixes all collection names and the references to them with `TEST_SCHEMA_SUFFIX` */
function suffix_collections({ collections, fields, relations }: BuiltSchema): BuiltSchema {
	const suffix = <T extends string | null | undefined>(name: T): T =>
		name ? ((name + TEST_SCHEMA_SUFFIX) as T) : name;

	return {
		collections: collections.map((collection) => ({
			...collection,
			collection: suffix(collection.collection),
			meta: collection.meta && {
				...collection.meta,
				collection: suffix(collection.meta.collection),
				group: suffix(collection.meta.group),
			},
			schema: collection.schema && { ...collection.schema, name: suffix(collection.schema.name) },
		})),
		fields: fields.map((field) => ({
			...field,
			collection: suffix(field.collection),
			meta: field.meta && { ...field.meta, collection: suffix(field.meta.collection) },
			schema: field.schema && { ...field.schema, table: suffix(field.schema.table) },
		})),
		relations: relations.map((relation) => ({
			...relation,
			collection: suffix(relation.collection),
			related_collection: suffix(relation.related_collection),
			meta: relation.meta && {
				...relation.meta,
				many_collection: suffix(relation.meta.many_collection),
				one_collection: suffix(relation.meta.one_collection),
				one_allowed_collections: relation.meta.one_allowed_collections?.map(suffix) ?? null,
			},
			schema: relation.schema && {
				...relation.schema,
				table: suffix(relation.schema.table),
				foreign_key_table: suffix(relation.schema.foreign_key_table),
			},
		})),
	};
}
