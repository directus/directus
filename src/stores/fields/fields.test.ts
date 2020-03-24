import api from '@/api';
import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import formatTitle from '@directus/format-title';
import i18n from '@/lang';

import { useProjectsStore } from '@/stores/projects';
import { useFieldsStore } from './fields';

jest.mock('@directus/format-title');
jest.mock('@/api');
jest.mock('@/lang');

describe('Stores / Fields', () => {
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
		it('Calls the right endpoint', () => {
			(api.get as jest.Mock).mockImplementation(() =>
				Promise.resolve({
					data: {
						data: [],
					},
				})
			);

			const projectsStore = useProjectsStore(req);
			projectsStore.state.currentProjectKey = 'my-project';
			const fieldsStore = useFieldsStore(req);

			fieldsStore.hydrate().then(() => {
				expect(api.get).toHaveBeenCalledWith('/my-project/fields');
			});
		});

		it('Formats the title to use as name', async () => {
			(api.get as jest.Mock).mockImplementation(() =>
				Promise.resolve({
					data: {
						data: [
							{
								field: 'test_field',
							},
						],
					},
				})
			);

			const projectsStore = useProjectsStore(req);
			projectsStore.state.currentProjectKey = 'my-project';
			const fieldsStore = useFieldsStore(req);

			await fieldsStore.hydrate();

			expect(formatTitle).toHaveBeenCalledWith('test_field');
			expect(fieldsStore.state.fields[0].hasOwnProperty('name')).toBe(true);
		});

		it('Registers the passed translations to i18n to be registered', async () => {
			(api.get as jest.Mock).mockImplementation(() =>
				Promise.resolve({
					data: {
						data: [
							{
								field: 'test_field',
								translation: [
									{
										locale: 'en-US',
										translation: 'Test field',
									},
									{
										locale: 'nl-NL',
										translation: 'Test veld',
									},
								],
							},
						],
					},
				})
			);

			const projectsStore = useProjectsStore(req);
			projectsStore.state.currentProjectKey = 'my-project';
			const fieldsStore = useFieldsStore(req);

			await fieldsStore.hydrate();

			expect(i18n.mergeLocaleMessage).toHaveBeenCalledWith('en-US', {
				fields: {
					test_field: 'Test field',
				},
			});

			expect(i18n.mergeLocaleMessage).toHaveBeenCalledWith('nl-NL', {
				fields: {
					test_field: 'Test veld',
				},
			});
		});
	});

	describe('Dehydrate', () => {
		it('Calls reset on dehydrate', async () => {
			const fieldsStore: any = useFieldsStore(req);
			jest.spyOn(fieldsStore, 'reset');
			await fieldsStore.dehydrate();
			expect(fieldsStore.reset).toHaveBeenCalled();
		});
	});
});
