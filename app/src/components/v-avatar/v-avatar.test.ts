import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

import VAvatar from './v-avatar.vue';

describe('Avatar', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => (component = mount(VAvatar, { localVue })));

	it('Sets the tile class if tile prop is passed', async () => {
		component.setProps({ tile: true });
		await component.vm.$nextTick();
		expect(component.classes()).toContain('tile');
	});
});
