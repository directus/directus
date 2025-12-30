import { SchemaBuilder } from './builder.js';
import { CollectionBuilder } from './collection.js';
import {
	BIG_INTEGER_FIELD,
	BOOLEAN_FIELD,
	CSV_FIELD,
	DATE_FIELD,
	DATE_TIME_FIELD,
	DECIMAL_FIELD,
	FIELD_DEFAULTS,
	FLOAT_FIELD,
	HASH_FIELD,
	ID_FIELD,
	INTEGER_FIELD,
	JSON_FIELD,
	STRING_FIELD,
	TEXT_FIELD,
	TIME_FIELD,
	TIMESTAMP_FIELD,
	UUID_FIELD,
} from './defaults.js';
import { RelationBuilder } from './relation.js';
import type { FieldOverview, SchemaOverview } from '@directus/types';
import { ok as assert } from 'node:assert/strict';

type InitialFieldOverview = {
	field: string;
	_kind: 'initial';
};

type FinishedFieldOverview = FieldOverview & { _kind: 'finished' };

type M2AOptions = {
	o2m_relation: RelationBuilder;
	a2o_relation: RelationBuilder;
};

type M2MOptions = {
	o2m_relation: RelationBuilder;
	m2o_relation: RelationBuilder;
};
export type FieldOveriewBuilderOptions = Partial<Omit<FieldOverview, 'field' | 'type' | 'dbType'>>;

export class FieldBuilder {
	_schema: SchemaBuilder | undefined;
	_collection: CollectionBuilder | undefined;
	_data: InitialFieldOverview | FinishedFieldOverview;

	constructor(name: string, schema?: SchemaBuilder, collection?: CollectionBuilder) {
		this._data = {
			field: name,
			_kind: 'initial',
		};

		this._schema = schema;
		this._collection = collection;
	}

	/** Shorthand for creating an integer field and marking it as the primary field */
	id() {
		this._data = {
			field: this._data.field,
			...ID_FIELD,
			_kind: 'finished',
		};

		if (this._collection) this.primary();

		return this;
	}

	options(options: FieldOveriewBuilderOptions) {
		assert(this._data._kind !== 'initial', 'Cannot configure field before specifing a type');

		Object.assign(this._data, options);

		return this;
	}

	/** Resets the field to it's initial state of only the name */
	overwrite() {
		this._data = {
			field: this._data.field,
			_kind: 'initial',
		};

		return this;
	}

	/** Marks the field as the primary field of the collection */
	primary() {
		assert(this._collection, 'Can only set to primary on a collection');

		assert(
			'primary' in this._collection._data === false,
			`The primary key is already set on the collection ${this._collection.get_name()}`,
		);

		this._collection._data = {
			primary: this._data.field,
			...this._collection._data,
		};

		return this;
	}

	/** Marks the field as the sort_field of the collection */
	sort() {
		assert(this._collection, 'Can only set to sort on a collection');
		assert(this._collection._data.sortField === null, 'Can only set a sort field once');

		this._collection._data = {
			...this._collection._data,
			sortField: this._data.field,
		};
	}

