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
			},
		},
	} as CollectionsOverview,
	relations: [] as Relation[],
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
			},
		},
	} as CollectionsOverview,
	relations: [] as Relation[],
};
