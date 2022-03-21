import { CollectionsOverview, Relation } from '@directus/shared/types';

export const systemSchema = {
	collections: {
		directus_users: {
			collection: 'directus_users',
			primary: 'id',
			singleton: false,
			note: '$t:directus_collection.directus_users',
			sortField: null,
			accountability: null,
			fields: {
				id: {
					field: 'id',
					defaultValue: null,
					nullable: false,
					generated: false,
					type: 'uuid',
					dbType: 'uuid',
					precision: null,
					scale: null,
					special: [],
					note: null,
					alias: false,
				},
				name: {
					field: 'name',
					defaultValue: "A User's Name",
					nullable: false,
					generated: false,
					type: 'uuid',
					dbType: 'uuid',
					precision: null,
					scale: null,
					special: [],
					note: null,
					alias: false,
				},
				items: {
					field: 'items',
					defaultValue: null,
					nullable: true,
					generated: false,
					type: 'alias',
					dbType: null,
					precision: null,
					scale: null,
					special: ['o2m'],
					note: null,
					alias: true,
				},
			},
		},
		directus_files: {
			collection: 'directus_files',
			primary: 'id',
			singleton: false,
			note: '$t:directus_collection.directus_files',
			sortField: null,
			accountability: null,
			fields: {
				id: {
					field: 'id',
					defaultValue: null,
					nullable: false,
					generated: false,
					type: 'uuid',
					dbType: 'uuid',
					precision: null,
					scale: null,
					special: [],
					note: null,
					alias: false,
				},
				title: {
					field: 'title',
					defaultValue: "A File's Title",
					nullable: false,
					generated: false,
					type: 'string',
					dbType: 'text',
					precision: null,
					scale: null,
					special: [],
					note: null,
					alias: false,
				},
				uploaded_by: {
					field: 'uploaded_by',
					defaultValue: null,
					nullable: true,
					generated: false,
					type: 'uuid',
					dbType: 'uuid',
					precision: null,
					scale: null,
					special: [],
					note: null,
					alias: false,
				},
			},
		},
	} as CollectionsOverview,
	relations: [
		{
			collection: 'directus_files',
			field: 'uploaded_by',
			related_collection: 'directus_users',
			schema: {
				table: 'directus_files',
				column: 'uploaded_by',
				foreign_key_table: 'directus_users',
				foreign_key_column: 'id',
				on_update: 'NO ACTION',
				on_delete: 'NO ACTION',
				constraint_name: null,
			},
			meta: {
				system: true,
				many_collection: 'directus_files',
				many_field: 'uploaded_by',
				one_collection: 'directus_users',
				one_field: 'items',
				one_allowed_collections: null,
				one_collection_field: null,
				one_deselect_action: 'nullify',
				junction_field: null,
				sort_field: null,
			},
		},
	] as Relation[],
};

export const userSchema = {
	collections: {
		authors: {
			collection: 'authors',
			primary: 'id',
			singleton: false,
			note: 'authors',
			sortField: null,
			accountability: null,
			fields: {
				id: {
					field: 'id',
					defaultValue: null,
					nullable: false,
					generated: false,
					type: 'uuid',
					dbType: 'uuid',
					precision: null,
					scale: null,
					special: [],
					note: null,
					alias: false,
				},
				name: {
					field: 'name',
					defaultValue: "An Author's Name",
					nullable: false,
					generated: false,
					type: 'uuid',
					dbType: 'uuid',
					precision: null,
					scale: null,
					special: [],
					note: null,
					alias: false,
				},
				items: {
					field: 'items',
					defaultValue: null,
					nullable: true,
					generated: false,
					type: 'alias',
					dbType: null,
					precision: null,
					scale: null,
					special: ['o2m'],
					note: null,
					alias: true,
				},
			},
		},
		posts: {
			collection: 'posts',
			primary: 'id',
			singleton: false,
			note: 'posts',
			sortField: null,
			accountability: null,
			fields: {
				id: {
					field: 'id',
					defaultValue: null,
					nullable: false,
					generated: false,
					type: 'uuid',
					dbType: 'uuid',
					precision: null,
					scale: null,
					special: [],
					note: null,
					alias: false,
				},
				title: {
					field: 'title',
					defaultValue: "A Post's Title",
					nullable: false,
					generated: false,
					type: 'string',
					dbType: 'text',
					precision: null,
					scale: null,
					special: [],
					note: null,
					alias: false,
				},
				uploaded_by: {
					field: 'uploaded_by',
					defaultValue: null,
					nullable: false,
					generated: false,
					type: 'uuid',
					dbType: 'uuid',
					precision: null,
					scale: null,
					special: [],
					note: null,
					alias: false,
				},
			},
		},
	} as CollectionsOverview,
	relations: [
		{
			collection: 'posts',
			field: 'uploaded_by',
			related_collection: 'authors',
			schema: {
				table: 'posts',
				column: 'uploaded_by',
				foreign_key_table: 'authors',
				foreign_key_column: 'id',
				on_update: 'NO ACTION',
				on_delete: 'SET NULL',
				constraint_name: null,
			},
			meta: {
				id: 11,
				many_collection: 'posts',
				many_field: 'uploaded_by',
				one_collection: 'authors',
				one_field: 'items',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: null,
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
	] as Relation[],
};