	boolean() {
		assert(this._data._kind === 'initial', 'Field type was already set');

		this._data = {
			field: this._data.field,
			...BOOLEAN_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	bigInteger() {
		assert(this._data._kind === 'initial', 'Field type was already set');

		this._data = {
			field: this._data.field,
			...BIG_INTEGER_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	date() {
		assert(this._data._kind === 'initial', 'Field type was already set');

		this._data = {
			field: this._data.field,
			...DATE_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	dateTime() {
		assert(this._data._kind === 'initial', 'Field type was already set');

		this._data = {
			field: this._data.field,
			...DATE_TIME_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	decimal() {
		assert(this._data._kind === 'initial', 'Field type was already set');

		this._data = {
			field: this._data.field,
			...DECIMAL_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	float() {
		assert(this._data._kind === 'initial', 'Field type was already set');

		this._data = {
			field: this._data.field,
			...FLOAT_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	integer() {
		assert(this._data._kind === 'initial', 'Field type was already set');

		this._data = {
			field: this._data.field,
			...INTEGER_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	json() {
		assert(this._data._kind === 'initial', 'Field type was already set');

		this._data = {
			field: this._data.field,
			...JSON_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	string() {
		assert(this._data._kind === 'initial', 'Field type was already set');

		this._data = {
			field: this._data.field,
			...STRING_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	text() {
		assert(this._data._kind === 'initial', 'Field type was already set');

		this._data = {
			field: this._data.field,
			...TEXT_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	time() {
		assert(this._data._kind === 'initial', 'Field type was already set');

		this._data = {
			field: this._data.field,
			...TIME_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	timestamp() {
		assert(this._data._kind === 'initial', 'Field type was already set');

		this._data = {
			field: this._data.field,
			...TIMESTAMP_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	uuid() {
		assert(this._data._kind === 'initial', 'Field type was already set');

		this._data = {
			field: this._data.field,
			...UUID_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	hash() {
		assert(this._data._kind === 'initial', 'Field type was already set');

		this._data = {
			field: this._data.field,
			...HASH_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	csv() {
		assert(this._data._kind === 'initial', 'Field type was already set');

		this._data = {
			field: this._data.field,
			...CSV_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	m2a(related_collections: string[], relation_callback?: (options: M2AOptions) => M2AOptions | void) {
		assert(this._data._kind === 'initial', 'Field type was already set');
		assert(this._schema && this._collection, 'Field needs to be part of a schema');

		this._data = {
			field: this._data.field,
			...FIELD_DEFAULTS,
			type: 'alias',
			dbType: null,
			special: ['m2a'],
			_kind: 'finished',
		};

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

	m2m(related_collection: string, relation_callback?: (options: M2MOptions) => M2MOptions | void) {
		assert(this._data._kind === 'initial', 'Field type was already set');
		assert(this._schema && this._collection, 'Field needs to be part of a schema');

		this._data = {
			field: this._data.field,
			...FIELD_DEFAULTS,
			type: 'alias',
			dbType: null,
			special: ['m2m'],
			_kind: 'finished',
		};

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
	) {
		assert(this._data._kind === 'initial', 'Field type was already set');
		assert(this._schema && this._collection, 'Field needs to be part of a schema');

		this._data = {
			field: this._data.field,
			...FIELD_DEFAULTS,
			type: 'alias',
			dbType: null,
			special: ['translations'],
			_kind: 'finished',
		};

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
	) {
		assert(this._data._kind === 'initial', 'Field type was already set');
		assert(this._schema && this._collection, 'Field needs to be part of a schema');

		this._data = {
			field: this._data.field,
			...FIELD_DEFAULTS,
			type: 'alias',
			dbType: null,
			special: ['o2m'],
			_kind: 'finished',
		};

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
	) {
		assert(this._data._kind === 'initial', 'Field type was already set');
		assert(this._schema && this._collection, 'Field needs to be part of a schema');

		this._data = {
			field: this._data.field,
			...FIELD_DEFAULTS,
			type: 'integer',
			dbType: 'integer',
			special: ['m2o'],
			_kind: 'finished',
		};

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

	a2o(related_collections: string[], relation_callback?: (relation: RelationBuilder) => RelationBuilder | void) {
		assert(this._data._kind === 'initial', 'Field type was already set');
		assert(this._schema && this._collection, 'Field needs to be part of a schema');

		this._data = {
			field: this._data.field,
			...FIELD_DEFAULTS,
			type: 'integer',
			dbType: 'integer',
			special: [],
			_kind: 'finished',
		};

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

	get_name() {
		return this._data.field;
	}

	build(_schema: SchemaOverview): FieldOverview {
		assert(this._data._kind === 'finished', 'The collection needs at least 1 field configured');

		const { _kind, ...field } = this._data;

		return field;
	}
}
