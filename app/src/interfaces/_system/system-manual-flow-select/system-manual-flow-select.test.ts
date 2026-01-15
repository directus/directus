import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import SystemManualFlowSelect from './system-manual-flow-select.vue';

const i18n = createI18n({
	legacy: false,
	missingWarn: false,
	locale: 'en-US',
	messages: {
		'en-US': {},
	},
});

afterEach(() => {
	vi.clearAllMocks();
});

const mockFlows = [
	{
		id: 'test-flow-1',
		name: 'test-flow-1',
		description: 'test-description-1',
		options: { collections: ['test-collection'], location: 'item' },
		trigger: 'manual',
		status: 'active',
	},
	{
		id: 'test-flow-2',
		name: 'test-flow-2',
		description: 'test-description-2',
		options: { collections: ['test-collection'], location: 'both' },
		trigger: 'manual',
		status: 'inactive',
	},
	{
		id: 'test-flow-3',
		name: 'test-flow-3',
		description: 'test-description-3',
		options: {
			collections: ['test-collection', 'test-collection-2'],
			location: 'both',
		},
		trigger: 'cron',
		status: 'active',
	},
	{
		id: 'test-flow-4',
		name: 'test-flow-4',
		description: 'test-description-4',
		options: { collections: ['test-collection-2'], location: 'item' },
		trigger: 'manual',
		status: 'active',
	},
];

const mountOptions = {
	global: {
		plugins: [
			createTestingPinia({
				createSpy: vi.fn,
				initialState: {
					flowsStore: {
						flows: mockFlows,
					},
				},
			}),
			i18n,
		],
		stubs: ['v-select'],
	},
	props: {
		value: null,
		collectionName: 'test-collection',
	},
};

test('interface mounts', () => {
	const wrapper = mount(SystemManualFlowSelect, mountOptions);

	expect(wrapper.exists());
});

test('passes props', () => {
	const wrapper = mount(SystemManualFlowSelect, mountOptions);

	expect(wrapper.props()).toEqual({
		value: null,
		collectionName: 'test-collection',
	});

	expect(wrapper.props('value')).toBe(null);
	expect(wrapper.props('collectionName')).toBe('test-collection');
});

test('computes flows items correctly', () => {
	const wrapper = mount(SystemManualFlowSelect, mountOptions);

	const flowsItems = (wrapper.vm as any).flows;

	expect(flowsItems).toBeInstanceOf(Array);
	expect(flowsItems).toHaveLength(2);

	expect(flowsItems[0]).toHaveProperty('value');
	expect(flowsItems[0]).toHaveProperty('text');

	expect(flowsItems).toEqual([
		{
			value: 'test-flow-1',
			text: 'test-flow-1: test-description-1',
		},
		{
			value: 'test-flow-2',
			text: 'test-flow-2: test-description-2 (inactive)',
		},
	]);
});
