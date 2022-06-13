import { cloneDeep } from 'lodash';
import { processQuery } from '../../../../src/modules/insights/dashboard-utils/process-query';

describe('processQuery', () => {
	const queries: Record<string, { query: any; collection: string }> = {
		'c810d079-9757-482e-ba87-c070bb82972e': {
			collection: 'metrics',
			query: {
				aggregate: {
					count: ['id'],
				},
			},
		},
	};

	it('returns a graphQL string with an aggregated collection', () => {
		expect(processQuery(queries)).toBe(
			'query { id_c810d079_9757_482e_ba87_c070bb82972e: metrics_aggregated { count { id } } }'
		);
	});

	it('returns a graphQL string with a filter arg', () => {
		const filterQuery = cloneDeep(queries);
		filterQuery['c810d079-9757-482e-ba87-c070bb82972e'].query.filter = {
			_and: [
				{
					timestamp: {
						_gte: '$NOW(-3 months)',
					},
				},
				{
					timestamp: {
						_lte: '$NOW',
					},
				},
				{},
			],
		};

		expect(processQuery(filterQuery)).toBe(
			'query { id_c810d079_9757_482e_ba87_c070bb82972e: metrics_aggregated (filter: {_and: [{timestamp: {_gte: "$NOW(-3 months)"}}, {timestamp: {_lte: "$NOW"}}, {}]}) { count { id } } }'
		);
	});

	it('returns a graphQL string with an limit arg', () => {
		const limitQuery = cloneDeep(queries);
		limitQuery['c810d079-9757-482e-ba87-c070bb82972e'].query.limit = 1;

		expect(processQuery(limitQuery)).toBe(
			'query { id_c810d079_9757_482e_ba87_c070bb82972e: metrics_aggregated (limit: 1) { count { id } } }'
		);
	});

	it('returns a graphQL string with an groupBy arg', () => {
		const groupByQueries = cloneDeep(queries);
		groupByQueries['c810d079-9757-482e-ba87-c070bb82972e'].query.groupBy = 'count';

		expect(processQuery(groupByQueries)).toBe(
			'query { id_c810d079_9757_482e_ba87_c070bb82972e: metrics_aggregated (groupBy: "count") { count { id } group } }'
		);
	});

	it('returns a graphQL string with 2 fields', () => {
		const fieldsQuery = cloneDeep(queries);
		fieldsQuery['c810d079-9757-482e-ba87-c070bb82972e'].query.fields = ['metric', 'image'];

		expect(processQuery(fieldsQuery)).toBe(
			'query { id_c810d079_9757_482e_ba87_c070bb82972e: metrics_aggregated { count { id } metric image } }'
		);
	});

	it('returns a graphQL string with a relational fields', () => {
		const relationalFieldsQueries = cloneDeep(queries);
		relationalFieldsQueries['c810d079-9757-482e-ba87-c070bb82972e'].query.fields = ['images.id'];

		expect(processQuery(relationalFieldsQueries)).toBe(
			'query { id_c810d079_9757_482e_ba87_c070bb82972e: metrics_aggregated { count { id } images { id } } }'
		);
	});
	it('returns a graphQL string with deep relational fields', () => {
		const relationalFieldsQueries = cloneDeep(queries);
		relationalFieldsQueries['c810d079-9757-482e-ba87-c070bb82972e'].query.fields = ['images.files.id'];

		expect(processQuery(relationalFieldsQueries)).toBe(
			'query { id_c810d079_9757_482e_ba87_c070bb82972e: metrics_aggregated { count { id } images { files { id } } } }'
		);
	});
	it('returns a graphQL string when multiple queries are passed from the same panel', () => {
		const multiQuery = cloneDeep(queries);
		multiQuery['c810d079-9757-482e-ba87-c070bb82972e'].query = [
			{
				aggregate: {
					count: ['id'],
				},
			},
			{
				fields: ['id'],
			},
		];

		expect(processQuery(multiQuery)).toBe(
			'query { id_c810d079_9757_482e_ba87_c070bb82972e__0: metrics_aggregated { count { id } } id_c810d079_9757_482e_ba87_c070bb82972e__1: metrics { id } }'
		);
	});

	it('returns a graphQL string with multiple args', () => {
		const multipleArgs = cloneDeep(queries);
		multipleArgs['c810d079-9757-482e-ba87-c070bb82972e'].query.limit = 1;
		multipleArgs['c810d079-9757-482e-ba87-c070bb82972e'].query.filter = {
			_and: [
				{
					timestamp: {
						_gte: '$NOW(-3 months)',
					},
				},
				{
					timestamp: {
						_lte: '$NOW',
					},
				},
				{},
			],
		};

		expect(processQuery(multipleArgs)).toBe(
			'query { id_c810d079_9757_482e_ba87_c070bb82972e: metrics_aggregated (limit: 1, filter: {_and: [{timestamp: {_gte: "$NOW(-3 months)"}}, {timestamp: {_lte: "$NOW"}}, {}]}) { count { id } } }'
		);
	});
});
