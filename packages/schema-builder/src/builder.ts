import { ok as assert } from 'node:assert/strict';
import type { SchemaOverview } from '@directus/types';
import { CollectionBuilder, type CollectionOveriewBuilderOptions } from './collection.js';
import { RelationBuilder } from './relation.js';

export class SchemaBuilder {
	_collections: CollectionBuilder[] = [];
	_relations: RelationBuilder[] = [];
	_last_collection_configured = true;
	_relation_counter = 0;

	collection(name: string, callback: (collection: CollectionBuilder) => void) {
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

	options(options: CollectionOveriewBuilderOptions) {
		assert(this._collections.length > 0, "You need at least 1 collection to configure it's options");
		assert(this._last_collection_configured === false, 'You can only configure a collection once');

		const lastCollection = this._collections.at(-1)!;

		Object.assign(lastCollection._data, options);

		this._last_collection_configured = true;
	}

	next_relation_index() {
		return this._relation_counter++;
	}

	build(): SchemaOverview {
		const schema: SchemaOverview = {
			collections: {},
			relations: [],
		};

		for (const collectionBuilder of this._collections) {
			const collection = collectionBuilder.build(schema);

			assert(
				collection.collection in schema.collections === false,
				`Collection ${collection.collection} already exists`,
			);

			schema.collections[collection.collection] = collection;
		}

		for (const relationBuilder of this._relations) {
			const relation = relationBuilder.build(schema);
			schema.relations.push(relation);
		}

		return schema;
	}
}
