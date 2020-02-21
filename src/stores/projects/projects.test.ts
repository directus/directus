import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import api from '@/api';
import { useProjectsStore } from './projects';

describe('Stores / Projects', () => {
	beforeAll(() => {
		Vue.use(VueCompositionAPI);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('Getters / currentProject', () => {
		const dummyProject = {
			key: 'my-project',
			api: {
				requires2FA: false,
				project_color: '#abcabc',
				project_logo: null,
				project_background: null,
				project_foreground: null,
				project_name: 'Test',
				project_public_note: '',
				default_locale: 'en-US',
				telemetry: true
			}
		};

		it('Returns the correct project based on the currentProjectKey state', () => {
			const projectsStore = useProjectsStore({});
			projectsStore.state.projects = [dummyProject];
			projectsStore.state.currentProjectKey = 'my-project';
			expect(projectsStore.currentProject.value).toEqual(dummyProject);
		});

		it('Returns null if non-existing project is read', () => {
			const projectsStore = useProjectsStore({});
			projectsStore.state.projects = [dummyProject];
			projectsStore.state.currentProjectKey = 'non-existing-project';
			expect(projectsStore.currentProject.value).toEqual(null);
		});
	});

	describe('Actions / setCurrentProject', () => {
		it('Sets the currentProjectKey state to the passed key if project exists', async () => {
			const spy = jest.spyOn(api, 'get');

			const projectsStore = useProjectsStore({});
			(projectsStore.state.projects as any) = [{ key: 'my-project' }];
			await projectsStore.setCurrentProject('my-project');
			expect(projectsStore.state.currentProjectKey).toBe('my-project');
			expect(spy).not.toHaveBeenCalled();
		});

		it('Retrieves project information for given project key', async () => {
			const projectsStore = useProjectsStore({});
			const spy = jest
				.spyOn(api, 'get')
				.mockImplementation(() => Promise.resolve({ data: { data: {} } }));
			await projectsStore.setCurrentProject('my-project');
			expect(spy).toHaveBeenCalledWith('/my-project/');
			expect(projectsStore.state.currentProjectKey).toBe('my-project');
		});

		it('Adds the returned project info the the state ', async () => {
			const projectsStore = useProjectsStore({});
			const spy = jest
				.spyOn(api, 'get')
				.mockImplementation(() => Promise.resolve({ data: { data: {} } }));
			await projectsStore.setCurrentProject('my-project');
			expect(spy).toHaveBeenCalledWith('/my-project/');
			expect(projectsStore.state.projects[0]).toEqual({ key: 'my-project' });
		});

		it('Returns true if the project exists', async () => {
			const projectsStore = useProjectsStore({});
			const spy = jest
				.spyOn(api, 'get')
				.mockImplementation(() => Promise.resolve({ data: { data: {} } }));
			const result = await projectsStore.setCurrentProject('my-project');
			expect(result).toBe(true);
		});

		it('Returns false if the project does not exist', async () => {
			const projectsStore = useProjectsStore({});
			jest.spyOn(api, 'get').mockImplementation(() => Promise.reject());
			const result = await projectsStore.setCurrentProject('my-project');
			expect(result).toBe(false);
		});
	});

	describe('Actions / getProjects', () => {
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

			const projectsStore = useProjectsStore({});
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

			const projectsStore = useProjectsStore({});
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

			const projectsStore = useProjectsStore({});
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

			const projectsStore = useProjectsStore({});
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

			const projectsStore = useProjectsStore({});
			await projectsStore.getProjects();

			expect(projectsStore.state.projects).toEqual([
				{ key: 'my-project' },
				{ key: 'another-project', error: 'Error fallback', status: 500 }
			]);
		});
	});
});
