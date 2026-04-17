import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import SystemToken from './system-token.vue';
import api from '@/api';

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
		patch: vi.fn(),
	},
}));

vi.mock('@/composables/use-clipboard', () => ({
	useClipboard: () => ({
		isCopySupported: false,
		copyToClipboard: vi.fn(),
	}),
}));

const i18n = createI18n({
	legacy: false,
	missingWarn: false,
	locale: 'en-US',
	messages: { 'en-US': {} },
});

const stubs = {
	'v-input': { template: '<input />' },
	'v-icon': { template: '<span />' },
	'v-button': { template: '<button><slot /></button>' },
	'v-dialog': {
		props: ['modelValue'],
		template: '<div><slot v-if="modelValue" /></div>',
		emits: ['update:modelValue'],
	},
	'v-card': { template: '<div><slot /></div>' },
	'v-card-title': { template: '<div><slot /></div>' },
	'v-card-text': { template: '<div><slot /></div>' },
	'v-card-actions': { template: '<div><slot /></div>' },
	'v-notice': { template: '<div><slot /></div>' },
	'v-error': { name: 'VError', props: ['error'], template: '<div />' },
};

function mountComponent(props: Record<string, unknown> = {}, provide: Record<string, unknown> = {}) {
	return mount(SystemToken, {
		global: {
			plugins: [i18n],
			stubs,
			provide,
		},
		props: {
			value: null,
			collection: 'directus_users',
			...props,
		},
	});
}

afterEach(() => {
	vi.clearAllMocks();
});

describe('isNewUser', () => {
	test('is true when primaryKey is "+"', () => {
		const wrapper = mountComponent({ primaryKey: '+' });
		expect((wrapper.vm as any).isNewUser).toBe(true);
	});

	test('is true when primaryKey is undefined', () => {
		const wrapper = mountComponent();
		expect((wrapper.vm as any).isNewUser).toBe(true);
	});

	test('is false for an existing user id', () => {
		const wrapper = mountComponent({ primaryKey: 'abc-123' });
		expect((wrapper.vm as any).isNewUser).toBe(false);
	});
});

describe('fieldDisabled', () => {
	test('is true for a new user', () => {
		const wrapper = mountComponent({ primaryKey: '+' });
		expect((wrapper.vm as any).fieldDisabled).toBe(true);
	});

	test('is true when disabled prop is set', () => {
		const wrapper = mountComponent({ primaryKey: 'abc-123', disabled: true });
		expect((wrapper.vm as any).fieldDisabled).toBe(true);
	});

	test('is false for an existing user without disabled prop', () => {
		const wrapper = mountComponent({ primaryKey: 'abc-123' });
		expect((wrapper.vm as any).fieldDisabled).toBe(false);
	});
});

describe('hasToken', () => {
	test('is true when value is a masked hash string', () => {
		const wrapper = mountComponent({ primaryKey: 'abc-123', value: '********************' });
		expect((wrapper.vm as any).hasToken).toBe(true);
	});

	test('is false when value is null', () => {
		const wrapper = mountComponent({ primaryKey: 'abc-123', value: null });
		expect((wrapper.vm as any).hasToken).toBe(false);
	});

	test('is true when localValue is set after generation', () => {
		const wrapper = mountComponent({ primaryKey: 'abc-123' });
		(wrapper.vm as any).localValue = 'freshly-generated-token';
		expect((wrapper.vm as any).hasToken).toBe(true);
	});
});

