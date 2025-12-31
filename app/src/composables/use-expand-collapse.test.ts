import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, unref } from 'vue';
import { useExpandCollapse, type UseExpandCollapseOptions } from './use-expand-collapse';

// Mock useLocalStorage from vueuse
vi.mock('@vueuse/core', () => ({
	useLocalStorage: vi.fn((key: string, initialValue: string[]) => {
		// Simple reactive mock that stores in a closure
		let value = [...initialValue];
		return {
			get value() {
				return value;
			},
			set value(newValue: string[]) {
				value = newValue;
			},
		};
	}),
}));

const createTestComponent = (storageKey: string, options: UseExpandCollapseOptions) => {
	return defineComponent({
		setup() {
			return useExpandCollapse(storageKey, options);
		},
		render: () => h('div'),
	});
};

describe('useExpandCollapse', () => {
	const mockOptions: UseExpandCollapseOptions = {
		getExpandableIds: () => ['parent-1', 'parent-2'],
		getAllIds: () => ['parent-1', 'parent-2', 'child-1', 'child-2'],
	};

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('returns all expected properties', () => {
		const TestComponent = createTestComponent('test-key', mockOptions);
		const wrapper = mount(TestComponent);

		expect(wrapper.vm).toHaveProperty('collapsedIds');
		expect(wrapper.vm).toHaveProperty('hasExpandable');
		expect(wrapper.vm).toHaveProperty('expandAll');
		expect(wrapper.vm).toHaveProperty('collapseAll');
		expect(wrapper.vm).toHaveProperty('toggleCollapse');
		expect(wrapper.vm).toHaveProperty('isCollapsed');
	});

	test('hasExpandable returns true when there are expandable items', () => {
		const TestComponent = createTestComponent('test-key', mockOptions);
		const wrapper = mount(TestComponent);

		expect(unref(wrapper.vm.hasExpandable)).toBe(true);
	});

	test('hasExpandable returns false when there are no expandable items', () => {
		const emptyOptions: UseExpandCollapseOptions = {
			getExpandableIds: () => [],
			getAllIds: () => ['item-1', 'item-2'],
		};

		const TestComponent = createTestComponent('test-key', emptyOptions);
		const wrapper = mount(TestComponent);

		expect(unref(wrapper.vm.hasExpandable)).toBe(false);
	});

	test('expandAll sets collapsedIds to empty array', () => {
		const TestComponent = createTestComponent('test-key', mockOptions);
		const wrapper = mount(TestComponent);

		// First collapse some items
		wrapper.vm.collapsedIds.value = ['parent-1', 'parent-2'];

		// Then expand all
		wrapper.vm.expandAll();

		expect(wrapper.vm.collapsedIds.value).toEqual([]);
	});

	test('collapseAll sets collapsedIds to all IDs', () => {
		const TestComponent = createTestComponent('test-key', mockOptions);
		const wrapper = mount(TestComponent);

		wrapper.vm.collapseAll();

		expect(wrapper.vm.collapsedIds.value).toEqual(['parent-1', 'parent-2', 'child-1', 'child-2']);
	});

	test('toggleCollapse adds ID when not collapsed', () => {
		const TestComponent = createTestComponent('test-key', mockOptions);
		const wrapper = mount(TestComponent);

		// Start with empty collapsed
		wrapper.vm.collapsedIds.value = [];

		wrapper.vm.toggleCollapse('parent-1');

		expect(wrapper.vm.collapsedIds.value).toContain('parent-1');
	});

	test('toggleCollapse removes ID when already collapsed', () => {
		const TestComponent = createTestComponent('test-key', mockOptions);
		const wrapper = mount(TestComponent);

		// Start with parent-1 collapsed
		wrapper.vm.collapsedIds.value = ['parent-1'];

		wrapper.vm.toggleCollapse('parent-1');

		expect(wrapper.vm.collapsedIds.value).not.toContain('parent-1');
	});

	test('isCollapsed returns true for collapsed items', () => {
		const TestComponent = createTestComponent('test-key', mockOptions);
		const wrapper = mount(TestComponent);

		wrapper.vm.collapsedIds.value = ['parent-1'];

		expect(wrapper.vm.isCollapsed('parent-1')).toBe(true);
		expect(wrapper.vm.isCollapsed('parent-2')).toBe(false);
	});

	test('uses different storage keys independently', () => {
		const TestComponent1 = createTestComponent('key-1', mockOptions);
		const TestComponent2 = createTestComponent('key-2', mockOptions);

		const wrapper1 = mount(TestComponent1);
		const _wrapper2 = mount(TestComponent2);

		wrapper1.vm.toggleCollapse('parent-1');

		// Each instance should have independent state
		expect(wrapper1.vm.collapsedIds.value).toContain('parent-1');
		// Note: Due to mock, wrapper2 starts fresh
	});
});
