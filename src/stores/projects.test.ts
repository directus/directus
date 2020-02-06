import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import api from '@/api';
import { useProjectsStore } from './projects';
import { setActiveReq } from 'pinia';

describe('Stores / Projects', () => {
	beforeAll(() => {
		Vue.use(VueCompositionAPI);
	});

	beforeEach(() => {
		setActiveReq({});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getProjects', () => {
		it('Fetches the project info for each individual project', async () => {
			const spy = jest.spyOn(api, 'get');

			spy.mockImplementation((path: string) => {
				switch (path) {
					case '/server/projects':
						return Promise.resolve({
							data: { data: ['my-project', 'another-project'] }
						});
					case '/my-project/':
					case '/another-project/':
						return Promise.resolve({
							data: {
								data: {}
							}
						});
				}
				return Promise.resolve();
			});

			const projectsStore = useProjectsStore();
			await projectsStore.getProjects();

			expect(spy).toHaveBeenCalledWith('/server/projects');
			expect(spy).toHaveBeenCalledWith('/my-project/');
			expect(spy).toHaveBeenCalledWith('/another-project/');

			expect(projectsStore.state.error).toBe(null);
			expect(projectsStore.state.projects).toEqual([
				{ key: 'my-project' },
				{ key: 'another-project' }
			]);
		});

		it('Sets the error state if the API errors out while fetching project keys', async () => {
			const spy = jest.spyOn(api, 'get');

			spy.mockImplementation((path: string) => {
				switch (path) {
					case '/server/projects':
						return Promise.reject({ response: { status: 500 }, message: 'Error' });
				}
				return Promise.resolve();
			});

			const projectsStore = useProjectsStore();
			await projectsStore.getProjects();

			expect(projectsStore.state.error).toEqual({ status: 500, error: 'Error' });
		});

		it('Sets the needsInstall boolean to true if the API returns a 503 error on projects retrieving', async () => {
			const spy = jest.spyOn(api, 'get');

			spy.mockImplementation((path: string) => {
				switch (path) {
					case '/server/projects':
						return Promise.reject({ response: { status: 503 } });
				}
				return Promise.resolve();
			});

			const projectsStore = useProjectsStore();
			await projectsStore.getProjects();

			expect(projectsStore.state.error).toBe(null);
			expect(projectsStore.state.needsInstall).toBe(true);
		});

		it('Adds an error key to the individual project if one of them fails', async () => {
			const spy = jest.spyOn(api, 'get');

			spy.mockImplementation((path: string) => {
				switch (path) {
					case '/server/projects':
						return Promise.resolve({
							data: { data: ['my-project', 'another-project'] }
						});
					case '/my-project/':
						return Promise.resolve({ data: {} });
					case '/another-project/':
						return Promise.reject({
							response: {
								status: 500,
								data: {
									error: {
										code: 10,
										message: 'error message'
									}
								}
							}
						});
				}
				return Promise.resolve();
			});

			const projectsStore = useProjectsStore();
			await projectsStore.getProjects();

			expect(projectsStore.state.projects).toEqual([
				{ key: 'my-project' },
				{ key: 'another-project', error: 'error message', status: 500 }
			]);
		});

		it('Uses the error message of the request if API did not return any data', async () => {
			const spy = jest.spyOn(api, 'get');

			spy.mockImplementation((path: string) => {
				switch (path) {
					case '/server/projects':
						return Promise.resolve({
							data: { data: ['my-project', 'another-project'] }
						});
					case '/my-project/':
						return Promise.resolve({ data: {} });
					case '/another-project/':
						return Promise.reject({
							message: 'Error fallback',
							response: {
								status: 500,
								data: {}
							}
						});
				}
				return Promise.resolve();
			});

			const projectsStore = useProjectsStore();
			await projectsStore.getProjects();

			expect(projectsStore.state.projects).toEqual([
				{ key: 'my-project' },
				{ key: 'another-project', error: 'Error fallback', status: 500 }
			]);
		});
	});
});
