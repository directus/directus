import { describe, expect, test, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { Tooltip } from '@/__utils__/tooltip';
import Header from './header.vue';
import { computed } from 'vue';
import { createI18n } from 'vue-i18n';

const i18n = createI18n({
	legacy: false,
	missingWarn: false,
	locale: 'en-US',
	messages: {
		'en-US': {},
	},
});

const mockIsActiveFlow = vi.fn(() => true);
const mockRunningFlows = vi.fn(() => [] as string[]);

vi.mock('@/composables/use-flows', () => ({
	useInjectRunManualFlow: () => ({
		runManualFlow: null,
		runningFlows: mockRunningFlows(),
		isActiveFlow: mockIsActiveFlow,
	}),
}));

vi.mock('@/composables/use-template-data', () => ({
	useTemplateData: () => ({ templateData: computed(() => undefined) }),
}));

const mountOptions = {
	global: {
		plugins: [
			createTestingPinia({
				createSpy: vi.fn,
			}),
			i18n,
		],
		stubs: [
			'render-template',
			'router-link',
			'transition-expand',
			'v-icon',
			'v-button',
			'v-dialog',
			'v-card',
			'v-card-actions',
			'v-card-text',
			'v-menu',
			'v-list',
			'v-list-item-icon',
			'v-progress-circular',
			'v-list-item-content',
			'v-list-item',
		],
		directives: {
			tooltip: Tooltip,
		},
	},
	props: {
		title: 'Title',
		subtitle: 'Title',
		links: [],
		help: '<h1>Help</h1>',
		enableHelpTranslations: false,
		color: 'purple',
		collection: 'test-collection',
		primaryKey: '1',
	},
};

const urlLink = { icon: 'launch', label: 'url', type: 'primary', actionType: 'url', url: 'https://example.com' };
const flowLink = { icon: 'automation', label: 'flow', type: 'secondary', actionType: 'flow', flow: 'test-flow' };

describe('basic rendering', () => {
	test('interface mounts', () => {
		const wrapper = mount(Header, mountOptions);

		expect(wrapper.exists());
	});

	test('renders only help button when no links', () => {
		const wrapper = mount(Header, mountOptions);

		const actionsContainer = wrapper.find('[class="actions-container"]');
		const actionButtons = actionsContainer.findAll('v-button-stub');
		expect(actionButtons.length).toEqual(1);
	});

	test('renders primaryLink button for single link', () => {
		const testMountOptions = { ...mountOptions, props: { ...mountOptions.props, links: [urlLink] } };

		const wrapper = mount(Header, testMountOptions);

		const actionsContainer = wrapper.find('[class="actions-container"]');
		const actionButtons = actionsContainer.findAll('v-button-stub');
		expect(actionButtons.length).toEqual(2);
	});

	test('renders v-menu button for multiple links', () => {
		const testMountOptions = { ...mountOptions, props: { ...mountOptions.props, links: [urlLink, flowLink] } };

		const wrapper = mount(Header, testMountOptions);

		const vMenu = wrapper.find('v-menu-stub');

		expect(vMenu.exists());
	});
});
