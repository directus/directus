import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI, { defineComponent } from '@vue/composition-api';
import ClickOutside from '@/directives/click-outside/';
import VMenu from './v-menu.vue';
import VButton from '@/components/v-button/';
import VList, { VListItem } from '@/components/v-list/';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.directive('click-outside', ClickOutside);

describe('Components / Menu', () => {
	it('Renders', () => {
		const testComponent = defineComponent({
			components: { VMenu, VButton, VList, VListItem },
			template: `
				<v-menu>
					<template #activator="{ toggle }">
						<v-button @click="toggle">Click me</v-button>
					</template>

					<v-list>
						<v-list-item>Test</v-list-item>
					</v-list>
				</v-menu>
			`,
		});

		const component = shallowMount(testComponent, { localVue });

		expect(component.isVueInstance()).toBe(true);
	});
});