describe('onGenerateOrRegenerate', () => {
	test('opens the regenerate confirm modal when a token already exists, without calling the API', () => {
		const wrapper = mountComponent({ primaryKey: 'abc-123', value: '********************' });
		const vm = wrapper.vm as any;

		vm.onGenerateOrRegenerate();

		expect(vm.confirmRegenerate).toBe(true);
		expect(api.get).not.toHaveBeenCalled();
	});

	test('calls the API directly for first-time generation when no token exists', async () => {
		vi.mocked(api.get).mockResolvedValueOnce({ data: { data: 'generated-token' } });
		vi.mocked(api.patch).mockResolvedValueOnce({});

		const wrapper = mountComponent({ primaryKey: 'abc-123', value: null });
		const vm = wrapper.vm as any;

		vm.onGenerateOrRegenerate();

		await vi.waitFor(() => expect(vm.loading).toBe(false));

		expect(api.get).toHaveBeenCalledWith('/utils/random/string');
		expect(api.patch).toHaveBeenCalledWith('/users/abc-123', { token: 'generated-token' });
		expect(vm.localValue).toBe('generated-token');
		expect(vm.tokenSavedInline).toBe(true);
	});

	test('sets generateError inline when first-time generation fails', async () => {
		const error = new Error('network error');
		vi.mocked(api.get).mockRejectedValueOnce(error);

		const wrapper = mountComponent({ primaryKey: 'abc-123', value: null });
		const vm = wrapper.vm as any;

		vm.onGenerateOrRegenerate();

		await vi.waitFor(() => expect(vm.loading).toBe(false));

		expect(vm.generateError).toBe(error);
		expect(vm.tokenSavedInline).toBe(false);
	});

	test('renders VError in the template when first-time generation fails', async () => {
		const error = new Error('network error');
		vi.mocked(api.get).mockRejectedValueOnce(error);

		const wrapper = mountComponent({ primaryKey: 'abc-123', value: null });

		(wrapper.vm as any).onGenerateOrRegenerate();

		await vi.waitFor(() => expect((wrapper.vm as any).loading).toBe(false));

		const vError = wrapper.findComponent({ name: 'VError' });
		expect(vError.exists()).toBe(true);
		expect(vError.props('error')).toBe(error);
	});
});

describe('onRemove', () => {
	test('does not open the confirm modal when no token exists', () => {
		const wrapper = mountComponent({ primaryKey: 'abc-123', value: null });
		const vm = wrapper.vm as any;

		vm.onRemove();

		expect(vm.confirmRemove).toBe(false);
		expect(api.patch).not.toHaveBeenCalled();
	});
});

describe('confirmRegenerateToken', () => {
	test('generates a new token, patches the user, and closes the modal on success', async () => {
		vi.mocked(api.get).mockResolvedValueOnce({ data: { data: 'regenerated-token' } });
		vi.mocked(api.patch).mockResolvedValueOnce({});

		const wrapper = mountComponent({ primaryKey: 'abc-123', value: '********************' });
		const vm = wrapper.vm as any;
		vm.confirmRegenerate = true;

		await vm.confirmRegenerateToken();

		expect(api.patch).toHaveBeenCalledWith('/users/abc-123', { token: 'regenerated-token' });
		expect(vm.localValue).toBe('regenerated-token');
		expect(vm.confirmRegenerate).toBe(false);
		expect(vm.regenerateError).toBeNull();
	});

	test('sets regenerateError and keeps the modal open on failure', async () => {
		const error = new Error('server error');
		vi.mocked(api.get).mockResolvedValueOnce({ data: { data: 'new-token' } });
		vi.mocked(api.patch).mockRejectedValueOnce(error);

		const wrapper = mountComponent({ primaryKey: 'abc-123', value: '********************' });
		const vm = wrapper.vm as any;
		vm.confirmRegenerate = true;

		await vm.confirmRegenerateToken();

		expect(vm.regenerateError).toBe(error);
		expect(vm.confirmRegenerate).toBe(true);
	});

	test('does not call refresh on success', async () => {
		vi.mocked(api.get).mockResolvedValueOnce({ data: { data: 'regenerated-token' } });
		vi.mocked(api.patch).mockResolvedValueOnce({});
		const refresh = vi.fn();

		const wrapper = mountComponent({ primaryKey: 'abc-123', value: '********************' }, { refresh });
		const vm = wrapper.vm as any;

		await vm.confirmRegenerateToken();

		expect(refresh).not.toHaveBeenCalled();
	});
});

