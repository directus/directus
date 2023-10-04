import type { Query } from '@directus/types';
import { omit } from 'lodash-es';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { getUrl, type Env } from './config';
import vendors, { type Vendor } from './get-dbs-to-test';
import type { PrimaryKeyType } from './types';
import { USER } from './variables';

export function DisableTestCachingSetup() {
	beforeEach(async () => {
		process.env['TEST_NO_CACHE'] = 'true';
	});

	afterAll(async () => {
		delete process.env['TEST_NO_CACHE'];
	});
}

export function ClearCaches() {
	describe('Clear Caches', () => {
		it.each(vendors)(
			'%s',
			async (vendor) => {
				// Setup
				EnableTestCaching();

				// Assert
				const response = await request(getUrl(vendor))
					.post(`/utils/cache/clear`)
					.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`);

				const response2 = await request(getUrl(vendor))
					.get(`/fields`)
					.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`);

				expect(response.statusCode).toBe(200);
				expect(response2.statusCode).toBe(200);
			},
			30000
		);
	});
}

export function EnableTestCaching() {
	delete process.env['TEST_NO_CACHE'];
}

export type OptionsCreateRole = {
	name: string;
	appAccessEnabled: boolean;
	adminAccessEnabled: boolean;
};

export async function CreateRole(vendor: Vendor, options: OptionsCreateRole) {
	// Action
	const roleResponse = await request(getUrl(vendor))
		.get(`/roles`)
		.query({
			filter: { name: { _eq: options.name } },
		})
		.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`);

	if (roleResponse.body.data.length > 0) {
		return roleResponse.body.data[0];
	}

	const response = await request(getUrl(vendor))
		.post(`/roles`)
		.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
		.send({ name: options.name, app_access: options.appAccessEnabled, admin_access: options.adminAccessEnabled });

	return response.body.data;
}

export type OptionsCreateUser = {
	token: string;
	email: string;
	password?: string;
	name?: string;
	role?: string;
	// Automatically removed params
	roleName?: string; // to generate role
};

export async function CreateUser(vendor: Vendor, options: Partial<OptionsCreateUser>) {
	// Validate options
	if (!options.token) {
		throw new Error('Missing required field: token');
	}

	if (!options.email) {
		throw new Error('Missing required field: email');
	}

	if (options.roleName) {
		const roleResponse = await request(getUrl(vendor))
			.get(`/roles`)
			.query({
				filter: { name: { _eq: options.roleName } },
				fields: ['id', 'name'],
			})
			.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`);

		if (roleResponse.body.data.length === 0) {
			throw new Error(`Role ${options.roleName} does not exist`);
		}

		options.role = roleResponse.body.data[0].id;
		delete options.roleName;
	}

	// Action
	const response = await request(getUrl(vendor))
		.post(`/users`)
		.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
		.send(options);

	return response.body.data;
}

export type OptionsCreateCollection = {
	collection: string;
	meta?: any;
	schema?: any;
	fields?: any;
	env?: Env;
	// Automatically removed params
	primaryKeyType?: PrimaryKeyType;
};

export async function CreateCollection(vendor: Vendor, options: Partial<OptionsCreateCollection>) {
	// Validate options
	if (!options.collection) {
		throw new Error('Missing required field: collection');
	}

	// Parse options
	const defaultOptions = {
		meta: {},
		schema: {},
		fields: [],
		primaryKeyType: 'integer',
	};

	options = Object.assign({}, defaultOptions, options);

	switch (options.primaryKeyType) {
		case 'uuid':
			options.fields.push({
				field: 'id',
				type: 'uuid',
				meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
				schema: { is_primary_key: true, length: 36, has_auto_increment: false },
			});

			break;
		case 'string':
			options.fields.push({
				field: 'id',
				type: 'string',
				meta: { hidden: false, readonly: false, interface: 'input' },
				schema: { is_primary_key: true, length: 255, has_auto_increment: false },
			});

			break;
		case 'integer':
		default:
			options.fields.push({
				field: 'id',
				type: 'integer',
				meta: { hidden: true, interface: 'input', readonly: true },
				schema: { is_primary_key: true, has_auto_increment: true },
			});

			break;
	}

	if (options.primaryKeyType) {
		delete options.primaryKeyType;
	}

	// Action
	const collectionResponse = await request(getUrl(vendor, options.env))
		.get(`/collections/${options.collection}`)
		.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`);

	if (collectionResponse.body.data) {
		return collectionResponse.body.data;
	}

	const response = await request(getUrl(vendor, options.env))
		.post(`/collections`)
		.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
		.send(options);

	return response.body.data;
}

export type OptionsDeleteCollection = {
	collection: string;
};

export async function DeleteCollection(vendor: Vendor, options: OptionsDeleteCollection) {
	// Action
	const response = await request(getUrl(vendor))
		.delete(`/collections/${options.collection}`)
		.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`);

	return response.body;
}

