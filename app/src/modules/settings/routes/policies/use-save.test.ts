import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useSave } from './use-save';

const pushMock = vi.fn();

vi.mock('vue-router', () => ({
	useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/api', () => ({
	default: {
		post: vi.fn(),
	},
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

let api: { post: ReturnType<typeof vi.fn> };

beforeEach(async () => {
	api = (await vi.importMock('@/api')).default as typeof api;
	vi.clearAllMocks();
	api.post.mockResolvedValue({ data: { data: { id: 'new-policy-id' } } });
});

describe('useSave', () => {
	it('POSTs to /policies with the configured access flags', async () => {
		const { save } = useSave({ name: ref('Editor'), appAccess: ref(true), adminAccess: ref(false) });

		await save();

		expect(api.post).toHaveBeenCalledWith('/policies', {
			name: 'Editor',
			admin_access: false,
			app_access: true,
		});
	});

	it('does not persist permission records when app access is enabled', async () => {
		const { save } = useSave({ name: ref('Editor'), appAccess: ref(true), adminAccess: ref(false) });

		await save();

		expect(api.post).toHaveBeenCalledTimes(1);
		expect(api.post).not.toHaveBeenCalledWith('/permissions', expect.anything());
	});

	it('navigates to the created policy', async () => {
		const { save } = useSave({ name: ref('Editor'), appAccess: ref(false), adminAccess: ref(false) });

		await save();

		expect(pushMock).toHaveBeenCalledWith({
			name: 'settings-policies-item',
			params: { primaryKey: 'new-policy-id' },
		});
	});
});
