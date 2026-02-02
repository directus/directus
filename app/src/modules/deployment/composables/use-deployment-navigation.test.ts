import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { useDeploymentNavigation } from './use-deployment-navigation';

const mockRouteParams = vi.hoisted(() => ({
	provider: undefined as string | undefined,
	projectId: undefined as string | undefined,
}));

vi.mock('vue-router', () => ({
	useRoute: vi.fn(() => ({
		params: mockRouteParams,
	})),
}));

const mockSdkRequest = vi.hoisted(() => vi.fn());

vi.mock('@/sdk', () => ({
	sdk: {
		request: mockSdkRequest,
	},
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

function createTestComponent() {
	return defineComponent({
		setup() {
			return useDeploymentNavigation();
		},
		render: () => h('div'),
	});
}

describe('useDeploymentNavigation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockRouteParams.provider = undefined;
		mockRouteParams.projectId = undefined;
	});

	afterEach(async () => {
		// Reset the shared cache by fetching empty data
		mockSdkRequest.mockResolvedValueOnce([]);
		const wrapper = mount(createTestComponent());
		await wrapper.vm.fetch(true);
		await flushPromises();
		wrapper.unmount();
	});

	describe('fetch', () => {
		it('should fetch deployments and populate cache', async () => {
			const mockData = [{ provider: 'vercel', projects: [{ id: 'proj-1', name: 'Project 1' }] }];

			mockSdkRequest.mockResolvedValueOnce(mockData);

			const wrapper = mount(createTestComponent());

			expect(wrapper.vm.providers).toEqual([]);
			expect(wrapper.vm.loading).toBe(false);

			await wrapper.vm.fetch();
			await flushPromises();

			expect(mockSdkRequest).toHaveBeenCalledOnce();
			expect(wrapper.vm.providers).toEqual(mockData);
			expect(wrapper.vm.loading).toBe(false);
		});

		it('should skip fetch when cache exists', async () => {
			const mockData = [{ provider: 'vercel', projects: [] }];

			mockSdkRequest.mockResolvedValueOnce(mockData);

			const wrapper = mount(createTestComponent());

			// First fetch
			await wrapper.vm.fetch();
			await flushPromises();

			expect(mockSdkRequest).toHaveBeenCalledOnce();

			// Second fetch should skip
			await wrapper.vm.fetch();
			await flushPromises();

			expect(mockSdkRequest).toHaveBeenCalledOnce();
		});

		it('should force fetch when force=true', async () => {
			const mockData1 = [{ provider: 'vercel', projects: [] }];
			const mockData2 = [{ provider: 'vercel', projects: [{ id: 'new', name: 'New' }] }];

			mockSdkRequest.mockResolvedValueOnce(mockData1);

			const wrapper = mount(createTestComponent());

			await wrapper.vm.fetch();
			await flushPromises();

			expect(mockSdkRequest).toHaveBeenCalledOnce();

			mockSdkRequest.mockResolvedValueOnce(mockData2);

			await wrapper.vm.fetch(true);
			await flushPromises();

			expect(mockSdkRequest).toHaveBeenCalledTimes(2);
			expect(wrapper.vm.providers).toEqual(mockData2);
		});

		it('should set loading state during fetch', async () => {
			let resolvePromise: (value: unknown) => void;
			const pendingPromise = new Promise((resolve) => {
				resolvePromise = resolve;
			});

			mockSdkRequest.mockReturnValueOnce(pendingPromise);

			const wrapper = mount(createTestComponent());

			expect(wrapper.vm.loading).toBe(false);

			const fetchPromise = wrapper.vm.fetch(true);

			// Loading should be true while fetching
			expect(wrapper.vm.loading).toBe(true);

			resolvePromise!([]);
			await fetchPromise;
			await flushPromises();

			expect(wrapper.vm.loading).toBe(false);
		});
	});

	describe('refresh', () => {
		it('should call fetch with force=true', async () => {
			const mockData = [{ provider: 'vercel', projects: [] }];

			mockSdkRequest.mockResolvedValue(mockData);

			const wrapper = mount(createTestComponent());

			await wrapper.vm.fetch();
			await flushPromises();

			expect(mockSdkRequest).toHaveBeenCalledOnce();

			await wrapper.vm.refresh();
			await flushPromises();

			expect(mockSdkRequest).toHaveBeenCalledTimes(2);
		});
	});

	describe('currentProviderKey', () => {
		it('should return provider from route params', () => {
			mockRouteParams.provider = 'vercel';

			const wrapper = mount(createTestComponent());

			expect(wrapper.vm.currentProviderKey).toBe('vercel');
		});

		it('should return undefined when no provider in route', () => {
			const wrapper = mount(createTestComponent());

			expect(wrapper.vm.currentProviderKey).toBeUndefined();
		});
	});

	describe('currentProjectId', () => {
		it('should return projectId from route params', () => {
			mockRouteParams.projectId = 'proj-123';

			const wrapper = mount(createTestComponent());

			expect(wrapper.vm.currentProjectId).toBe('proj-123');
		});

		it('should return undefined when no projectId in route', () => {
			const wrapper = mount(createTestComponent());

			expect(wrapper.vm.currentProjectId).toBeUndefined();
		});
	});

	describe('currentProject', () => {
		it('should return project when provider and projectId match', async () => {
			const mockProject = { id: 'proj-1', name: 'Project 1' };
			const mockData = [{ provider: 'vercel', projects: [mockProject] }];

			mockSdkRequest.mockResolvedValueOnce(mockData);
			mockRouteParams.provider = 'vercel';
			mockRouteParams.projectId = 'proj-1';

			const wrapper = mount(createTestComponent());

			await wrapper.vm.fetch();
			await flushPromises();

			expect(wrapper.vm.currentProject).toEqual(mockProject);
		});

		it('should return null when provider not found', async () => {
			const mockData = [{ provider: 'vercel', projects: [] }];

			mockSdkRequest.mockResolvedValueOnce(mockData);
			mockRouteParams.provider = 'netlify';
			mockRouteParams.projectId = 'proj-1';

			const wrapper = mount(createTestComponent());

			await wrapper.vm.fetch();
			await flushPromises();

			expect(wrapper.vm.currentProject).toBeNull();
		});

		it('should return null when projectId not found', async () => {
			const mockData = [{ provider: 'vercel', projects: [{ id: 'proj-1', name: 'Project 1' }] }];

			mockSdkRequest.mockResolvedValueOnce(mockData);
			mockRouteParams.provider = 'vercel';
			mockRouteParams.projectId = 'proj-999';

			const wrapper = mount(createTestComponent());

			await wrapper.vm.fetch();
			await flushPromises();

			expect(wrapper.vm.currentProject).toBeNull();
		});

		it('should return null when no route params', async () => {
			const mockData = [{ provider: 'vercel', projects: [{ id: 'proj-1', name: 'Project 1' }] }];

			mockSdkRequest.mockResolvedValueOnce(mockData);

			const wrapper = mount(createTestComponent());

			await wrapper.vm.fetch();
			await flushPromises();

			expect(wrapper.vm.currentProject).toBeNull();
		});
	});
});