export type OptionsDeleteField = {
	collection: string;
	field: string;
};

export async function DeleteField(vendor: Vendor, options: OptionsDeleteField) {
	// Action
	const response = await request(getUrl(vendor))
		.delete(`/fields/${options.collection}/${options.field}`)
		.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`);

	return response.body;
}

export type OptionsCreateField = {
	collection: string;
	field: string;
	type: string;
	meta?: any;
	schema?: any;
};

export async function CreateField(vendor: Vendor, options: OptionsCreateField) {
	// Parse options
	const defaultOptions = {
		meta: {},
		schema: {},
	};

	options = Object.assign({}, defaultOptions, options);

	// Action
	const response = await request(getUrl(vendor))
		.post(`/fields/${options.collection}`)
		.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
		.send(options);

	return response.body.data;
}

export type OptionsCreateRelation = {
	collection: string;
	field: string;
	related_collection: string | null;
	meta?: any;
	schema?: any;
};

export async function CreateRelation(vendor: Vendor, options: OptionsCreateRelation) {
	// Parse options
	const defaultOptions = {
		meta: {},
		schema: {},
	};

	options = Object.assign({}, defaultOptions, options);

	// Action
	const relationResponse = await request(getUrl(vendor))
		.get(`/relations/${options.collection}/${options.field}`)
		.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`);

	if (relationResponse.statusCode === 200) {
		return relationResponse.body.data;
	}

	const response = await request(getUrl(vendor))
		.post(`/relations`)
		.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
		.send(options);

	return response.body.data;
}

export type OptionsCreateFieldM2O = {
	collection: string;
	field: string;
	fieldMeta?: any;
	fieldSchema?: any;
	primaryKeyType?: PrimaryKeyType;
	otherCollection: string;
	relationMeta?: any;
	relationSchema?: any;
};

export async function CreateFieldM2O(vendor: Vendor, options: OptionsCreateFieldM2O) {
	// Parse options
	const defaultOptions = {
		fieldMeta: {},
		fieldSchema: {},
		primaryKeyType: 'integer',
		relationMeta: {},
		relationSchema: {
			on_delete: 'SET NULL',
		},
	};

	options = Object.assign({}, defaultOptions, options);

	const fieldOptions: OptionsCreateField = {
		collection: options.collection,
		field: options.field,
		type: options.primaryKeyType!,
		meta: options.fieldMeta ?? {},
		schema: options.fieldSchema ?? {},
	};

	if (!fieldOptions.meta.special) {
		fieldOptions.meta.special = ['m2o'];
	} else if (!fieldOptions.meta.special.includes('m2o')) {
		fieldOptions.meta.special.push('m2o');
	}

	// Action
	const field = await CreateField(vendor, fieldOptions);

	const relationOptions: OptionsCreateRelation = {
		collection: options.collection,
		field: options.field,
		meta: options.relationMeta,
		schema: options.relationSchema,
		related_collection: options.otherCollection,
	};

	const relation = await CreateRelation(vendor, relationOptions);

	return { field, relation };
}

export type OptionsCreateFieldO2M = {
	collection: string;
	field: string;
	fieldMeta?: any;
	otherCollection: string;
	otherField: string;
	primaryKeyType?: string;
	otherMeta?: any;
	otherSchema?: any;
	relationMeta?: any;
	relationSchema?: any;
};

export async function CreateFieldO2M(vendor: Vendor, options: OptionsCreateFieldO2M) {
	// Parse options
	const defaultOptions = {
		fieldMeta: {},
		primaryKeyType: 'integer',
		otherMeta: {},
		otherSchema: {},
		relationMeta: {},
		relationSchema: {
			on_delete: 'SET NULL',
		},
	};

	options = Object.assign({}, defaultOptions, options);

	const fieldOptions: OptionsCreateField = {
		collection: options.collection,
		field: options.field,
		type: 'alias',
		meta: options.fieldMeta,
		schema: null,
	};

	if (!fieldOptions.meta.special) {
		fieldOptions.meta.special = ['o2m'];
	} else if (!fieldOptions.meta.special.includes('o2m')) {
		fieldOptions.meta.special.push('o2m');
	}

	// Action
	const field = await CreateField(vendor, fieldOptions);

	const otherFieldOptions: OptionsCreateField = {
		collection: options.otherCollection,
		field: options.otherField,
		type: options.primaryKeyType!,
		meta: options.otherMeta,
		schema: options.otherSchema,
	};

	const otherField = await CreateField(vendor, otherFieldOptions);

	const relationOptions: OptionsCreateRelation = {
		collection: options.otherCollection,
		field: options.otherField,
		meta: { ...options.relationMeta, one_field: options.field },
		schema: options.relationSchema,
		related_collection: options.collection,
	};

	const relation = await CreateRelation(vendor, relationOptions);

	return { field, otherField, relation };
}

