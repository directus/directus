import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import VueRouter, { Route } from 'vue-router';
import { onBeforeEach, useRouter, checkAuth } from './router';
import { useProjectsStore } from '@/stores/projects';
import api from '@/api';

const route: Route = {
	name: undefined,
	path: '',
	query: {},
	hash: '',
	params: {},
	fullPath: '',
	matched: []
};

describe('Router', () => {
	beforeAll(() => {
		Vue.config.productionTip = false;
		Vue.config.devtools = false;
		Vue.use(VueCompositionAPI);
		jest.spyOn(api, 'get');
		jest.spyOn(api, 'post');
	});

	beforeEach(() => {
		(api.get as jest.Mock).mockClear();
		(api.post as jest.Mock).mockClear();
	});

	it('Fetches the projects using projectsStore on first load', async () => {
		const projectsStore = useProjectsStore({});
		projectsStore.getProjects = jest.fn();

		const toRoute = route;
		const fromRoute = {
			...route,
			name: null
		};
		const callback = jest.fn();

		await onBeforeEach(toRoute, fromRoute as any, callback);

		expect(projectsStore.getProjects).toHaveBeenCalled();
	});

	it('Redirects to /install if projectStore.needsInstall is true', async () => {
		const projectsStore = useProjectsStore({});
		projectsStore.getProjects = jest.fn();

		const toRoute = route;
		const fromRoute = {
			...route,
			name: null
		};

		const callback = jest.fn();

		projectsStore.state.needsInstall = true;

		await onBeforeEach(toRoute, fromRoute as any, callback);

		expect(callback).toHaveBeenCalledWith('/install');

		(projectsStore.getProjects as jest.Mock).mockClear();
	});

	it('Sets the project store currentProjectKey on route changes if project param exists', async () => {
		const projectsStore = useProjectsStore({});

		const toRoute = {
			...route,
			params: {
				project: 'my-project'
			}
		};

		const fromRoute = {
			...route,
			name: 'login'
		};

		const callback = jest.fn();

		await onBeforeEach(toRoute, fromRoute as any, callback);

		expect(projectsStore.state.currentProjectKey).toBe('my-project');
	});

	it('Sets the currentProjectKey to the first project that exists if the param is not set', async () => {
		const projectsStore = useProjectsStore({});
		projectsStore.state.projects = [
			{
				key: 'another-project',
				status: 500,
				error: {
					code: 400,
					message: 'its broken'
				}
			}
		];

		const toRoute = {
			...route
		};

		const fromRoute = {
			...route,
			name: 'login'
		};

		const callback = jest.fn();

		await onBeforeEach(toRoute, fromRoute as any, callback);

		expect(projectsStore.state.currentProjectKey).toBe('another-project');
	});

	it('Continues to the route before checking the auth for public routes', async () => {
		const projectsStore = useProjectsStore({});
		projectsStore.state.projects = [
			{
				key: 'another-project',
				status: 500,
				error: {
					code: 400,
					message: 'its broken'
				}
			}
		];

		const toRoute = {
			...route,
			path: '/test',
			meta: {
				public: true
			},
			params: {
				project: 'my-project'
			}
		};

		const fromRoute = {
			...route
		};

		const callback = jest.fn();

		await onBeforeEach(toRoute, fromRoute as any, callback);

		expect(callback).toHaveBeenCalled();
		expect(api.get).not.toHaveBeenCalled();
	});

	it('Redirects to the login page if the user is not logged in', async () => {
		const projectsStore = useProjectsStore({});
		projectsStore.state.projects = [
			{
				key: 'another-project',
				status: 500,
				error: {
					code: 400,
					message: 'its broken'
				}
			}
		];

		(api.get as jest.Mock).mockImplementation(() => Promise.reject());

		const toRoute = {
			...route,
			params: {
				project: 'my-project'
			}
		};

		const fromRoute = {
			...route
		};

		const callback = jest.fn();

		await onBeforeEach(toRoute, fromRoute as any, callback);

		expect(callback).toHaveBeenCalledWith('/my-project/login');
	});

	it('Calls the callback when everything is correct', async () => {
		(api.get as jest.Mock).mockImplementation(() => Promise.resolve());
		const projectsStore = useProjectsStore({});
		projectsStore.state.projects = [
			{
				key: 'another-project',
				status: 500,
				error: {
					code: 400,
					message: 'its broken'
				}
			}
		];

		const toRoute = {
			...route,
			params: {
				project: 'my-project'
			}
		};

		const fromRoute = {
			...route
		};

		const callback = jest.fn();

		await onBeforeEach(toRoute, fromRoute as any, callback);
		expect(callback).toHaveBeenCalled();
	});

	describe('useRouter', () => {
		it('Returns the store instance', () => {
			const router = useRouter();

			expect(router instanceof VueRouter).toBe(true);
		});
	});

	describe('checkAuth', () => {
		it('Calls the api with the correct endpoint', async () => {
			(api.get as jest.Mock).mockImplementation(() => Promise.resolve());
			await checkAuth('test-project');
			expect(api.get).toHaveBeenCalledWith('/test-project/users/me');
		});

		it('Returns true if user is logged in', async () => {
			(api.get as jest.Mock).mockImplementation(() => Promise.resolve());
			const loggedIn = await checkAuth('test-project');
			expect(loggedIn).toBe(true);
		});

		it('Returns false if user is logged in', async () => {
			(api.get as jest.Mock).mockImplementation(() => Promise.reject());
			const loggedIn = await checkAuth('test-project');
			expect(loggedIn).toBe(false);
		});
	});
});
