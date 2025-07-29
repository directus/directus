import { describe, expect, it, vi } from 'vitest';
import { ref, nextTick, defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { isWritableProp, createLayoutWrapper, useLayout } from './use-layout';

// Mock the useExtensions dependency
vi.mock('./use-system.js', () => ({
	useExtensions: vi.fn(() => ({
		layouts: ref([
			{
				id: 'table',
				name: 'Table Layout',
				icon: 'table',
				component: defineComponent({
					name: 'LayoutTable',
					template: '<div>Table Layout</div>',
				}),
				slots: {
					options: defineComponent({ template: '<div>Options</div>' }),
					sidebar: defineComponent({ template: '<div>Sidebar</div>' }),
					actions: defineComponent({ template: '<div>Actions</div>' }),
				},
				setup: () => ({}),
			},
			{
				id: 'tabular',
				name: 'Tabular Layout',
				icon: 'table',
				component: defineComponent({
					name: 'LayoutTabular',
					template: '<div>Tabular Layout</div>',
				}),
				slots: {
					options: defineComponent({ template: '<div>Options</div>' }),
					sidebar: defineComponent({ template: '<div>Sidebar</div>' }),
					actions: defineComponent({ template: '<div>Actions</div>' }),
				},
				setup: () => ({}),
			},
			{
				id: 'cards',
				name: 'Cards Layout',
				icon: 'grid_3x3',
				component: defineComponent({
					name: 'LayoutCards',
					template: '<div>Cards Layout</div>',
				}),
				slots: {
					options: defineComponent({ template: '<div>Options</div>' }),
					sidebar: defineComponent({ template: '<div>Sidebar</div>' }),
					actions: defineComponent({ template: '<div>Actions</div>' }),
				},
				setup: () => ({}),
			},
		]),
	})),
}));

describe('isWritableProp', () => {
	it('should return true for writable properties', () => {
		expect(isWritableProp('selection')).toBe(true);
		expect(isWritableProp('layoutOptions')).toBe(true);
		expect(isWritableProp('layoutQuery')).toBe(true);
	});

	it('should return false for non-writable properties', () => {
		expect(isWritableProp('collection')).toBe(false);
		expect(isWritableProp('readonly')).toBe(false);
		expect(isWritableProp('search')).toBe(false);
		expect(isWritableProp('filter')).toBe(false);
		expect(isWritableProp('selectMode')).toBe(false);
		expect(isWritableProp('clearFilters')).toBe(false);
		expect(isWritableProp('resetPreset')).toBe(false);
		expect(isWritableProp('someOtherProp')).toBe(false);
		expect(isWritableProp('nonExistent')).toBe(false);
	});

	it('should handle empty string', () => {
		expect(isWritableProp('')).toBe(false);
	});

	it('should handle special characters', () => {
		expect(isWritableProp('collection-test')).toBe(false);
		expect(isWritableProp('collection_test')).toBe(false);
	});
});

describe('createLayoutWrapper', () => {
	const mockLayout = {
		id: 'test',
		name: 'Test Layout',
		icon: 'test',
		component: defineComponent({
			name: 'LayoutTest',
			template: '<div>Test Layout</div>',
		}),
		slots: {
			options: defineComponent({ template: '<div>Options</div>' }),
			sidebar: defineComponent({ template: '<div>Sidebar</div>' }),
			actions: defineComponent({ template: '<div>Actions</div>' }),
		},
		setup: () => ({}),
	};

	it('should create a Vue component with correct name', () => {
		const wrapper = createLayoutWrapper(mockLayout);
		expect(wrapper.name).toBe('test-wrapper');
	});

	it('should have all required props defined', () => {
		const wrapper = createLayoutWrapper(mockLayout);

		// Test component creation
		const component = mount(wrapper, {
			props: {
				collection: 'test-collection',
			},
		});

		expect(component.exists()).toBe(true);
	});

	it('should render slot content with layout state', () => {
		const wrapper = createLayoutWrapper(mockLayout);

		const component = mount(wrapper, {
			props: {
				collection: 'test-collection',
			},
			slots: {
				default: '<div>Test slot content</div>',
			},
		});

		expect(component.html()).toContain('Test slot content');
	});

	it('should return empty content when no slot is provided', () => {
		const wrapper = createLayoutWrapper(mockLayout);

		const component = mount(wrapper, {
			props: {
				collection: 'test-collection',
			},
		});

		expect(component.html()).toBe('');
	});

	it('should handle props and reactive state correctly', () => {
		const wrapper = createLayoutWrapper(mockLayout);

		const component = mount(wrapper, {
			props: {
				collection: 'test-collection',
				selection: ['item1', 'item2'],
				layoutOptions: { title: 'Test Title' },
				layoutQuery: { limit: 10 },
			},
			slots: {
				default: `
					<div>
						<span class="collection">{{ layoutState.collection }}</span>
						<span class="selection">{{ layoutState.selection }}</span>
						<span class="options">{{ layoutState.layoutOptions }}</span>
						<span class="query">{{ layoutState.layoutQuery }}</span>
					</div>
				`,
			},
		});

		expect(component.find('.collection').text()).toBe('test-collection');
		expect(component.find('.selection').text()).toContain('item1');
		expect(component.find('.selection').text()).toContain('item2');
		expect(component.find('.options').text()).toContain('Test Title');
		expect(component.find('.query').text()).toContain('10');
	});

	it('should create update handlers for state properties', () => {
		const wrapper = createLayoutWrapper(mockLayout);

		const component = mount(wrapper, {
			props: {
				collection: 'test-collection',
				layoutOptions: { title: 'Initial' },
			},
			slots: {
				default: `
					<div>
						<span>{{ layoutState.layoutOptions.title }}</span>
					</div>
				`,
			},
		});

		// Verify initial state
		expect(component.text()).toContain('Initial');

		// The update functions should be available in the component state
		expect(component.vm.state['onUpdate:selection']).toBeDefined();
		expect(component.vm.state['onUpdate:layoutOptions']).toBeDefined();
		expect(component.vm.state['onUpdate:layoutQuery']).toBeDefined();
	});

	it('should handle writable props correctly in update handlers', () => {
		const wrapper = createLayoutWrapper(mockLayout);

		const component = mount(wrapper, {
			props: {
				collection: 'test-collection',
				selection: [],
			},
			slots: {
				default: '<div>Test content</div>',
			},
		});

		// Test that update functions exist and can be called
		expect(component.vm.state['onUpdate:selection']).toBeDefined();
		expect(component.vm.state['onUpdate:layoutOptions']).toBeDefined();
		expect(component.vm.state['onUpdate:layoutQuery']).toBeDefined();

		// Test emit functionality
		component.vm.state['onUpdate:selection'](['item1']);
		expect(component.emitted('update:selection')).toBeTruthy();
		expect(component.emitted('update:selection')?.[0]).toEqual([['item1']]);
	});

	it('should not update prop values when they exist in props', () => {
		const wrapper = createLayoutWrapper(mockLayout);

		const component = mount(wrapper, {
			props: {
				collection: 'test-collection',
				layoutOptions: { title: 'Fixed Title' },
			},
			slots: {
				default: '<div>Test content</div>',
			},
		});

		// Access the layoutState to verify it uses prop values
		const vm = component.vm as any;
		expect(vm.state.layoutOptions.title).toBe('Fixed Title');
	});

	it('should handle all prop defaults correctly', () => {
		const wrapper = createLayoutWrapper(mockLayout);

		const component = mount(wrapper, {
			props: {
				collection: 'test-collection',
			},
		});

		const vm = component.vm as any;
		expect(vm.state.selection).toEqual([]);
		expect(vm.state.layoutOptions).toEqual({});
		expect(vm.state.layoutQuery).toEqual({});
		expect(vm.state.filter).toBeNull();
		expect(vm.state.search).toBeNull();
		expect(vm.state.selectMode).toBe(false);
		expect(vm.state.readonly).toBe(false);
	});

	it('should handle non-writable prop updates', () => {
		const mockLayoutWithCustomProp = {
			id: 'test',
			name: 'Test Layout',
			icon: 'test',
			component: defineComponent({
				name: 'TestLayout',
				template: '<div>Test</div>',
			}),
			slots: {
				options: defineComponent({ template: '<div>Options</div>' }),
				sidebar: defineComponent({ template: '<div>Sidebar</div>' }),
				actions: defineComponent({ template: '<div>Actions</div>' }),
			},
			setup: () => ({ customProp: 'initial' }),
		};

		const wrapper = createLayoutWrapper(mockLayoutWithCustomProp);

		const component = mount(wrapper, {
			props: { collection: 'test-collection' },
		});

		const vm = component.vm as any;

		// Test updating a non-writable prop that's not in original props
		expect(vm.state.customProp).toBe('initial');
		vm.state['onUpdate:customProp']('updated');
		expect(vm.state.customProp).toBe('updated');
	});
});

describe('useLayout', () => {
	it('should return the correct layout wrapper for existing layout', () => {
		const layoutId = ref('table');
		const { layoutWrapper } = useLayout(layoutId);

		expect(layoutWrapper.value.name).toBe('table-wrapper');
	});

	it('should return tabular layout as fallback for non-existing layout', () => {
		const layoutId = ref('non-existent');
		const { layoutWrapper } = useLayout(layoutId);

		expect(layoutWrapper.value.name).toBe('tabular-wrapper');
	});

	it('should return tabular layout as fallback for null layout id', () => {
		const layoutId = ref(null);
		const { layoutWrapper } = useLayout(layoutId);

		expect(layoutWrapper.value.name).toBe('tabular-wrapper');
	});

	it('should reactively update layout wrapper when layoutId changes', async () => {
		const layoutId = ref('table');
		const { layoutWrapper } = useLayout(layoutId);

		expect(layoutWrapper.value.name).toBe('table-wrapper');

		layoutId.value = 'cards';
		await nextTick();

		expect(layoutWrapper.value.name).toBe('cards-wrapper');
	});

	it('should fallback to tabular when switching to invalid layout', async () => {
		const layoutId = ref('cards');
		const { layoutWrapper } = useLayout(layoutId);

		expect(layoutWrapper.value.name).toBe('cards-wrapper');

		layoutId.value = 'invalid';
		await nextTick();

		expect(layoutWrapper.value.name).toBe('tabular-wrapper');
	});

	it('should work with typed generic parameters', () => {
		interface TestOptions {
			title: string;
		}

		interface TestQuery {
			limit: number;
		}

		const layoutId = ref('table');
		const { layoutWrapper } = useLayout<TestOptions, TestQuery>(layoutId);

		// Should compile without TypeScript errors
		expect(layoutWrapper.value).toBeDefined();
	});

	it('should create layout wrappers for all available layouts', () => {
		const tableLayoutId = ref('table');
		const cardsLayoutId = ref('cards');

		const { layoutWrapper: tableWrapper } = useLayout(tableLayoutId);
		const { layoutWrapper: cardsWrapper } = useLayout(cardsLayoutId);

		expect(tableWrapper.value.name).toBe('table-wrapper');
		expect(cardsWrapper.value.name).toBe('cards-wrapper');
	});

	it('should handle edge case with empty layout id string', () => {
		const layoutId = ref('');
		const { layoutWrapper } = useLayout(layoutId);

		expect(layoutWrapper.value.name).toBe('tabular-wrapper');
	});

	it('should handle undefined layout id', () => {
		const layoutId = ref<string | null>(null);
		const { layoutWrapper } = useLayout(layoutId);

		expect(layoutWrapper.value.name).toBe('tabular-wrapper');
	});
});

describe('Layout Integration', () => {
	it('should integrate createLayoutWrapper and useLayout correctly', () => {
		const layoutId = ref('cards');
		const { layoutWrapper } = useLayout(layoutId);

		expect(layoutWrapper.value.name).toBe('cards-wrapper');
		expect(layoutWrapper.value).toBeDefined();
	});

	it('should pass props correctly through the wrapper', () => {
		const layoutId = ref('table');
		const { layoutWrapper } = useLayout(layoutId);

		const component = mount(layoutWrapper.value, {
			props: {
				collection: 'users',
				selection: ['user1'],
				layoutOptions: { spacing: 'compact' },
			},
			slots: {
				default: `
					<div>
						<span class="collection">{{ layoutState.collection }}</span>
						<span class="selection">{{ layoutState.selection.length }}</span>
						<span class="options">{{ layoutState.layoutOptions.spacing }}</span>
					</div>
				`,
			},
		});

		expect(component.find('.collection').text()).toBe('users');
		expect(component.find('.selection').text()).toBe('1');
		expect(component.find('.options').text()).toBe('compact');
	});

	it('should handle layout switching with state preservation', async () => {
		const layoutId = ref('table');

		const wrapper = mount({
			template: `
				<component
					:is="currentLayout"
					collection="test"
					:layout-options="{ value: currentValue }"
				>
					<div>{{ currentValue }}</div>
				</component>
			`,
			setup() {
				const { layoutWrapper } = useLayout(layoutId);
				return {
					currentLayout: layoutWrapper,
				};
			},
			data() {
				return {
					currentValue: 'table-value',
				};
			},
		});

		expect(wrapper.text().trim()).toBe('table-value');

		// Switch layout and update value
		layoutId.value = 'cards';
		wrapper.setData({ currentValue: 'cards-value' });
		await nextTick();

		expect(wrapper.text().trim()).toBe('cards-value');
	});

	it('should maintain consistent wrapper generation', () => {
		const layoutId = ref('table');
		const { layoutWrapper: wrapper1 } = useLayout(layoutId);
		const { layoutWrapper: wrapper2 } = useLayout(layoutId);

		// Should create the same wrapper component for the same layout
		expect(wrapper1.value.name).toBe(wrapper2.value.name);
		expect(wrapper1.value).toBeDefined();
		expect(wrapper2.value).toBeDefined();
	});

	it('should handle rapid layout switching', async () => {
		const layoutId = ref('table');
		const { layoutWrapper } = useLayout(layoutId);

		expect(layoutWrapper.value.name).toBe('table-wrapper');

		layoutId.value = 'cards';
		await nextTick();
		expect(layoutWrapper.value.name).toBe('cards-wrapper');

		layoutId.value = 'table';
		await nextTick();
		expect(layoutWrapper.value.name).toBe('table-wrapper');

		layoutId.value = 'non-existent';
		await nextTick();
		expect(layoutWrapper.value.name).toBe('tabular-wrapper');
	});
});
