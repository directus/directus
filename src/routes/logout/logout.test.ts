import { shallowMount, createLocalVue } from '@vue/test-utils';
import LogoutRoute from './logout.vue';
import { logout } from '@/auth';
import VCircularProgress from '@/components/v-progress/circular/';
import VueCompositionAPI from '@vue/composition-api';

jest.mock('@/auth');

const localVue = createLocalVue();
localVue.component('v-progress-circular', VCircularProgress);
localVue.use(VueCompositionAPI);

describe('Routes / Logout', () => {
	it('Calls logout on mount', async () => {
		const component = shallowMount(LogoutRoute, {
			localVue,
		});

		await (component.vm as any).$nextTick();

		expect(logout).toHaveBeenCalled();
	});
});