describe('confirmRemoveToken', () => {
	test('patches token to null, closes the modal, and calls refresh on success', async () => {
		vi.mocked(api.patch).mockResolvedValueOnce({});
		const refresh = vi.fn();

		const wrapper = mountComponent({ primaryKey: 'abc-123', value: '********************' }, { refresh });
		const vm = wrapper.vm as any;
		vm.confirmRemove = true;

		await vm.confirmRemoveToken();

		expect(api.patch).toHaveBeenCalledWith('/users/abc-123', { token: null });
		expect(vm.confirmRemove).toBe(false);
		expect(vm.localValue).toBeNull();
		expect(refresh).toHaveBeenCalledOnce();
	});

	test('sets removeError and keeps the modal open on failure', async () => {
		const error = new Error('server error');
		vi.mocked(api.patch).mockRejectedValueOnce(error);

		const wrapper = mountComponent({ primaryKey: 'abc-123', value: '********************' });
		const vm = wrapper.vm as any;
		vm.confirmRemove = true;

		await vm.confirmRemoveToken();

		expect(vm.removeError).toBe(error);
		expect(vm.confirmRemove).toBe(true);
	});
});

describe('closeRegenerateConfirm', () => {
	test('closes the modal and clears the error', () => {
		const wrapper = mountComponent({ primaryKey: 'abc-123', value: '********************' });
		const vm = wrapper.vm as any;
		vm.confirmRegenerate = true;
		vm.regenerateError = new Error('some error');

		vm.closeRegenerateConfirm();

		expect(vm.confirmRegenerate).toBe(false);
		expect(vm.regenerateError).toBeNull();
	});

	test('does not close while loading', () => {
		const wrapper = mountComponent({ primaryKey: 'abc-123', value: '********************' });
		const vm = wrapper.vm as any;
		vm.confirmRegenerate = true;
		vm.loading = true;

		vm.closeRegenerateConfirm();

		expect(vm.confirmRegenerate).toBe(true);
	});
});

describe('closeRemoveConfirm', () => {
	test('closes the modal and clears the error', () => {
		const wrapper = mountComponent({ primaryKey: 'abc-123' });
		const vm = wrapper.vm as any;
		vm.confirmRemove = true;
		vm.removeError = new Error('some error');

		vm.closeRemoveConfirm();

		expect(vm.confirmRemove).toBe(false);
		expect(vm.removeError).toBeNull();
	});

	test('does not close while loading', () => {
		const wrapper = mountComponent({ primaryKey: 'abc-123' });
		const vm = wrapper.vm as any;
		vm.confirmRemove = true;
		vm.loading = true;

		vm.closeRemoveConfirm();

		expect(vm.confirmRemove).toBe(true);
	});
});

describe('props.value watcher', () => {
	test('clears localValue, tokenSavedInline, and generateError when value changes to a masked string', async () => {
		const wrapper = mountComponent({ primaryKey: 'abc-123', value: null });
		const vm = wrapper.vm as any;

		vm.localValue = 'freshly-generated-token';
		vm.tokenSavedInline = true;
		vm.generateError = new Error('previous error');

		await wrapper.setProps({ value: '********************' });

		expect(vm.localValue).toBeNull();
		expect(vm.tokenSavedInline).toBe(false);
		expect(vm.generateError).toBeNull();
	});

	test('clears localValue, tokenSavedInline, and generateError when value changes to null', async () => {
		const wrapper = mountComponent({ primaryKey: 'abc-123', value: '********************' });
		const vm = wrapper.vm as any;

		vm.localValue = 'some-token';
		vm.tokenSavedInline = true;
		vm.generateError = new Error('previous error');

		await wrapper.setProps({ value: null });

		expect(vm.localValue).toBeNull();
		expect(vm.tokenSavedInline).toBe(false);
		expect(vm.generateError).toBeNull();
	});

	test('does not reset state when value changes to a non-masked plain string', async () => {
		const wrapper = mountComponent({ primaryKey: 'abc-123', value: null });
		const vm = wrapper.vm as any;

		vm.localValue = 'freshly-generated-token';
		vm.tokenSavedInline = true;

		await wrapper.setProps({ value: 'plain-text-not-masked' });

		expect(vm.localValue).toBe('freshly-generated-token');
		expect(vm.tokenSavedInline).toBe(true);
	});
});
