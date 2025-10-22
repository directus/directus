import type { Filter, SchemaOverview } from '@directus/types';
import { describe, expect, it } from 'vitest';
import { dedupeFilter } from './dedupe-filter.js';

describe('dedupeFilter', () => {

	const schema: SchemaOverview = {
		collections: {
			registrations: {
				collection: 'registrations',
				primary: 'id',
				singleton: false,
				sortField: null,
				note: null,
				accountability: null,
				fields: {
					id: {
						field: 'id',
						defaultValue: null,
						nullable: false,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: ['primary-key'],
						note: null,
						alias: false,
						validation: null
					},
					status: {
						field: 'status',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'string',
						dbType: 'varchar',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null
					},
					created_at: {
						field: 'created_at',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'dateTime',
						dbType: 'datetime',
						precision: null,
						scale: null,
						special: [],
						note: null,
						alias: false,
						validation: null
					},
					person: {
						field: 'person',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: ['m2o'],
						note: null,
						alias: false,
						validation: null
					}
				}
			},
			persons: {
				collection: 'persons',
				primary: 'id',
				singleton: false,
				sortField: null,
				note: null,
				accountability: null,
				fields: {
					id: {
						field: 'id',
						defaultValue: null,
						nullable: false,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: ['primary-key'],
						note: null,
						alias: false,
						validation: null
					},
					org: {
						field: 'org',
						defaultValue: null,
						nullable: true,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: ['m2o'],
						note: null,
						alias: false,
						validation: null
					}
				}
			},
			orgs: {
				collection: 'orgs',
				primary: 'id',
				singleton: false,
				sortField: null,
				note: null,
				accountability: null,
				fields: {
					id: {
						field: 'id',
						defaultValue: null,
						nullable: false,
						generated: false,
						type: 'integer',
						dbType: 'integer',
						precision: null,
						scale: null,
						special: ['primary-key'],
						note: null,
						alias: false,
						validation: null
					}
				}
			}
		},
		relations: [
			{
				collection: 'registrations',
				field: 'person',
				related_collection: 'persons',
				schema: null,
				meta: null
			},
			{
				collection: 'persons',
				field: 'org',
				related_collection: 'orgs',
				schema: null,
				meta: null
			}
		]
	};

	it('should transform M2O relation filter to use primary key directly', () => {
		expect(dedupeFilter({
			person: { id: { _in: [1, 2, 3] } }
		}, 'registrations', schema)).toEqual({
			person: { _in: [1, 2, 3] }
		});
	});

	it('should handle nested _and filters', () => {
		expect(dedupeFilter({
			_and: [
				{ person: { id: { _in: [1, 2, 3] } } },
				{ status: { _eq: 'active' } }
			]
		}, 'registrations', schema)).toEqual({
			_and: [
				{ person: { _in: [1, 2, 3] } },
				{ status: { _eq: 'active' } }
			]
		})
	});

	it('should handle non-relation fields without modification', () => {
		const filter: Filter = {
			status: { _eq: 'active' },
			created_at: { _gte: '2023-01-01' }
		};

		const result = dedupeFilter(filter, 'registrations', schema);

		expect(result).toEqual(filter);
	});

	it ('should handle deep nested filters as well', () => {
		const filter = {
			_and: [
				{person: {id: { _in: [1, 2, 3] }}},
				{person: {org: {id: { _eq: 10 }}}}
			]
		}

		expect(dedupeFilter(filter, 'registrations', schema)).toEqual({
			_and: [
				{person: { _in: [1, 2, 3] }},
				{person: { org: { _eq: 10 }}}
			]
		});
	})
});