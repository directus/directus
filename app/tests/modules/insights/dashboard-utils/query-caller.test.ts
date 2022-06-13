import { queryCaller } from '../../../../src/modules/insights/dashboard-utils/query-caller';

jest.mock('@/api', () => ({
	post: jest
		.fn()
		.mockReturnValueOnce({ data: { data: { content: '' } } })
		.mockRejectedValueOnce({
			response: { data: { errors: [{ extensions: { graphqlErrors: [{ message: 'metrics_aggregated' }] } }] } },
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
};

describe('queryCaller', () => {
	it('when passed "query" it returns undefined', async () => {
		const request = 'query';
		expect(await queryCaller(request, 0, queries, false)).toBe(undefined);
	});

	it('when passed "" it returns undefined', async () => {
		const request = '';
		expect(await queryCaller(request, 0, queries, false)).toBe(undefined);
	});

	it('when passed when passed a valid query it returns the response.', async () => {
		const request = 'query { id_c810d079_9757_482e_ba87_c070bb82972e: metrics_aggregated { count { id } } }';
		expect(await queryCaller(request, 0, queries, false)).toStrictEqual({ content: '' });
	});
});
