import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, nextTick, ref, useSlots } from 'vue';
import { useSlotPresence } from './use-slot-presence';

describe('useSlotPresence', () => {
	it('updates when a slot is added or removed after mount', async () => {
		const showItemAppend = ref(false);

		const SlotConsumer = defineComponent({
			setup() {
				return { hasItemAppend: useSlotPresence(useSlots(), 'item-append') };
			},
			template: '<div><span v-if="hasItemAppend" class="slot-present" /><slot name="item-append" /></div>',
		});

		const TestComponent = defineComponent({
			components: { SlotConsumer },
			setup: () => ({ showItemAppend }),
			template: `
				<SlotConsumer>
					<template v-if="showItemAppend" #item-append>
						<span class="item-append" />
					</template>
				</SlotConsumer>
			`,
		});

		const wrapper = mount(TestComponent);

		expect(wrapper.find('.slot-present').exists()).toBe(false);

		showItemAppend.value = true;
		await nextTick();

		expect(wrapper.find('.slot-present').exists()).toBe(true);
		expect(wrapper.find('.item-append').exists()).toBe(true);

		showItemAppend.value = false;
		await nextTick();

		expect(wrapper.find('.slot-present').exists()).toBe(false);
	});
});
