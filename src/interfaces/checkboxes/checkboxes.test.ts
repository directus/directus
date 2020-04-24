import InterfaceCheckboxes from './checkboxes.vue';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VCheckbox from '@/components/v-checkbox';
import VIcon from '@/components/v-icon';
import VNotice from '@/components/v-notice';
import i18n from '@/lang';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-checkbox', VCheckbox);
localVue.component('v-icon', VIcon);
localVue.component('v-notice', VNotice);

describe('Interfaces / Checkboxes', () => {
	it('Returns null for items if choices arent set', () => {
		const component = shallowMount(InterfaceCheckboxes, {
			localVue,
			i18n,
			listeners: {
				input: () => undefined,
			},
			propsData: {
				choices: null,
			},
		});

		expect((component.vm as any).items).toBe(null);
	});

	it('Calculates the grid size based on interface width and longest option', () => {
		const component = shallowMount(InterfaceCheckboxes, {
			localVue,
			i18n,
			listeners: {
				input: () => undefined,
			},
			propsData: {
				choices: null,
			},
		});

		expect((component.vm as any).gridClass).toBe(null);

		component.setProps({
			width: 'half',
			choices: `
			Short
			`,
		});

		expect((component.vm as any).gridClass).toBe('grid-2');

		component.setProps({
			width: 'half',
			choices: `
			Super long choice means single column
			`,
		});

		expect((component.vm as any).gridClass).toBe('grid-1');

		component.setProps({
			width: 'full',
			choices: `
			< 10 = 4
			`,
		});

		expect((component.vm as any).gridClass).toBe('grid-4');

		component.setProps({
			width: 'full',
			choices: `
			10 to 15 uses 3
			`,
		});

		expect((component.vm as any).gridClass).toBe('grid-3');

		component.setProps({
			width: 'full',
			choices: `
			15 to 25 chars uses 2
			`,
		});

		expect((component.vm as any).gridClass).toBe('grid-2');

		component.setProps({
			width: 'full',
			choices: `
			Super long choice means single column
			`,
		});

		expect((component.vm as any).gridClass).toBe('grid-1');
	});
});
