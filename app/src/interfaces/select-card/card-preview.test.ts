import { shallowMount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import CardPreview from './card-preview.vue';

describe('CardPreview', () => {
	test('retries rendering when a choice image changes after an error', async () => {
		const wrapper = shallowMount(CardPreview, {
			props: {
				choice: { text: 'Choice', value: 'choice', icon_type: 'image', image: 'image-a' },
				isSelected: false,
				selectionType: 'radio',
				labelId: 'choice-label',
			},
		});

		await wrapper.find('v-image-stub').trigger('error');

		expect(wrapper.find('v-image-stub').exists()).toBe(false);

		await wrapper.setProps({
			choice: { text: 'Choice', value: 'choice', icon_type: 'image', image: 'image-b' },
		});

		expect(wrapper.find('v-image-stub').exists()).toBe(true);
	});
});
