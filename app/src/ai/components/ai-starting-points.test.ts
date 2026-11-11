import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import AiStartingPoints from './ai-starting-points.vue';

const i18n = createI18n({ legacy: false, missingWarn: false, fallbackWarn: false });

function mountPoints() {
	return mount(AiStartingPoints, {
		props: { points: [], prompt: 'Write a summary' },
		global: {
			plugins: [i18n],
			stubs: {
				VDialog: { props: ['modelValue'], template: '<div v-if="modelValue" class="dialog"><slot /></div>' },
				VButton: { emits: ['click'], template: '<button @click="$emit(\'click\')"><slot /></button>' },
				VNotice: true,
				VIcon: true,
			},
			directives: { md: {} },
		},
	});
}

test('only starts over once the dialog is confirmed', async () => {
	const wrapper = mountPoints();

	await wrapper.find('.start-over').trigger('click');
	expect(wrapper.emitted('startOver')).toBeUndefined();

	await wrapper.findAll('.dialog button')[0]!.trigger('click');
	expect(wrapper.find('.dialog').exists()).toBe(false);
	expect(wrapper.emitted('startOver')).toBeUndefined();

	await wrapper.find('.start-over').trigger('click');
	await wrapper.findAll('.dialog button')[1]!.trigger('click');
	expect(wrapper.emitted('startOver')).toHaveLength(1);
});
