import { CheckQueryFilters } from './';
import * as common from '@common/index';
import { RequestOptions } from '@utils/prepare-request';

const sampleSchema = {
	id: {
		field: 'id',
		type: 'integer',
		filters: true,
		possibleValues: [1, 2, 3],
	},
	collection: {
		field: 'collection',
		type: 'string',
		filters: true,
		possibleValues: [
			'directus_settings',
			'directus_users',
			'directus_roles',
			'directus_collections',
			'directus_fields',
		],
	},
	something_id: {
		field: 'something_id',
		type: 'integer',
		filters: false,
		possibleValues: [1, 2, 3],
		children: {
			name: {
				field: 'name',
				type: 'string',
				filters: false,
				possibleValues: ['', 'a', 'b'],
			},
		},
	},
};

describe('Sample Query Filters Testing', () => {
	const requestOptions: RequestOptions = {
		path: '/revisions',
		method: 'get',
		token: common.USER.ADMIN.TOKEN,
	};
	CheckQueryFilters(requestOptions, sampleSchema);
});
