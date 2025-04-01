import { FieldOverview } from '@directus/types';
import { SchemaBuilder } from './builder';
import {
	BIG_INTEGER_FIELD,
	BOOLEAN_FIELD,
	CSV_FIELD,
	DATE_FIELD,
	DATE_TIME_FIELD,
	DECIMAL_FIELD,
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
} from './defaults';
import { CollectionBuilder } from './collection';
import { ok as assert } from 'node:assert/strict';

type InitialFieldOverview = {
	field: string;
	_kind: 'initial';
};

type FinishedFieldOverview = FieldOverview & { _kind: 'finished' };

export class FieldBuilder {
	_schema?: SchemaBuilder;
	_collection?: CollectionBuilder;
	_data: InitialFieldOverview | FinishedFieldOverview;

	constructor(name: string, schema?: SchemaBuilder, collection?: CollectionBuilder) {
		this._data = {
			field: name,
			_kind: 'initial',
		};

		this._schema = schema;
		this._collection = collection;
	}

	id() {
		this._data = {
			field: this._data.field,
			...ID_FIELD,
			_kind: 'finished',
		};

		if (this._collection) this.primary();

		return this;
	}

	primary() {
		assert(this._collection, 'Can only set to primary on a collection');
		assert('primary' in this._collection._data === false, 'The primary key is already set on the collection');

		this._collection._data = {
			primary: this._data.field,
			...this._collection._data,
		};

		return this;
	}

	sort() {
		assert(this._collection, 'Can only set to sort on a collection');
		assert(this._collection._data.sortField === null, 'Can only set a sort field once');

		this._collection._data = {
			...this._collection._data,
			sortField: this._data.field,
		};
	}

	boolean() {
		this._data = {
			field: this._data.field,
			...BOOLEAN_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	bigInteger() {
		this._data = {
			field: this._data.field,
			...BIG_INTEGER_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	date() {
		this._data = {
			field: this._data.field,
			...DATE_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	dateTime() {
		this._data = {
			field: this._data.field,
			...DATE_TIME_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	decimal() {
		this._data = {
			field: this._data.field,
			...DECIMAL_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	float() {
		this._data = {
			field: this._data.field,
			...FLOAT_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	integer() {
		this._data = {
			field: this._data.field,
			...INTEGER_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	json() {
		this._data = {
			field: this._data.field,
			...JSON_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	string() {
		this._data = {
			field: this._data.field,
			...STRING_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	text() {
		this._data = {
			field: this._data.field,
			...TEXT_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	time() {
		this._data = {
			field: this._data.field,
			...TIME_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	timestamp() {
		this._data = {
			field: this._data.field,
			...TIMESTAMP_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	uuid() {
		this._data = {
			field: this._data.field,
			...UUID_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	hash() {
		this._data = {
			field: this._data.field,
			...HASH_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	csv() {
		this._data = {
			field: this._data.field,
			...CSV_FIELD,
			_kind: 'finished',
		};

		return this;
	}

	// m2a() {

	// }

	// m2m() {

	// }

	// o2m() {

	// }

	// m2o() {

	// }

	// translations() {

	// }

	build(): FieldOverview {
		assert(this._data._kind === 'finished', 'The collection needs at least 1 field configured');

		delete this._data._kind;

		return this._data;
	}
}
