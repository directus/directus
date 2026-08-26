import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import VTable from './v-table.vue';
import { i18n } from '@/lang';

describe('VTable', () => {
	it('updates the item append column when the slot is added after mount', async () => {
		const showItemAppend = ref(false);

		const TestComponent = defineComponent({
			components: { VTable },
			setup: () => ({ showItemAppend }),
			template: `
				<VTable :headers="[]" :items="[{ id: 1 }]">
					<template v-if="showItemAppend" #item-append>
						<span class="item-append" />
					</template>
				</VTable>
			`,
		});

		const wrapper = mount(TestComponent, {
			global: {
				directives: {
					tooltip: () => {},
				},
				plugins: [i18n, createTestingPinia({ createSpy: vi.fn })],
			},
		});

		const table = wrapper.findComponent(VTable);

		expect(table.find('.append').exists()).toBe(false);

		showItemAppend.value = true;
		await nextTick();

		expect(table.find('.append').exists()).toBe(true);
		expect(table.find('.item-append').exists()).toBe(true);

		showItemAppend.value = false;
		await nextTick();

		expect(table.find('.append').exists()).toBe(false);
	});
});
