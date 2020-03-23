import api from '@/api';
import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';

import { useProjectsStore } from '@/stores/projects';
import { useUserStore } from './user';

jest.mock('@directus/format-title');
jest.mock('@/api');
jest.mock('@/lang');

describe('Stores / User', () => {
	let req: any = {};

	beforeAll(() => {
		Vue.config.productionTip = false;
		Vue.config.devtools = false;
		Vue.use(VueCompositionAPI);
	});

	beforeEach(() => {
		req = {};
	});

	describe('Hydrate', () => {
		it('Calls the right endpoint', async () => {
			(api.get as jest.Mock).mockImplementation(() =>
				Promise.resolve({
					data: {
						data: []
					}
				})
			);

			const projectsStore = useProjectsStore(req);
			projectsStore.state.currentProjectKey = 'my-project';
			const userStore = useUserStore(req);

			userStore.hydrate();

			expect(api.get).toHaveBeenCalledWith('/my-project/users/me', {
				params: {
					fields: '*,avatar.data'
				}
			});
		});
	});

	describe('Dehydrate', () => {
		it('Calls reset on dehydrate', async () => {
			const userStore: any = useUserStore(req);
			jest.spyOn(userStore, 'reset');
			await userStore.dehydrate();
			expect(userStore.reset).toHaveBeenCalled();
		});
	});
});
