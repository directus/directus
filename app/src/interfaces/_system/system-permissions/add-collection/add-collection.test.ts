import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createRouter, createWebHistory } from 'vue-router';
import AddCollection from './add-collection.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { directive as clickOutside } from '@/directives/click-outside';
import vTooltip from '@/directives/tooltip';
import { useCollectionsStore } from '@/stores/collections';

function setupMount(excludeCollections?: string[]) {
	const pinia = createPinia();

	const i18n = createI18n({
		legacy: false,
		locale: 'en',
		messages: {
			en: {
				permission_add_collection: 'Add Collection',
			},
		},
	});

	const router = createRouter({
		history: createWebHistory(),
		routes: [{ path: '/', name: 'home', component: { template: '<div />' } }],
	});

	// Teleport target for menus
	let outlet = document.getElementById('menu-outlet');

	if (!outlet) {
		outlet = document.createElement('div');
		outlet.id = 'menu-outlet';
		document.body.appendChild(outlet);
	}

	// Prime the collections store with minimal realistic data
	mount(
		{
			components: { AddCollection },
			template: '<AddCollection :exclude-collections="exclude" />',
			setup() {
				return { exclude: excludeCollections ?? [] };
			},
		},
		{
			global: {
				plugins: [pinia, i18n, router],
				provide: {},
				directives: {
					tooltip: vTooltip as any,
					'click-outside': clickOutside as any,
				},
			},
		},
	);

	const collectionsStore = useCollectionsStore();

	collectionsStore.collections = [
		// Non-system collections (with meta and schema)
		{
			collection: 'articles',
			meta: { icon: 'database' },
			schema: { name: 'articles' },
		} as any,
		{
			collection: 'comments',
			meta: { icon: 'database' },
			schema: { name: 'comments' },
		} as any,
		// System collection
		{
			collection: 'directus_users',
			meta: { icon: 'user' },
			schema: { name: 'directus_users' },
		} as any,
	];

	// Mount the actual component under test with the same plugins
	const wrapper = mount(AddCollection, {
		props: { excludeCollections: excludeCollections ?? [] },
		global: {
			plugins: [pinia, i18n, router],
			directives: {
				tooltip: vTooltip as any,
				'click-outside': clickOutside as any,
			},
		},
	});

	return { wrapper };
}

describe('AddCollection', () => {
	test('renders preview button with label and icon', () => {
		const { wrapper } = setupMount();

		const button = wrapper.findComponent(VButton);
		expect(button.exists()).toBe(true);
		expect(button.text()).toContain('Add Collection');

		const icon = wrapper.findComponent(VIcon);
		expect(icon.exists()).toBe(true);
		expect(icon.props('name')).toBe('arrow_drop_down');
		expect(icon.props('right')).toBe(true);
	});

	test('passes displayItems into VSelect', () => {
		const { wrapper } = setupMount();

		const select = wrapper.findComponent(VSelect);
		expect(select.exists()).toBe(true);

		const items = select.props('items') as any[];
		// Should contain: two available collections, a divider, and a system collection
		expect(Array.isArray(items)).toBe(true);
		expect(items.length).toBe(4);
		expect(items[0].collection).toBe('articles');
		expect(items[1].collection).toBe('comments');
		expect(items[2]).toMatchObject({ divider: true });
		expect(items[3].collection).toBe('directus_users');
	});

	test('disables excluded collections', () => {
		const { wrapper } = setupMount(['comments']);
		const select = wrapper.findComponent(VSelect);
		const items = select.props('items') as any[];

		const commentsItem = items.find((i) => i.collection === 'comments');
		expect(commentsItem?.disabled).toBe(true);
		const articlesItem = items.find((i) => i.collection === 'articles');
		expect(articlesItem?.disabled).toBeFalsy();
	});

	test('emits select when VSelect updates model value', async () => {
		const { wrapper } = setupMount();
		const select = wrapper.findComponent(VSelect);

		await select.vm.$emit('update:model-value', 'articles');

		const emitted = wrapper.emitted('select');
		expect(emitted).toBeTruthy();
		expect(emitted?.[0]?.[0]).toBe('articles');
	});
});
