import useProjectsStore from '@/stores/projects';
import { useSettingsStore } from './settings';
import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';

import api from '@/api';

jest.mock('@/api');

describe('Stores / Settings', () => {
	let req = {};

	beforeAll(() => {
		Vue.use(VueCompositionAPI);
	});

	beforeEach(() => {
		req = {};
	});

	it('Fetches the settings on hydrate', async () => {
		const projectsStore = useProjectsStore(req);
		projectsStore.state.currentProjectKey = 'my-project';

		const settingsStore = useSettingsStore(req);

		(api.get as jest.Mock).mockImplementation(() => Promise.resolve({ data: { data: [] } }));

		await settingsStore.hydrate();

		expect(api.get).toHaveBeenCalledWith('/my-project/settings', { params: { limit: -1 } });
	});

	it('Calls reset on dehydrate', async () => {
		const settingsStore = useSettingsStore(req);
		jest.spyOn(settingsStore, 'reset');

		await settingsStore.dehydrate();

		expect(settingsStore.reset).toHaveBeenCalled();
	});
});
