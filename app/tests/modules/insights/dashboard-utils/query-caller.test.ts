import { cloneDeep } from 'lodash';
import { queryCaller } from '../../../../src/modules/insights/dashboard-utils/query-caller';

jest.mock('@/api', () => ({
	post: jest
		.fn()
		.mockResolvedValueOnce({ data: { data: { content: '' } } })
		.mockRejectedValueOnce({
			response: {
				data: {
					errors: [
						{
							extensions: {
								graphqlErrors: [{ message: 'Cannot query field "id" on type "metrics_aggregated' }],
							},
						},
					],
				},
			},
		})
		.mockResolvedValueOnce({ data: { data: { content: '' } } })

		.mockRejectedValueOnce({
			response: {
				data: {
					errors: [
						{
							extensions: {
								graphqlErrors: [{ message: 'Field "this" is not defined by type "metrics_filter".' }],
							},
						},
					],
				},
			},
		})
		.mockResolvedValueOnce({ data: { data: { content: '' } } })

		.mockRejectedValueOnce({
			response: {
				data: {
					errors: [
						{
							extensions: {
								graphqlErrors: [{ message: 'Field "this" is not defined by type "metrics_filter".' }],
							},
						},
					],
				},
			},
		}),
}));

const queries: Record<string, { query: any; collection: string }> = {
	'c810d079-9757-482e-ba87-c070bb82972e': {
		collection: 'metrics',
		query: {
			aggregate: {
				count: ['id'],
			},
		},
	},
	'c956d079-9757-482e-ba87-c070bb82972e': {
		collection: 'directus_users',
		query: {
			aggregate: {
				count: ['id'],
			},
		},
	},
};

describe('queryCaller', () => {
	let request = 'query { oops }';

	it('when passed "query" it returns undefined', async () => {
		request = 'query';
		expect(await queryCaller(request, 0, queries, false)).toBe(undefined);
	});

	it('when passed "" it returns undefined', async () => {
		request = '';
		expect(await queryCaller(request, 0, queries, false)).toBe(undefined);
	});

	it('when passed when passed a valid query it returns the response.', async () => {
		const valid = cloneDeep(queries);
		request = 'query { id_c810d079_9757_482e_ba87_c070bb82972e: metrics_aggregated { count { id } } }';
		expect(await queryCaller(request, 0, valid, false)).toStrictEqual({ content: '' });
	});

	it('when passed when passed a invalid aggregation query it removes the query.', async () => {
		const aggregateQueries = cloneDeep(queries);

		await queryCaller(request, 0, aggregateQueries, false);

		expect(aggregateQueries).toStrictEqual({
			'c956d079-9757-482e-ba87-c070bb82972e': {
				collection: 'directus_users',
				query: {
					aggregate: {
						count: ['id'],
					},
				},
			},
		});
	});

	it('when passed an invalid filter query it removes the query.', async () => {
		const filterQueries = cloneDeep(queries);
		filterQueries['c810d079-9757-482e-ba87-c070bb82972e'].query.filter = { this: { _eq: 'that' } };
		const numberOfCalls = 0;

		expect(await queryCaller(request, numberOfCalls, filterQueries, true, true)).toBe(undefined);

		expect(filterQueries).toStrictEqual({
			'c956d079-9757-482e-ba87-c070bb82972e': {
				collection: 'directus_users',
				query: {
					aggregate: {
						count: ['id'],
					},
				},
			},
		});
	});
});
