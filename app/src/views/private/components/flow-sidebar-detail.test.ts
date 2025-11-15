import { mount } from '@vue/test-utils';
import FlowSidebarDetail from './flow-sidebar-detail.vue';
import { createI18n } from 'vue-i18n';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { type ManualFlow } from '@/composables/use-flows';
import { Tooltip } from '@/__utils__/tooltip';

const mockIsActiveFlow = vi.fn(() => true);
const mockRunningFlows = vi.fn(() => [] as string[]);

vi.mock('@/composables/use-flows', () => ({
	useInjectRunManualFlow: () => ({
		runManualFlow: null,
		runningFlows: mockRunningFlows(),
		isActiveFlow: mockIsActiveFlow,
	}),
}));

afterEach(() => {
	vi.clearAllMocks();
});

const i18n = createI18n({
	legacy: false,
	missingWarn: false,
	locale: 'en-US',
	messages: {
		'en-US': {},
	},
});

const mockFlows = [
	{
		id: 'test-flow-1',
		name: 'test-flow-1',
		trigger: 'manual',
		isFlowDisabled: false,
		color: 'red',
		icon: 'active',
	},
	{
		id: 'test-flow-2',
		name: 'test-flow-2',
		trigger: 'manual',
		isFlowDisabled: true,
		color: 'blue',
	},
] as Partial<ManualFlow>[];

const mountOptions = {
	global: {
		plugins: [i18n],
		directives: {
			tooltip: Tooltip,
		},
		stubs: {
			SidebarDetail: {
				template: '<div><slot /></div>',
			},
			VButton: {
				template:
					'<button :data-test="$attrs.disabled && `disabled` ||`active`" :disabled="$attrs.disabled && true"><slot /></button>',
			},
			VIcon: { template: '<span class="icon" ></span>' },
		},
	},
	props: {
		manualFlows: mockFlows as ManualFlow[],
	},
};

describe('basic rendering', () => {
	test('interface mounts', () => {
		const wrapper = mount(FlowSidebarDetail, mountOptions);

		expect(wrapper.exists());
	});

	test('renders a button for every flow', () => {
		const wrapper = mount(FlowSidebarDetail, mountOptions);

		const buttons = wrapper.findAllComponents('button');

		expect(buttons).toHaveLength(2);
	});
});

describe('active state', () => {
	const wrapper = mount(FlowSidebarDetail, mountOptions);

	const activeFlowButton = wrapper.find('[data-test="active"]');

	test('has correct attributes', () => {
		expect(activeFlowButton.attributes('style')).toBe('--v-button-background-color: red;');
		expect(activeFlowButton.attributes('loading')).toBe('false');
	});

	test('has correct children', () => {
		const buttonIcon = activeFlowButton.find('.icon');

		expect(buttonIcon.attributes('name')).toBe('active');
		expect(activeFlowButton.html()).toContain('test-flow-1');
	});
});

describe('inactive state', () => {
	const wrapper = mount(FlowSidebarDetail, mountOptions);

	const activeFlowButton = wrapper.find('[data-test="disabled"]');

	test('has correct attributes', () => {
		expect(activeFlowButton.attributes('style')).toBe('--v-button-background-color: blue;');
		expect(activeFlowButton.attributes('loading')).toBe('false');
	});

	test('has correct children', () => {
		const buttonIcon = activeFlowButton.find('.icon');

		expect(buttonIcon.attributes('name')).toBe('bolt');
		expect(activeFlowButton.html()).toContain('test-flow-2');
	});
});

describe('loading state', () => {
	mockRunningFlows.mockReturnValue(['test-flow-1']);

	const wrapper = mount(FlowSidebarDetail, mountOptions);

	const activeFlowButton = wrapper.find('[data-test="active"]');

	test('has correct attributes', () => {
		expect(activeFlowButton.attributes('loading')).toBe('true');
	});
});
