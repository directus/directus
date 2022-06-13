import { queryCaller } from '../../../../src/modules/insights/dashboard-utils/query-caller';

jest.mock('@/api', () => ({}));

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
});
