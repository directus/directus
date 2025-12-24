import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import { useNavBarStore } from '../stores/nav-bar';
import { useSidebarStore } from '../stores/sidebar';
import PrivateViewHeaderBar from './private-view-header-bar.vue';

vi.mock('@vueuse/core', () => ({
	useBreakpoints: vi.fn(() => ({
		smallerOrEqual: vi.fn(() => ({ value: false })),
	})),
	useLocalStorage: vi.fn((_key: string, defaultValue: any) => ref(defaultValue)),
	createEventHook: vi.fn(() => ({
		on: vi.fn(),
		off: vi.fn(),
		trigger: vi.fn(),
	})),
}));

const i18n = createI18n({ legacy: false });

vi.spyOn(i18n.global, 't').mockImplementation((key: any) => key);

const router = createRouter({
	history: createMemoryHistory(),
	routes: [{ path: '/', name: 'root', component: { template: '<div />' } }],
});

const mountOptions = {
	global: {
		plugins: [
			i18n,
			createTestingPinia({
				createSpy: vi.fn,
			}),
			router,
		],
		directives: {
			tooltip: () => {},
		},
		stubs: {
			VButton: false,
		},
	},
};

describe('PrivateViewHeaderBar', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		await router.push('/');
		await router.isReady();
	});

	test('renders the component', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
			},
		});

		expect(wrapper.find('.header-bar').exists()).toBe(true);
	});

	test('applies shadow class when shadow prop is true', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: true,
				inlineNav: false,
			},
		});

		expect(wrapper.find('.header-bar.shadow').exists()).toBe(true);
	});

	test('does not apply shadow class when shadow prop is false', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
			},
		});

		expect(wrapper.find('.header-bar.shadow').exists()).toBe(false);
	});

	test('renders title when provided', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				title: 'Test Title',
				shadow: false,
				inlineNav: false,
			},
		});

		expect(wrapper.text()).toContain('Test Title');
	});

	test('shows nav toggle when showNavToggle is true', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
			},
		});

		const navToggle = wrapper.find('.nav-toggle');
		expect(navToggle.exists()).toBe(true);
	});

	test('hides nav toggle when inlineNav is true and nav is not collapsed', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: true,
			},
		});

		const navBarStore = useNavBarStore();
		navBarStore.collapsed = false;

		const navToggle = wrapper.find('.nav-toggle');
		expect(navToggle.exists()).toBe(false);
	});

	test('calls navBarStore.expand when nav toggle is clicked', async () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
			},
		});

		const navBarStore = useNavBarStore();
		const navToggle = wrapper.find('.nav-toggle');
		await navToggle.trigger('click');

		expect(navBarStore.expand).toHaveBeenCalled();
	});

	test('shows sidebar toggle', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
			},
		});

		const sidebarToggle = wrapper.find('.sidebar-toggle');
		expect(sidebarToggle.exists()).toBe(true);
	});

	test('calls sidebarStore.toggle when sidebar toggle is clicked', async () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
			},
		});

		const sidebarStore = useSidebarStore();
		const sidebarToggle = wrapper.find('.sidebar-toggle');
		await sidebarToggle.trigger('click');

		expect(sidebarStore.toggle).toHaveBeenCalled();
	});

	test('renders back icon when showBack prop is true', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
				showBack: true,
			},
		});

		const backIcon = wrapper.findComponent({ name: 'PrivateViewHeaderBarIcon' });
		expect(backIcon.exists()).toBe(true);
		expect(backIcon.props('showBack')).toBe(true);
	});

	test('renders custom icon when icon prop is provided', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
				icon: 'edit',
				iconColor: 'blue',
			},
		});

		const icon = wrapper.findComponent({ name: 'PrivateViewHeaderBarIcon' });
		expect(icon.exists()).toBe(true);
		expect(icon.props('icon')).toBe('edit');
		expect(icon.props('iconColor')).toBe('blue');
	});

	test('renders headline slot content', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
			},
			slots: {
				headline: '<div class="custom-headline">Headline Content</div>',
			},
		});

		expect(wrapper.find('.custom-headline').exists()).toBe(true);
		expect(wrapper.text()).toContain('Headline Content');
	});

	test('renders title slot content', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
			},
			slots: {
				title: '<div class="custom-title">Custom Title</div>',
			},
		});

		expect(wrapper.find('.custom-title').exists()).toBe(true);
		expect(wrapper.text()).toContain('Custom Title');
	});

	test('renders title-outer:prepend slot content', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
			},
			slots: {
				'title-outer:prepend': '<div class="custom-prepend">Prepend</div>',
			},
		});

		expect(wrapper.find('.custom-prepend').exists()).toBe(true);
	});

	test('renders title-outer:append slot content', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
			},
			slots: {
				'title-outer:append': '<div class="custom-append">Append</div>',
			},
		});

		expect(wrapper.find('.custom-append').exists()).toBe(true);
	});

	test('renders actions slot content', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
			},
			slots: {
				actions: '<div class="custom-actions">Actions</div>',
			},
		});

		expect(wrapper.find('.custom-actions').exists()).toBe(true);
	});

	test('renders title:prepend slot content', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
				title: 'Test Title',
			},
			slots: {
				'title:prepend': '<div class="title-prepend">Prepend</div>',
			},
		});

		expect(wrapper.find('.title-prepend').exists()).toBe(true);
	});

	test('renders title:append slot content', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
				title: 'Test Title',
			},
			slots: {
				'title:append': '<div class="title-append">Append</div>',
			},
		});

		expect(wrapper.find('.title-append').exists()).toBe(true);
	});

	test('showBack takes precedence over icon when both are provided', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
				showBack: true,
				icon: 'edit',
			},
		});

		const headerBarIcon = wrapper.findComponent({ name: 'PrivateViewHeaderBarIcon' });
		expect(headerBarIcon.exists()).toBe(true);
		expect(headerBarIcon.props('showBack')).toBe(true);
		expect(headerBarIcon.props('icon')).toBeUndefined();
	});

	test('showBack takes precedence over title-outer:prepend slot when both are provided', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
				showBack: true,
			},
			slots: {
				'title-outer:prepend': '<div class="custom-prepend">Prepend</div>',
			},
		});

		const headerBarIcon = wrapper.findComponent({ name: 'PrivateViewHeaderBarIcon' });
		expect(headerBarIcon.exists()).toBe(true);
		expect(headerBarIcon.props('showBack')).toBe(true);
		expect(wrapper.find('.custom-prepend').exists()).toBe(false);
	});

	test('icon takes precedence over title-outer:prepend slot when both are provided', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
				icon: 'edit',
			},
			slots: {
				'title-outer:prepend': '<div class="custom-prepend">Prepend</div>',
			},
		});

		const headerBarIcon = wrapper.findComponent({ name: 'PrivateViewHeaderBarIcon' });
		expect(headerBarIcon.exists()).toBe(true);
		expect(headerBarIcon.props('icon')).toBe('edit');
		expect(wrapper.find('.custom-prepend').exists()).toBe(false);
	});

	test('only back button renders when showBack, icon, and slot are all provided', () => {
		const wrapper = mount(PrivateViewHeaderBar, {
			...mountOptions,
			props: {
				shadow: false,
				inlineNav: false,
				showBack: true,
				icon: 'edit',
			},
			slots: {
				'title-outer:prepend': '<div class="custom-prepend">Prepend</div>',
			},
		});

		const headerBarIcon = wrapper.findComponent({ name: 'PrivateViewHeaderBarIcon' });
		expect(headerBarIcon.exists()).toBe(true);
		expect(headerBarIcon.props('showBack')).toBe(true);
		expect(headerBarIcon.props('icon')).toBeUndefined();
		expect(wrapper.find('.custom-prepend').exists()).toBe(false);
	});
});