export type OptionsCreateFieldM2M = {
	collection: string;
	field: string;
	fieldMeta?: any;
	fieldSchema?: any;
	otherCollection: string;
	otherField: string;
	junctionCollection: string;
	primaryKeyType?: string;
	otherMeta?: any;
	otherSchema?: any;
	relationMeta?: any;
	relationSchema?: any;
	otherRelationSchema?: any;
};

export async function CreateFieldM2M(vendor: Vendor, options: OptionsCreateFieldM2M) {
	// Parse options
	const defaultOptions = {
		fieldMeta: {},
		fieldSchema: {},
		primaryKeyType: 'integer',
		otherMeta: {},
		otherSchema: {},
		relationMeta: {},
		relationSchema: {
			on_delete: 'SET NULL',
		},
		otherRelationSchema: {
			on_delete: 'SET NULL',
		},
	};

	options = Object.assign({}, defaultOptions, options);

	const fieldOptions: OptionsCreateField = {
		collection: options.collection,
		field: options.field,
		type: 'alias',
		meta: options.fieldMeta,
		schema: options.fieldSchema,
	};

	const isSelfReferencing = options.collection === options.otherCollection;

	if (!fieldOptions.meta.special) {
		fieldOptions.meta.special = ['m2m'];
	} else if (!fieldOptions.meta.special.includes('m2m')) {
		fieldOptions.meta.special.push('m2m');
	}

	// Action
	const field = await CreateField(vendor, fieldOptions);

	const otherFieldOptions: OptionsCreateField = {
		collection: options.otherCollection,
		field: options.otherField,
		type: 'alias',
		meta: options.otherMeta,
		schema: options.otherSchema,
	};

	if (!otherFieldOptions.meta.special) {
		otherFieldOptions.meta.special = ['m2m'];
	} else if (!otherFieldOptions.meta.special.includes('m2m')) {
		otherFieldOptions.meta.special.push('m2m');
	}

	const otherField = await CreateField(vendor, otherFieldOptions);

	const junctionCollectionOptions: OptionsCreateCollection = {
		collection: options.junctionCollection,
		primaryKeyType: 'integer',
	};

	const junctionCollection = await CreateCollection(vendor, junctionCollectionOptions);

	const junctionFieldName = `${options.collection}_id`;

	const junctionFieldOptions: OptionsCreateField = {
		collection: options.junctionCollection,
		field: junctionFieldName,
		type: options.primaryKeyType!,
	};

	const junctionField = await CreateField(vendor, junctionFieldOptions);

	const otherJunctionFieldName = `${options.otherCollection}_id${isSelfReferencing ? '2' : ''}`;

	const otherJunctionFieldOptions: OptionsCreateField = {
		collection: options.junctionCollection,
		field: otherJunctionFieldName,
		type: options.primaryKeyType!,
	};

	const otherJunctionField = await CreateField(vendor, otherJunctionFieldOptions);

	const relationOptions: OptionsCreateRelation = {
		collection: options.junctionCollection,
		field: junctionFieldName,
		meta: {
			...options.relationMeta,
			one_field: options.field,
			junction_field: otherJunctionFieldName,
		},
		schema: options.relationSchema,
		related_collection: options.collection,
	};

	const relation = await CreateRelation(vendor, relationOptions);

	const otherRelationOptions: OptionsCreateRelation = {
		collection: options.junctionCollection,
		field: otherJunctionFieldName,
		meta: {
			...options.relationMeta,
			one_field: options.otherField,
			junction_field: junctionFieldName,
		},
		schema: options.otherRelationSchema,
		related_collection: options.otherCollection,
	};

	const otherRelation = await CreateRelation(vendor, otherRelationOptions);

	return { field, otherField, junctionCollection, junctionField, otherJunctionField, relation, otherRelation };
}

