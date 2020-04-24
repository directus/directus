import InterfaceRadioButtons from './radio-buttons.vue';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VRadio from '@/components/v-radio';
import VIcon from '@/components/v-icon';
import VNotice from '@/components/v-notice';
import i18n from '@/lang';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-radio', VRadio);
localVue.component('v-icon', VIcon);
localVue.component('v-notice', VNotice);

describe('Interfaces / Radio Buttons', () => {
	it('Returns null for items if choices arent set', () => {
		const component = shallowMount(InterfaceRadioButtons, {
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
		const component = shallowMount(InterfaceRadioButtons, {
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

	it('Calculates what item to use based on the custom value set', async () => {
		const component = shallowMount(InterfaceRadioButtons, {
			i18n,
			localVue,
			propsData: {
				value: null,
				allowOther: true,
				choices: `
					option1
					option2
				`,
				iconOn: 'person',
				iconOff: 'settings',
			},
		});

		expect((component.vm as any).customIcon).toBe('add');

		(component.vm as any).otherValue = 'test';
		await component.vm.$nextTick();
		expect((component.vm as any).customIcon).toBe('settings');

		(component.vm as any).otherValue = 'test';
		component.setProps({ value: 'test' });
		await component.vm.$nextTick();
		expect((component.vm as any).customIcon).toBe('person');
	});
});
