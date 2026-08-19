import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMoveToFolder } from './use-move-to-folder';

vi.mock('@/api', () => ({
	default: {
		patch: vi.fn(),
	},
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

let api: { patch: ReturnType<typeof vi.fn> };
let unexpectedError: ReturnType<typeof vi.fn>;

beforeEach(async () => {
	api = (await vi.importMock('@/api')).default as typeof api;

	({ unexpectedError } = (await vi.importMock('@/utils/unexpected-error')) as {
		unexpectedError: typeof unexpectedError;
	});

	vi.clearAllMocks();
});

describe('useMoveToFolder', () => {
	it('patches the selected flows into the target folder, then re-hydrates', async () => {
		api.patch.mockResolvedValue({ data: { data: {} } });
		const onSuccess = vi.fn();

		const { move, moving } = useMoveToFolder({ onSuccess });
		await move(['flow-1', 'flow-2'], 'folder-a');

		expect(api.patch).toHaveBeenCalledWith('/flows', { keys: ['flow-1', 'flow-2'], data: { folder: 'folder-a' } });
		expect(onSuccess).toHaveBeenCalledOnce();
		expect(moving.value).toBe(false);
	});

	it('moves flows back to root with a null folder', async () => {
		api.patch.mockResolvedValue({ data: { data: {} } });

		const { move } = useMoveToFolder({ onSuccess: vi.fn() });
		await move(['flow-1'], null);

		expect(api.patch).toHaveBeenCalledWith('/flows', { keys: ['flow-1'], data: { folder: null } });
	});

	it('does nothing when no flows are selected', async () => {
		const onSuccess = vi.fn();

		const { move } = useMoveToFolder({ onSuccess });
		await move([], 'folder-a');

		expect(api.patch).not.toHaveBeenCalled();
		expect(onSuccess).not.toHaveBeenCalled();
	});

	it('reports errors and resets the loading flag', async () => {
		api.patch.mockRejectedValue(new Error('nope'));

		const { move, moving } = useMoveToFolder({ onSuccess: vi.fn() });
		await move(['flow-1'], 'folder-a');

		expect(unexpectedError).toHaveBeenCalledOnce();
		expect(moving.value).toBe(false);
	});
});