export type OptionsCreateFieldM2A = {
	collection: string;
	field: string;
	relatedCollections: string[];
	fieldMeta?: any;
	fieldSchema?: any;
	junctionCollection: string;
	primaryKeyType?: string;
	relationMeta?: any;
	relationSchema?: any;
	itemRelationMeta?: any;
	itemRelationSchema?: any;
};

export async function CreateFieldM2A(vendor: Vendor, options: OptionsCreateFieldM2A) {
	// Parse options
	const defaultOptions = {
		fieldMeta: {},
		fieldSchema: {},
		primaryKeyType: 'integer',
		otherMeta: {},
		otherSchema: {},
		relationSchema: null,
		itemRelationSchema: {
			on_delete: 'SET NULL',
		},
	};

	options = Object.assign({}, defaultOptions, options);

	const fieldOptions: OptionsCreateField = {
		collection: options.collection,
		field: options.field,
		type: 'alias',
		meta: options.fieldMeta,
		schema: options.fieldSchema,
	};

	if (!fieldOptions.meta.special) {
		fieldOptions.meta.special = ['m2a'];
	} else if (!fieldOptions.meta.special.includes('m2a')) {
		fieldOptions.meta.special.push('m2a');
	}

	// Action
	const field = await CreateField(vendor, fieldOptions);

	const junctionCollectionOptions: OptionsCreateCollection = {
		collection: options.junctionCollection,
		primaryKeyType: 'integer',
	};

	const junctionCollection = await CreateCollection(vendor, junctionCollectionOptions);

	const junctionFieldName = `${options.junctionCollection}_id`;

	const junctionFieldOptions: OptionsCreateField = {
		collection: options.junctionCollection,
		field: junctionFieldName,
		type: options.primaryKeyType!,
		meta: { hidden: true },
	};

	const junctionField = await CreateField(vendor, junctionFieldOptions);

	const junctionFieldItemOptions: OptionsCreateField = {
		collection: options.junctionCollection,
		field: 'item',
		type: 'string',
		meta: { hidden: true },
	};

	const junctionFieldItem = await CreateField(vendor, junctionFieldItemOptions);

	const junctionFieldCollectionOptions: OptionsCreateField = {
		collection: options.junctionCollection,
		field: 'collection',
		type: 'string',
		meta: { hidden: true },
	};

	const junctionFieldCollection = await CreateField(vendor, junctionFieldCollectionOptions);

	const relationOptions: OptionsCreateRelation = {
		collection: options.junctionCollection,
		field: 'item',
		related_collection: null,
		meta: {
			one_allowed_collections: options.relatedCollections,
			one_collection_field: 'collection',
			junction_field: junctionFieldName,
		},
		schema: null,
	};

	const relation = await CreateRelation(vendor, relationOptions);

	const itemRelationOptions: OptionsCreateRelation = {
		collection: options.junctionCollection,
		field: junctionFieldName,
		related_collection: options.collection,
		meta: {
			one_field: options.field,
			junction_field: 'item',
		},
		schema: options.itemRelationSchema,
	};

	const itemRelation = await CreateRelation(vendor, itemRelationOptions);

	return {
		field,
		junctionCollection,
		junctionField,
		junctionFieldItem,
		junctionFieldCollection,
		relation,
		otherRelation: itemRelation,
	};
}

export type OptionsCreateItem = {
	collection: string;
	item: any;
};

export async function CreateItem(vendor: Vendor, options: OptionsCreateItem) {
	// Action
	const response = await request(getUrl(vendor))
		.post(`/items/${options.collection}`)
		.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
		.send(options.item);

	return response.body.data;
}

export type OptionsReadItem = {
	collection: string;
} & Query;

export async function ReadItem(vendor: Vendor, options: OptionsReadItem) {
	// Parse options
	const defaultOptions = {
		filter: {},
		fields: '*',
	};

	options = Object.assign({}, defaultOptions, options);

	// Action
	const response = await request(getUrl(vendor))
		.get(`/items/${options.collection}`)
		.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
		.query(omit(options, 'collection'));

	return response.body.data;
}

export type OptionsUpdateItem = {
	id?: string | number;
	collection: string;
	item: any;
};

export async function UpdateItem(vendor: Vendor, options: OptionsUpdateItem) {
	// Action
	const response = await request(getUrl(vendor))
		.patch(`/items/${options.collection}/${options.id === undefined ? '' : options.id}`)
		.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
		.send(options.item);

	return response.body.data;
}

// TODO
// export async function CreatePermissions() {}
// export async function UpdatePermissions() {}
// export async function DeletePermissions() {}
