import { applyDataToPanels } from '../../../../src/modules/insights/dashboard-utils/apply-data-to-panels';

describe('applyDataToPanels', () => {
	const fakePanel = {
		id: 'c810d079-9757-482e-ba87-c070bb82972e',
		dashboard: '0912b2bb-e606-48fe-b146-c4f9cecc6903',
		name: 'null',
		icon: 'functions',
		color: 'null',
		show_header: true,
		note: 'null',
		type: 'metric',
		position_x: 1,
		position_y: 1,
		width: 9,
		height: 7,
		options: {
			collection: 'metrics',
			field: 'id',
			function: 'count',
			sortField: 'service',
		},
		date_created: '2022-06-08T19:09:57.924Z',
		user_created: '73cb262d-d560-4aa8-924c-ef0151e96f3f',
		_coordinates: [
			[1, 1],
			[10, 1],
			[10, 8],
			[1, 8],
		],
		x: 1,
		y: 1,
		borderRadius: [true, true, true, true],
		data: [
			{
				count: {
					id: 9899,
				},
			},
		],
	};
	const fakeData = {
		id_c810d079_9757_482e_ba87_c070bb82972e: [
			{
				count: {
					id: 9899,
				},
			},
		],
	};
	it('adds a single dataset to a panel', () => {
		const panelsWithData = applyDataToPanels([fakePanel], fakeData);

		expect(panelsWithData[0].data).toBeDefined();
		expect(panelsWithData[0].data).toStrictEqual([
			{
				count: {
					id: 9899,
				},
			},
		]);
	});

	it.only('adds a multiple datasets to a panel', () => {
		const fakeData = {
			__id_c810d079_9757_482e_ba87_c070bb82972e_1: [
				{
					sum: {
						id: 12,
					},
				},
			],
			__id_c810d079_9757_482e_ba87_c070bb82972e_2: [
				{
					count: {
						id: 9899,
					},
				},
			],
		};
		const panelsWithData = applyDataToPanels([fakePanel], fakeData);

		expect(panelsWithData[0].data).toBeDefined();
		expect(panelsWithData[0].data).toStrictEqual([
			[
				{
					sum: {
						id: 12,
					},
				},
			],
			[
				{
					count: {
						id: 9899,
					},
				},
			],
		]);
	});
});
