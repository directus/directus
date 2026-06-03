import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { type PolicyItem, useDuplicate } from './use-duplicate';

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
	},
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

const source: PolicyItem = {
	id: 'policy-abc',
	name: 'Editor',
	icon: 'supervised_user_circle',
	description: 'Can edit content',
	enforce_tfa: false,
	ip_access: null,
	app_access: true,
	admin_access: false,
	userCount: 3,
	roleCount: 1,
};

let api: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

beforeEach(async () => {
	api = (await vi.importMock('@/api')).default as typeof api;
	vi.clearAllMocks();
});

describe('useDuplicate', () => {
	it('POSTs to /policies with the expected shape derived from the source item', async () => {
		api.get.mockResolvedValue({ data: { data: [] } });
		api.post.mockResolvedValue({ data: { data: { id: 'new-policy-id' } } });

		const { duplicate } = useDuplicate({
			source: ref(source),
			name: ref('Editor (copy)'),
			onSuccess: vi.fn(),
		});

		await duplicate();

		expect(api.post).toHaveBeenCalledWith('/policies', {
			name: 'Editor (copy)',
			icon: 'supervised_user_circle',
			description: 'Can edit content',
			enforce_tfa: false,
			ip_access: null,
			app_access: true,
			admin_access: false,
		});
	});

	it('does not copy users or roles onto the new policy', async () => {
		api.get.mockResolvedValue({ data: { data: [] } });
		api.post.mockResolvedValue({ data: { data: { id: 'new-policy-id' } } });

		const { duplicate } = useDuplicate({
			source: ref(source),
			name: ref('Editor (copy)'),
			onSuccess: vi.fn(),
		});

		await duplicate();

		const postedPolicy = api.post.mock.calls[0]![1];
		expect(postedPolicy).not.toHaveProperty('users');
		expect(postedPolicy).not.toHaveProperty('roles');
	});

	it('POSTs permissions with the new policy id and without the original policy id', async () => {
		api.get.mockResolvedValue({
			data: {
				data: [
					{
						collection: 'articles',
						action: 'read',
						permissions: null,
						validation: null,
						presets: null,
						fields: ['*'],
						policy: source.id,
					},
					{
						collection: 'articles',
						action: 'create',
						permissions: null,
						validation: null,
						presets: null,
						fields: null,
						policy: source.id,
					},
				],
			},
		});

		api.post.mockResolvedValue({ data: { data: { id: 'new-policy-id' } } });

		const { duplicate } = useDuplicate({
			source: ref(source),
			name: ref('Editor (copy)'),
			onSuccess: vi.fn(),
		});

		await duplicate();

		expect(api.post).toHaveBeenCalledWith('/permissions', [
			{
				collection: 'articles',
				action: 'read',
				permissions: null,
				validation: null,
				presets: null,
				fields: ['*'],
				policy: 'new-policy-id',
			},
			{
				collection: 'articles',
				action: 'create',
				permissions: null,
				validation: null,
				presets: null,
				fields: null,
				policy: 'new-policy-id',
			},
		]);
	});

	it('skips the permissions POST when the source policy has no permissions', async () => {
		api.get.mockResolvedValue({ data: { data: [] } });
		api.post.mockResolvedValue({ data: { data: { id: 'new-policy-id' } } });

		const { duplicate } = useDuplicate({
			source: ref(source),
			name: ref('Editor (copy)'),
			onSuccess: vi.fn(),
		});

		await duplicate();

		// Only the policy POST should have been called
		expect(api.post).toHaveBeenCalledTimes(1);
		expect(api.post).toHaveBeenCalledWith('/policies', expect.any(Object));
	});
});
