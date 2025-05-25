import type { Relation, SchemaOverview } from '@directus/types';
import { ok as assert } from 'node:assert/strict';
import { CollectionBuilder, type CollectionOveriewBuilderOptions } from './collection.js';
import { RelationBuilder } from './relation.js';
import { SAI, type RawCollection } from './sai.js';

export class SchemaBuilder {
	_collections: CollectionBuilder[] = [];
	_relations: RelationBuilder[] = [];
	_last_collection_configured = true;
	_relation_counter = 0;

	collection(name: string, callback: (collection: CollectionBuilder) => void) {
		const existing_collection = this._getCollection(name)

		if (existing_collection) {
			callback(existing_collection);
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

	_getCollection(name: string): CollectionBuilder | undefined {
		return this._collections.find((collectionBuilder) => collectionBuilder.get_name() === name);
	}

	build(): SchemaOverview {
		const schema: SchemaOverview = {
			collections: {},
			relations: [],
		};

		for (const relationBuilder of this._relations) {
			relationBuilder.fillGaps()
		}

		for (const collectionBuilder of this._collections) {
			const collection = collectionBuilder.build();

			assert(
				collection.collection in schema.collections === false,
				`Collection ${collection.collection} already exists`,
			);

			schema.collections[collection.collection] = collection;
		}

		for (const relationBuilder of this._relations) {
			schema.relations.push(relationBuilder.build());
		}

		return schema;
	}

	sai(): SAI {
		const collections: RawCollection[] = []
		const relations: Relation[] = []

		for (const relationBuilder of this._relations) {
			relationBuilder.fillGaps()
		}

		for (const collectionBuilder of this._collections) {
			collections.push(collectionBuilder.sai())
		}

		for (const relationBuilder of this._relations) {
			relations.push(relationBuilder.sai());
		}

		return new SAI(collections, relations)
	}
}
