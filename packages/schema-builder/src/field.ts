import { ok as assert } from 'node:assert/strict';
import type { Field, FieldOverview } from '@directus/types';
import { cloneDeep } from 'lodash-es';
import { SchemaBuilder } from './builder.js';
import { CollectionBuilder } from './collection.js';
import {
	alias_field,
	BIG_INTEGER_FIELD,
	BOOLEAN_FIELD,
	CSV_FIELD,
	DATE_FIELD,
	DATE_TIME_FIELD,
	DECIMAL_FIELD,
	type FieldDefaults,
	FLOAT_FIELD,
	HASH_FIELD,
	ID_FIELD,
	INTEGER_FIELD,
	JSON_FIELD,
	M2O_FIELD,
	STRING_FIELD,
	TEXT_FIELD,
	TIME_FIELD,
	TIMESTAMP_FIELD,
	UUID_FIELD,
} from './defaults.js';
import { RelationBuilder } from './relation.js';

type InitialField = {
	field: string;
	_kind: 'initial';
};

type FinishedField = FieldDefaults & { field: string; _kind: 'finished' };

type M2AOptions = {
	o2m_relation: RelationBuilder;
	a2o_relation: RelationBuilder;
};

type M2MOptions = {
	o2m_relation: RelationBuilder;
	m2o_relation: RelationBuilder;
};
export type FieldOveriewBuilderOptions = Partial<Omit<FieldOverview, 'field' | 'type' | 'dbType' | 'alias'>>;

export class FieldBuilder {
	_schema: SchemaBuilder | undefined;
	_collection: CollectionBuilder | undefined;
	_data: InitialField | FinishedField;

	constructor(name: string, schema?: SchemaBuilder, collection?: CollectionBuilder) {
		this._data = {
			field: name,
			_kind: 'initial',
		};

		this._schema = schema;
		this._collection = collection;
	}

	/** Shorthand for creating an integer field and marking it as the primary field */
	id(): this {
		this._data = {
			field: this._data.field,
			...cloneDeep(ID_FIELD),
			_kind: 'finished',
		};

		if (this._collection) this.primary();

		return this;
	}

	options(options: FieldOveriewBuilderOptions): this {
		assert(this._data._kind !== 'initial', 'Cannot configure field before specifing a type');

		const { schema, meta } = this._data;

		if (schema) {
			if (options.defaultValue !== undefined) {
				const auto_increment = options.defaultValue === 'AUTO_INCREMENT';

				schema.has_auto_increment = auto_increment;
				schema.default_value = auto_increment ? null : options.defaultValue;
			}

			if (options.nullable !== undefined) schema.is_nullable = options.nullable;
			if (options.generated !== undefined) schema.is_generated = options.generated;
			if (options.precision !== undefined) schema.numeric_precision = options.precision;
			if (options.scale !== undefined) schema.numeric_scale = options.scale;
		}

		if (options.special !== undefined) meta.special = options.special;
		if (options.note !== undefined) meta.note = options.note;
		if (options.validation !== undefined) meta.validation = options.validation;
		if (options.searchable !== undefined) meta.searchable = options.searchable;

		return this;
	}

	/** Resets the field to it's initial state of only the name */
	overwrite(): this {
		this._data = {
			field: this._data.field,
			_kind: 'initial',
		};

		return this;
	}

	/** Marks the field as the primary field of the collection */
	primary(): this {
		assert(this._collection, 'Can only set to primary on a collection');

		assert(
			this._collection._primary === undefined,
			`The primary key is already set on the collection ${this._collection.get_name()}`,
		);

		this._collection._primary = this._data.field;

		return this;
	}

	/** Marks the field as the sort_field of the collection */
	sort(): void {
		assert(this._collection, 'Can only set to sort on a collection');
		assert(this._collection._data.sort_field === null, 'Can only set a sort field once');

		this._collection._data.sort_field = this._data.field;
	}

	boolean(): this {
		return this.set_type(BOOLEAN_FIELD);
	}

	bigInteger(): this {
		return this.set_type(BIG_INTEGER_FIELD);
	}

	date(): this {
		return this.set_type(DATE_FIELD);
	}

	dateTime(): this {
		return this.set_type(DATE_TIME_FIELD);
	}

	decimal(): this {
		return this.set_type(DECIMAL_FIELD);
	}

	float(): this {
		return this.set_type(FLOAT_FIELD);
	}

	integer(): this {
		return this.set_type(INTEGER_FIELD);
	}

	json(): this {
		return this.set_type(JSON_FIELD);
	}

	string(): this {
		return this.set_type(STRING_FIELD);
	}

	text(): this {
		return this.set_type(TEXT_FIELD);
	}

	time(): this {
		return this.set_type(TIME_FIELD);
	}

	timestamp(): this {
		return this.set_type(TIMESTAMP_FIELD);
	}

	uuid(): this {
		return this.set_type(UUID_FIELD);
	}

	hash(): this {
		return this.set_type(HASH_FIELD);
	}

	csv(): this {
		return this.set_type(CSV_FIELD);
	}

