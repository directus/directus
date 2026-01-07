import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import PresentationLinks from './presentation-links.vue';

vi.mock('@directus/composables');

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

const mockLinks = [
	{
		icon: 'test-icon-1',
		label: 'External URL Link',
		type: 'primary',
		actionType: 'url' as const,
		url: 'http://test.com',
	},
	{
		icon: 'test-icon-2',
		label: 'Internal URL Link',
		type: 'primary',
		actionType: 'url' as const,
		url: '/test',
	},
	{
		icon: 'test-icon-3',
		label: 'Flow Link',
		type: 'secondary',
		actionType: 'flow' as const,
		flow: 'test-flow-id',
	},
];

const mountOptions = {
	global: {
		plugins: [
			createTestingPinia({
				createSpy: vi.fn,
			}),
		],
		stubs: {
			VButton: {
				template:
					'<button :data-test="$attrs.href && `external` || $attrs.to && `internal` || `flow`"><slot /></button>',
			},
			VIcon: { template: '<span class="icon" ></span>' },
		},
	},
	props: {
		links: mockLinks,
		collection: 'test-collection',
	},
};

describe('basic rendering', () => {
	test('interface mounts', () => {
		const wrapper = mount(PresentationLinks, mountOptions);

		expect(wrapper.exists());
	});

	test('renders a button for every link', () => {
		const wrapper = mount(PresentationLinks, mountOptions);

		const buttons = wrapper.findAllComponents('button');

		expect(buttons).toHaveLength(3);
	});
});

describe('external link', () => {
	const wrapper = mount(PresentationLinks, mountOptions);

	const buttonExternalLink = wrapper.find('[data-test="external"]');

	test('has correct attributes', () => {
		expect(buttonExternalLink.attributes('href')).toBe(mockLinks[0]!.url);
		expect(buttonExternalLink.attributes('class')).toBe('action primary');
		expect(buttonExternalLink.attributes('icon')).toBe('false');
		expect(buttonExternalLink.attributes('secondary')).toBe('false');
	});

	test('has correct child', () => {
		const buttonIcon = buttonExternalLink.find('.icon');

		expect(buttonIcon.attributes('name')).toBe('test-icon-1');
		expect(buttonIcon.html()).toContain('External URL Link');
		expect(buttonIcon.attributes('left')).toBeTruthy();
	});
});

describe('internal link', () => {
	const wrapper = mount(PresentationLinks, mountOptions);

	const buttonExternalLink = wrapper.find('[data-test="internal"]');

	test('has correct attributes', () => {
		expect(buttonExternalLink.attributes('to')).toBe(mockLinks[1]!.url);
		expect(buttonExternalLink.attributes('class')).toBe('action primary');
		expect(buttonExternalLink.attributes('icon')).toBe('false');
		expect(buttonExternalLink.attributes('secondary')).toBe('false');
	});

	test('has correct child', () => {
		const buttonIcon = buttonExternalLink.find('.icon');

		expect(buttonIcon.attributes('name')).toBe('test-icon-2');
		expect(buttonIcon.html()).toContain('Internal URL Link');
		expect(buttonIcon.attributes('left')).toBeTruthy();
	});
});

describe('flow link', () => {
	describe('active state', () => {
		const wrapper = mount(PresentationLinks, mountOptions);

		const buttonFlowLink = wrapper.find('[data-test="flow"]');

		test('has correct attributes', () => {
			expect(buttonFlowLink.attributes('to')).toBe(mockLinks[2]!.url);
			expect(buttonFlowLink.attributes('class')).toBe('action secondary');
			expect(buttonFlowLink.attributes('icon')).toBe('false');
			expect(buttonFlowLink.attributes('secondary')).toBe('true');
			expect(buttonFlowLink.attributes('loading')).toBe('false');
		});

		test('has correct child', () => {
			const buttonIcon = buttonFlowLink.find('.icon');

			expect(buttonIcon.attributes('name')).toBe('test-icon-3');
			expect(buttonIcon.html()).toContain('Flow Link');
			expect(buttonIcon.attributes('left')).toBeTruthy();
		});
	});

	describe('disabled state', () => {
		test('does not render flow button', () => {
			mockIsActiveFlow.mockReturnValue(false);

			const wrapper = mount(PresentationLinks, mountOptions);
			const buttons = wrapper.findAllComponents('button');
			const buttonFlowLink = wrapper.find('[data-test="flow"]');

			expect(buttons).toHaveLength(2);
			expect(buttonFlowLink.exists()).toBe(false);
		});
	});

	describe('loading state', () => {
		test('renders with loading state', () => {
			mockIsActiveFlow.mockReturnValue(true);
			mockRunningFlows.mockReturnValue(['test-flow-id']);

			const wrapper = mount(PresentationLinks, mountOptions);
			const buttonFlowLink = wrapper.find('[data-test="flow"]');

			expect(buttonFlowLink.attributes('loading')).toBe('true');
		});
	});
});
