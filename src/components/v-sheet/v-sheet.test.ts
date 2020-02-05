import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

import VSheet from './v-sheet.vue';

describe('Sheet', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => {
		component = mount(VSheet, {
			localVue
		});
	});

	it('Sets the right inline styles for the given props', async () => {
		component.setProps({
			height: 150,
			width: 200,
			minHeight: 250,
			minWidth: 300,
			maxHeight: 350,
			maxWidth: 400,
			color: '--red'
		});

		await component.vm.$nextTick();
		expect((component.vm as any).styles['--_v-sheet-height']).toEqual('150px');
		expect((component.vm as any).styles['--_v-sheet-width']).toEqual('200px');
		expect((component.vm as any).styles['--_v-sheet-min-height']).toEqual('250px');
		expect((component.vm as any).styles['--_v-sheet-min-width']).toEqual('300px');
		expect((component.vm as any).styles['--_v-sheet-max-height']).toEqual('350px');
		expect((component.vm as any).styles['--_v-sheet-max-width']).toEqual('400px');
		expect((component.vm as any).styles['--_v-sheet-color']).toEqual('var(--red)');
	});
});