	m2a(related_collections: string[], relation_callback?: (options: M2AOptions) => M2AOptions | void): this {
		this.set_type(alias_field(['m2a']));
		assert(this._schema && this._collection, 'Field needs to be part of a schema');

		const junction_name = `${this._collection.get_name()}_builder`;

		let o2m_relation = new RelationBuilder(this._collection.get_name(), this.get_name())
			.o2m(junction_name, `${this._collection.get_name()}_id`)
			.options({
				meta: {
					junction_field: `item`,
				},
			});

		let a2o_relation = new RelationBuilder(junction_name, 'item').a2o(related_collections).options({
			meta: {
				junction_field: `${this._collection.get_name()}_id`,
			},
		});

		if (relation_callback) {
			const new_relations = relation_callback({ o2m_relation, a2o_relation });

			if (new_relations) {
				o2m_relation = new_relations.o2m_relation;
				a2o_relation = new_relations.a2o_relation;
			}
		}

		this._schema._relations.push(o2m_relation);
		this._schema._relations.push(a2o_relation);

		return this;
	}

	m2m(related_collection: string, relation_callback?: (options: M2MOptions) => M2MOptions | void): this {
		this.set_type(alias_field(['m2m']));
		assert(this._schema && this._collection, 'Field needs to be part of a schema');

		const junction_name = `${this._collection.get_name()}_${related_collection}_junction`;

		let o2m_relation = new RelationBuilder(this._collection.get_name(), this.get_name())
			.o2m(junction_name, `${this._collection.get_name()}_id`)
			.options({
				meta: {
					junction_field: `${related_collection}_id`,
				},
			});

		let m2o_relation = new RelationBuilder(junction_name, `${related_collection}_id`).m2o(related_collection).options({
			meta: {
				junction_field: `${this._collection.get_name()}_id`,
			},
		});

		if (relation_callback) {
			const new_relations = relation_callback({ o2m_relation, m2o_relation });

			if (new_relations) {
				o2m_relation = new_relations.o2m_relation;
				m2o_relation = new_relations.m2o_relation;
			}
		}

		this._schema._relations.push(o2m_relation);
		this._schema._relations.push(m2o_relation);

		return this;
	}

	translations(
		language_collection: string = 'languages',
		relation_callback?: (options: M2MOptions) => M2MOptions | void,
	): this {
		this.set_type(alias_field(['translations']));
		assert(this._schema && this._collection, 'Field needs to be part of a schema');

		this._schema.collection(language_collection, (c) => {
			c.field('code').string().primary();
			c.field('name').string();
			c.field('direction').string().options({ defaultValue: 'ltr' });
		});

		const junction_name = `${this._collection.get_name()}_translations`;

		let o2m_relation = new RelationBuilder(this._collection.get_name(), this.get_name())
			.o2m(junction_name, `${this._collection.get_name()}_id`)
			.options({
				meta: {
					junction_field: `${language_collection}_code`,
				},
			});

		let m2o_relation = new RelationBuilder(junction_name, `${language_collection}_code`)
			.m2o(language_collection)
			.options({
				meta: {
					junction_field: `${this._collection.get_name()}_id`,
				},
			});

		if (relation_callback) {
			const new_relations = relation_callback({ o2m_relation, m2o_relation });

			if (new_relations) {
				o2m_relation = new_relations.o2m_relation;
				m2o_relation = new_relations.m2o_relation;
			}
		}

		this._schema._relations.push(o2m_relation);
		this._schema._relations.push(m2o_relation);

		return this;
	}

	o2m(
		related_collection: string,
		related_field: string,
		relation_callback?: (relation: RelationBuilder) => RelationBuilder | void,
	): this {
		this.set_type(alias_field(['o2m']));
		assert(this._schema && this._collection, 'Field needs to be part of a schema');

		let relation = new RelationBuilder(this._collection.get_name(), this.get_name()).o2m(
			related_collection,
			related_field,
		);

		if (relation_callback) {
			const new_relation = relation_callback(relation);

			if (new_relation) {
				relation = new_relation;
			}
		}

		this._schema._relations.push(relation);

		return this;
	}

	m2o(
		related_collection: string,
		related_field?: string,
		relation_callback?: (relation: RelationBuilder) => RelationBuilder | void,
	): this {
		this.set_type(M2O_FIELD);
		assert(this._schema && this._collection, 'Field needs to be part of a schema');

		let relation = new RelationBuilder(this._collection.get_name(), this.get_name()).m2o(
			related_collection,
			related_field,
		);

		if (relation_callback) {
			const new_relation = relation_callback(relation);

			if (new_relation) {
				relation = new_relation;
			}
		}

		this._schema._relations.push(relation);

		return this;
	}

	a2o(related_collections: string[], relation_callback?: (relation: RelationBuilder) => RelationBuilder | void): this {
		this.set_type(INTEGER_FIELD);
		assert(this._schema && this._collection, 'Field needs to be part of a schema');

		let relation = new RelationBuilder(this._collection.get_name(), this.get_name()).a2o(related_collections);

		if (relation_callback) {
			const new_relation = relation_callback(relation);

			if (new_relation) {
				relation = new_relation;
			}
		}

		this._schema._relations.push(relation);

		return this;
	}

	get_name(): string {
		return this._data.field;
	}

	build(collection: string): Field {
		assert(this._data._kind === 'finished', 'The collection needs at least 1 field configured');

		const { field, type, schema, meta } = this._data;
		const is_primary_key = this._collection?._primary === field;

		return {
			collection,
			field,
			name: field,
			type,
			schema: schema ? { name: field, table: collection, ...schema, is_primary_key } : null,
			// The id is assigned once the whole schema is built
			meta: { id: 0, collection, field, ...meta },
		};
	}

	private set_type(definition: FieldDefaults): this {
		assert(this._data._kind === 'initial', 'Field type was already set');

		this._data = {
			field: this._data.field,
			...cloneDeep(definition),
			_kind: 'finished',
		};

		return this;
	}
}
