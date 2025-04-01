import { SchemaOverview } from '@directus/types';
import { CollectionBuilder, CollectionOveriewBuilderOptions } from './collection';
import { RelationBuilder } from './relation';
import { ok as assert } from 'node:assert/strict';

export class SchemaBuilder {
	_collections: CollectionBuilder[] = [];
	_relations: RelationBuilder[] = [];
	_last_collection_configured = true;

	collection(name: string, callback: (collection: CollectionBuilder) => void) {
		const collection = new CollectionBuilder(name, this);
		callback(collection);
		this._collections.push(collection);
		this._last_collection_configured = false;

		return this;
	}

	options(options: CollectionOveriewBuilderOptions) {
		assert(this._collections.length > 0, "You need at least 1 collection to configure it's options");
		assert(this._last_collection_configured === false, 'You can only configure a collection once');

		const lastCollection = this._collections.at(-1);

		lastCollection._data = {
			...lastCollection._data,
			...options,
		};

		this._last_collection_configured = true;
	}

	build(): SchemaOverview {
		const schema: SchemaOverview = {
			collections: {},
			relations: [],
		};

		for (const collectionBuilder of this._collections) {
			const collection = collectionBuilder.build();
			schema.collections[collection.collection] = collection;
		}

		for (const relationBuilder of this._relations) {
			const relation = relationBuilder.build();
			schema.relations.push(relation);
		}

		return schema;
	}
}
