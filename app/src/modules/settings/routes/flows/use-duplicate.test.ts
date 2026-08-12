import type { FlowRaw } from '@directus/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useDuplicate } from './use-duplicate';

vi.mock('@/api', () => ({
	default: {
		post: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn(),
	},
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

/**
 * trigger -> condition -> (resolve) log-success
 *                      -> (reject)  log-failure
 */
const source = {
	id: 'flow-abc',
	name: 'Notify',
	icon: 'bolt',
	color: '#6644FF',
	description: 'Notifies on update',
	status: 'active',
	accountability: 'all',
	trigger: 'event',
	options: { type: 'action', scope: ['items.update'] },
	operation: 'op-condition',
	date_created: '2026-01-01T00:00:00Z',
	user_created: 'user-1',
	operations: [
		{
			id: 'op-condition',
			name: 'Condition',
			key: 'condition',
			type: 'condition',
			position_x: 19,
			position_y: 1,
			options: { filter: {} },
			resolve: 'op-success',
			reject: 'op-failure',
			flow: 'flow-abc',
			date_created: '2026-01-01T00:00:00Z',
			user_created: 'user-1',
		},
		{
			id: 'op-success',
			name: 'Log Success',
			key: 'log_success',
			type: 'log',
			position_x: 37,
			position_y: 1,
			options: { message: 'ok' },
			resolve: null,
			reject: null,
			flow: 'flow-abc',
			date_created: '2026-01-01T00:00:00Z',
			user_created: 'user-1',
		},
		{
			id: 'op-failure',
			name: 'Log Failure',
			key: 'log_failure',
			type: 'log',
			position_x: 37,
			position_y: 17,
			options: { message: 'nope' },
			resolve: null,
			reject: null,
			flow: 'flow-abc',
			date_created: '2026-01-01T00:00:00Z',
			user_created: 'user-1',
		},
	],
} as unknown as FlowRaw;

let api: { post: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
let unexpectedError: ReturnType<typeof vi.fn>;

/** Returns a new ID per created Operation, so the old -> new mapping is observable */
function mockCreateResponses() {
	api.post.mockImplementation((endpoint: string, payload: Record<string, any>) => {
		if (endpoint === '/flows') return Promise.resolve({ data: { data: { id: 'new-flow-id' } } });

		return Promise.resolve({
			data: { data: (payload as Record<string, any>[]).map((operation) => ({ id: `new-${operation['key']}` })) },
		});
	});

	api.patch.mockResolvedValue({ data: { data: {} } });
	api.delete.mockResolvedValue({ data: { data: {} } });
}

beforeEach(async () => {
	api = (await vi.importMock('@/api')).default as typeof api;

	({ unexpectedError } = (await vi.importMock('@/utils/unexpected-error')) as {
		unexpectedError: typeof unexpectedError;
	});

	vi.clearAllMocks();
});

describe('useDuplicate', () => {
	it('POSTs to /flows with the given name, an inactive status, and no identifying fields', async () => {
		mockCreateResponses();

		const { duplicate } = useDuplicate({
			source: ref(source),
			name: ref('Notify (copy)'),
			onSuccess: vi.fn(),
		});

		await duplicate();

		expect(api.post).toHaveBeenCalledWith(
			'/flows',
			{
				name: 'Notify (copy)',
				icon: 'bolt',
				color: '#6644FF',
				description: 'Notifies on update',
				status: 'inactive',
				accountability: 'all',
				trigger: 'event',
				options: { type: 'action', scope: ['items.update'] },
			},
			{ params: { fields: ['id'] } },
		);

		const postedFlow = api.post.mock.calls[0]![1];
		expect(postedFlow).not.toHaveProperty('id');
		expect(postedFlow).not.toHaveProperty('date_created');
		expect(postedFlow).not.toHaveProperty('user_created');
		expect(postedFlow).not.toHaveProperty('operation');
		expect(postedFlow).not.toHaveProperty('operations');
	});

	it('creates every Operation against the new Flow in one request without its resolve/reject links', async () => {
		mockCreateResponses();

		const { duplicate } = useDuplicate({
			source: ref(source),
			name: ref('Notify (copy)'),
			onSuccess: vi.fn(),
		});

		await duplicate();

		const operationCalls = api.post.mock.calls.filter(([endpoint]) => endpoint === '/operations');
		expect(operationCalls).toHaveLength(1);

		const operations = operationCalls[0]![1];
		expect(operations).toHaveLength(3);

		expect(operations[0]).toEqual({
			name: 'Condition',
			key: 'condition',
			type: 'condition',
			position_x: 19,
			position_y: 1,
			options: { filter: {} },
			flow: 'new-flow-id',
		});

		for (const payload of operations) {
			expect(payload).not.toHaveProperty('id');
			expect(payload).not.toHaveProperty('resolve');
			expect(payload).not.toHaveProperty('reject');
			expect(payload.flow).toBe('new-flow-id');
		}
	});

	it('relinks the Operation tree and the root Operation to the newly created IDs', async () => {
		mockCreateResponses();

		const { duplicate } = useDuplicate({
			source: ref(source),
			name: ref('Notify (copy)'),
			onSuccess: vi.fn(),
		});

		await duplicate();

		expect(api.patch).toHaveBeenCalledWith('/flows/new-flow-id', {
			operation: 'new-condition',
			operations: {
				update: [{ id: 'new-condition', resolve: 'new-log_success', reject: 'new-log_failure' }],
			},
		});
	});

	it('skips the relink request when the Flow has no Operations', async () => {
		mockCreateResponses();

		const { duplicate } = useDuplicate({
			source: ref({ ...source, operation: null, operations: [] } as unknown as FlowRaw),
			name: ref('Notify (copy)'),
			onSuccess: vi.fn(),
		});

		await duplicate();

		expect(api.post).toHaveBeenCalledTimes(1);
		expect(api.patch).not.toHaveBeenCalled();
	});

	it('reports failures and resets the loading state without calling onSuccess', async () => {
		api.post.mockRejectedValue(new Error('Nope'));

		const onSuccess = vi.fn();

		const { duplicate, duplicating } = useDuplicate({
			source: ref(source),
			name: ref('Notify (copy)'),
			onSuccess,
		});

		await duplicate();

		expect(unexpectedError).toHaveBeenCalled();
		expect(onSuccess).not.toHaveBeenCalled();
		expect(duplicating.value).toBe(false);
		// Nothing was created, so there is nothing to roll back
		expect(api.delete).not.toHaveBeenCalled();
	});

	it('deletes the new Flow when creating its Operations fails', async () => {
		mockCreateResponses();

		api.post.mockImplementation((endpoint: string) => {
			if (endpoint === '/flows') return Promise.resolve({ data: { data: { id: 'new-flow-id' } } });
			return Promise.reject(new Error('Nope'));
		});

		const onSuccess = vi.fn();

		const { duplicate } = useDuplicate({
			source: ref(source),
			name: ref('Notify (copy)'),
			onSuccess,
		});

		await duplicate();

		expect(api.delete).toHaveBeenCalledWith('/flows/new-flow-id');
		expect(unexpectedError).toHaveBeenCalled();
		expect(onSuccess).not.toHaveBeenCalled();
	});

	it('deletes the new Flow when relinking its Operations fails', async () => {
		mockCreateResponses();
		api.patch.mockRejectedValue(new Error('Nope'));

		const { duplicate } = useDuplicate({
			source: ref(source),
			name: ref('Notify (copy)'),
			onSuccess: vi.fn(),
		});

		await duplicate();

		expect(api.delete).toHaveBeenCalledWith('/flows/new-flow-id');
		expect(unexpectedError).toHaveBeenCalled();
	});

	it('trims the given name', async () => {
		mockCreateResponses();

		const { duplicate } = useDuplicate({
			source: ref(source),
			name: ref('  Notify (copy)  '),
			onSuccess: vi.fn(),
		});

		await duplicate();

		expect(api.post).toHaveBeenCalledWith(
			'/flows',
			expect.objectContaining({ name: 'Notify (copy)' }),
			expect.any(Object),
		);
	});

	it('does nothing when the given name is only whitespace', async () => {
		mockCreateResponses();

		const onSuccess = vi.fn();

		const { duplicate } = useDuplicate({
			source: ref(source),
			name: ref('   '),
			onSuccess,
		});

		await duplicate();

		expect(api.post).not.toHaveBeenCalled();
		expect(onSuccess).not.toHaveBeenCalled();
	});

	it('still reports the original failure when the rollback fails', async () => {
		mockCreateResponses();
		api.patch.mockRejectedValue(new Error('Nope'));
		api.delete.mockRejectedValue(new Error('Also nope'));

		const { duplicate, duplicating } = useDuplicate({
			source: ref(source),
			name: ref('Notify (copy)'),
			onSuccess: vi.fn(),
		});

		await duplicate();

		expect(unexpectedError).toHaveBeenCalledTimes(1);
		expect(duplicating.value).toBe(false);
	});
});
