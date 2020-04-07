import Vue from 'vue';
import VueCompositionAPI, { ref } from '@vue/composition-api';
import api from '@/api';
import { useItem } from './use-item';
import useProjectsStore from '@/stores/projects';

jest.mock('@/api');

describe('Compositions / useItem', () => {
	let req = {};

	beforeAll(() => {
		Vue.use(VueCompositionAPI);
	});

	beforeEach(() => {
		req = {};
	});

	it('Gets the item', () => {
		const projectsStore = useProjectsStore(req);
		projectsStore.state.currentProjectKey = 'my-project';

		const collection = ref('authors');
		const primaryKey = ref(15);

		useItem(collection, primaryKey);

		expect(api.get).toHaveBeenCalledWith('/my-project/items/authors/15');
	});
});
