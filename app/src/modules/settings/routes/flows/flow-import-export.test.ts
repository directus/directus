import type { FlowRaw } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { createFlowExport, createFlowImport, FlowImportError, parseFlowExport } from './flow-import-export';

const flow = {
	id: 'flow-1',
	name: 'Send notification',
	icon: 'bolt',
	color: '#6644FF',
	description: 'Sends a notification',
	status: 'active',
	trigger: 'event',
	accountability: 'all',
	options: { type: 'action', scope: ['items.create'] },
	operation: 'operation-1',
	folder: 'folder-1',
	date_created: '2026-08-27T00:00:00Z',
	user_created: 'user-1',
	operations: [
		{
			id: 'operation-1',
			name: 'Log notification',
			key: 'log_notification',
			type: 'log',
			position_x: 1,
			position_y: 1,
			options: { message: 'Sent' },
			resolve: null,
			reject: null,
			flow: 'flow-1',
			date_created: '2026-08-27T00:00:00Z',
			user_created: 'user-1',
		},
	],
} as FlowRaw;

describe('flow import export', () => {
	test('creates a portable bundle without instance-specific fields', () => {
		const result = createFlowExport(flow);

		expect(result).toEqual({
			version: 1,
			flow: {
				id: 'flow-1',
				name: 'Send notification',
				icon: 'bolt',
				color: '#6644FF',
				description: 'Sends a notification',
				trigger: 'event',
				accountability: 'all',
				options: { type: 'action', scope: ['items.create'] },
				operation: 'operation-1',
			},
			operations: [
				{
					id: 'operation-1',
					name: 'Log notification',
					key: 'log_notification',
					type: 'log',
					position_x: 1,
					position_y: 1,
					options: { message: 'Sent' },
					resolve: null,
					reject: null,
					flow: 'flow-1',
				},
			],
		});
	});

	test('places the imported Flow in the given folder', () => {
		const [flows] = createFlowImport(createFlowExport(flow), 'folder-1');

		expect(flows!.items[0]).toMatchObject({ folder: 'folder-1' });
	});

	test('rejects a bundle with Operations from another Flow', () => {
		const bundle = createFlowExport(flow);
		bundle.operations[0]!.flow = 'other-flow';

		expect(() => createFlowImport(bundle)).toThrow(new FlowImportError('flow_import_foreign_operation'));
	});

	test('rejects a file that is not a Flow export', () => {
		expect(() => createFlowImport({ version: 2 })).toThrow(new FlowImportError('flow_import_invalid_file'));
	});

	test('rejects a file that is not JSON', () => {
		expect(() => parseFlowExport('not json')).toThrow(new FlowImportError('flow_import_not_json'));
		expect(parseFlowExport('{"version":1}')).toEqual({ version: 1 });
	});

	test('creates an inactive transactional import payload', () => {
		const result = createFlowImport(createFlowExport(flow));

		expect(result).toEqual([
			{
				collection: 'directus_flows',
				items: [
					{
						id: 'flow-1',
						folder: null,
						name: 'Send notification',
						icon: 'bolt',
						color: '#6644FF',
						description: 'Sends a notification',
						status: 'inactive',
						trigger: 'event',
						accountability: 'all',
						options: { type: 'action', scope: ['items.create'] },
						operation: 'operation-1',
					},
				],
			},
			{
				collection: 'directus_operations',
				items: [
					{
						id: 'operation-1',
						name: 'Log notification',
						key: 'log_notification',
						type: 'log',
						position_x: 1,
						position_y: 1,
						options: { message: 'Sent' },
						resolve: null,
						reject: null,
						flow: 'flow-1',
					},
				],
			},
		]);
	});

	test('discards fields outside the portable bundle contract', () => {
		const bundle = createFlowExport(flow) as any;
		bundle.flow.folder = 'folder-1';
		bundle.flow.user_created = 'user-1';
		bundle.operations[0].date_created = '2026-08-27T00:00:00Z';

		const result = createFlowImport(bundle);

		expect(result[0]!.items[0]).toMatchObject({ folder: null });
		expect(result[0]!.items[0]).not.toHaveProperty('user_created');
		expect(result[1]!.items[0]).not.toHaveProperty('date_created');
	});
});
