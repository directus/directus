import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import { defineComponent, h, ref, unref } from 'vue';
import { useVisibilityTree, type UseVisibilityTreeConfig } from './use-visibility-tree';

interface TestItem {
	id: string;
	name: string;
	parent: string | null;
}

const createTestComponent = (
	items: TestItem[],
	search: string | null,
	config: UseVisibilityTreeConfig<TestItem, string>,
) => {
	return defineComponent({
		setup() {
			const itemsRef = ref(items);
			const searchRef = ref(search);
			return useVisibilityTree(itemsRef, searchRef, config);
		},
		render: () => h('div'),
	});
};

const defaultConfig: UseVisibilityTreeConfig<TestItem, string> = {
	getId: (item) => item.id,
	getParent: (item) => item.parent,
	matchesSearch: (item, query) => item.name.toLowerCase().includes(query),
};

describe('useVisibilityTree', () => {
	test('returns all expected properties', () => {
		const TestComponent = createTestComponent([], null, defaultConfig);
		const wrapper = mount(TestComponent);

		expect(wrapper.vm).toHaveProperty('visibilityTree');
		expect(wrapper.vm).toHaveProperty('findVisibilityNode');
	});

	test('all items visible when search is null', () => {
		const items: TestItem[] = [
			{ id: 'a', name: 'Alpha', parent: null },
			{ id: 'b', name: 'Beta', parent: null },
		];

		const TestComponent = createTestComponent(items, null, defaultConfig);
		const wrapper = mount(TestComponent);

		const tree = unref(wrapper.vm.visibilityTree);
		expect(tree.length).toBe(2);
		expect(tree[0]!.visible).toBe(true);
		expect(tree[1]!.visible).toBe(true);
	});

	test('filters items based on search query', () => {
		const items: TestItem[] = [
			{ id: 'a', name: 'Alpha', parent: null },
			{ id: 'b', name: 'Beta', parent: null },
		];

		const TestComponent = createTestComponent(items, 'alpha', defaultConfig);
		const wrapper = mount(TestComponent);

		const tree = unref(wrapper.vm.visibilityTree);
		expect(tree[0]!.visible).toBe(true); // Alpha matches
		expect(tree[1]!.visible).toBe(false); // Beta doesn't match
	});

	test('search is case-insensitive', () => {
		const items: TestItem[] = [{ id: 'a', name: 'Alpha', parent: null }];

		const TestComponent = createTestComponent(items, 'ALPHA', defaultConfig);
		const wrapper = mount(TestComponent);

		const tree = unref(wrapper.vm.visibilityTree);
		expect(tree[0]!.visible).toBe(true);
	});

	test('builds nested tree structure', () => {
		const items: TestItem[] = [
			{ id: 'parent', name: 'Parent', parent: null },
			{ id: 'child', name: 'Child', parent: 'parent' },
		];

		const TestComponent = createTestComponent(items, null, defaultConfig);
		const wrapper = mount(TestComponent);

		const tree = unref(wrapper.vm.visibilityTree);
		expect(tree.length).toBe(1); // Only root
		expect(tree[0]!.id).toBe('parent');
		expect(tree[0]!.children.length).toBe(1);
		expect(tree[0]!.children[0]!.id).toBe('child');
	});

	test('propagates visibility backwards - parent visible if child matches', () => {
		const items: TestItem[] = [
			{ id: 'parent', name: 'Parent', parent: null },
			{ id: 'child', name: 'Matching', parent: 'parent' },
		];

		const TestComponent = createTestComponent(items, 'matching', defaultConfig);
		const wrapper = mount(TestComponent);

		const tree = unref(wrapper.vm.visibilityTree);
		// Parent should be visible because child matches
		expect(tree[0]!.visible).toBe(true);
		expect(tree[0]!.children[0]!.visible).toBe(true);
	});

	test('parent hidden if no children match and parent does not match', () => {
		const items: TestItem[] = [
			{ id: 'parent', name: 'Parent', parent: null },
			{ id: 'child', name: 'Child', parent: 'parent' },
		];

		const TestComponent = createTestComponent(items, 'nothing', defaultConfig);
		const wrapper = mount(TestComponent);

		const tree = unref(wrapper.vm.visibilityTree);
		expect(tree[0]!.visible).toBe(false);
		expect(tree[0]!.children[0]!.visible).toBe(false);
	});

	test('deeply nested backward propagation', () => {
		const items: TestItem[] = [
			{ id: 'root', name: 'Root', parent: null },
			{ id: 'child', name: 'Child', parent: 'root' },
			{ id: 'grandchild', name: 'Match', parent: 'child' },
		];

		const TestComponent = createTestComponent(items, 'match', defaultConfig);
		const wrapper = mount(TestComponent);

		const tree = unref(wrapper.vm.visibilityTree);
		const root = tree[0]!;
		const child = root.children[0]!;
		const grandchild = child.children[0]!;

		// All ancestors should be visible due to grandchild matching
		expect(grandchild.visible).toBe(true);
		expect(child.visible).toBe(true);
		expect(root.visible).toBe(true);
	});

	test('findVisibilityNode finds node by ID', () => {
		const items: TestItem[] = [
			{ id: 'parent', name: 'Parent', parent: null },
			{ id: 'child', name: 'Child', parent: 'parent' },
		];

		const TestComponent = createTestComponent(items, null, defaultConfig);
		const wrapper = mount(TestComponent);

		const childNode = wrapper.vm.findVisibilityNode('child');
		expect(childNode).toBeDefined();
		expect(childNode!.id).toBe('child');
	});

	test('findVisibilityNode returns undefined for non-existent ID', () => {
		const items: TestItem[] = [{ id: 'a', name: 'Alpha', parent: null }];

		const TestComponent = createTestComponent(items, null, defaultConfig);
		const wrapper = mount(TestComponent);

		const node = wrapper.vm.findVisibilityNode('nonexistent');
		expect(node).toBeUndefined();
	});

	test('node.findChild finds child within node', () => {
		const items: TestItem[] = [
			{ id: 'parent', name: 'Parent', parent: null },
			{ id: 'child', name: 'Child', parent: 'parent' },
		];

		const TestComponent = createTestComponent(items, null, defaultConfig);
		const wrapper = mount(TestComponent);

		const tree = unref(wrapper.vm.visibilityTree);
		const parent = tree[0]!;
		const foundChild = parent.findChild('child');

		expect(foundChild).toBeDefined();
		expect(foundChild!.id).toBe('child');
	});

	test('stores search value in node', () => {
		const items: TestItem[] = [{ id: 'a', name: 'Alpha', parent: null }];

		const TestComponent = createTestComponent(items, 'test', defaultConfig);
		const wrapper = mount(TestComponent);

		const tree = unref(wrapper.vm.visibilityTree);
		expect(tree[0]!.search).toBe('test');
	});

	test('handles empty items array', () => {
		const TestComponent = createTestComponent([], 'test', defaultConfig);
		const wrapper = mount(TestComponent);

		const tree = unref(wrapper.vm.visibilityTree);
		expect(tree).toEqual([]);
	});

	test('multiple root items at same level', () => {
		const items: TestItem[] = [
			{ id: 'a', name: 'Alpha', parent: null },
			{ id: 'b', name: 'Beta', parent: null },
			{ id: 'c', name: 'Charlie', parent: null },
		];

		const TestComponent = createTestComponent(items, 'beta', defaultConfig);
		const wrapper = mount(TestComponent);

		const tree = unref(wrapper.vm.visibilityTree);
		expect(tree.length).toBe(3);
		expect(tree.find((n) => n.id === 'a')!.visible).toBe(false);
		expect(tree.find((n) => n.id === 'b')!.visible).toBe(true);
		expect(tree.find((n) => n.id === 'c')!.visible).toBe(false);
	});
});
