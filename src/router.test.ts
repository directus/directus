import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import { Route } from 'vue-router';
import {
	onBeforeEach,
	onBeforeEnterProjectChooser,
	replaceRoutes,
	defaultRoutes,
	onBeforeEnterLogout
} from './router';
import api from '@/api';
import * as auth from '@/auth';
import { useProjectsStore } from '@/stores/projects';
import { hydrate } from '@/hydrate';

jest.mock('@/auth');
jest.mock('@/hydrate');
jest.mock('@/api');

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
	});

	beforeEach(() => {
		jest.spyOn(api, 'get');
		jest.spyOn(api, 'post');
	});

	it('Fetches the projects using projectsStore on first load', async () => {
		const toRoute = route;

		const fromRoute = {
			...route,
			name: null
		};

		const callback = jest.fn();

		const projectsStore = useProjectsStore({});
		jest.spyOn(projectsStore, 'getProjects');

		await onBeforeEach(toRoute, fromRoute as any, callback);

		expect(projectsStore.getProjects).toHaveBeenCalled();
	});

	it('Redirects to /install if projectsStore indicates that an install is needed', async () => {
		const projectsStore = useProjectsStore({});
		projectsStore.state.needsInstall = true;

		const toRoute = route;
		const fromRoute = route;
		const callback = jest.fn();

		await onBeforeEach(toRoute, fromRoute, callback);

		expect(callback).toHaveBeenCalledWith('/install');
	});

	it('Does not redirect to /install if we try to open /install', async () => {
		const projectsStore = useProjectsStore({});
		projectsStore.state.needsInstall = true;

		const toRoute = {
			...route,
			path: '/install'
		};
		const fromRoute = route;
		const callback = jest.fn();

		await onBeforeEach(toRoute, fromRoute, callback);

		expect(callback).not.toHaveBeenCalledWith('/install');
	});

	it('Keeps projects store in sync with project in route', async () => {
		const projectsStore = useProjectsStore({});

		jest.spyOn(projectsStore, 'setCurrentProject');

		const toRoute = {
			...route,
			params: {
				project: 'my-project'
			}
		};
		const fromRoute = route;
		const callback = jest.fn();

		await onBeforeEach(toRoute, fromRoute, callback);

		expect(projectsStore.setCurrentProject).toHaveBeenCalledWith('my-project');
	});

	it('Redirects to / when trying to open non-existing project', async () => {
		useProjectsStore({});

		const toRoute = {
			...route,
			path: '/test',
			params: {
				project: 'my-project'
			}
		};
		const fromRoute = route;
		const callback = jest.fn();

		await onBeforeEach(toRoute, fromRoute, callback);

		expect(callback).toHaveBeenCalledWith('/');
	});

	it('Does not redirect to / when trying to open /', async () => {
		useProjectsStore({});

		const toRoute = {
			...route,
			path: '/',
			params: {
				project: 'my-project'
			}
		};
		const fromRoute = route;
		const callback = jest.fn();

		await onBeforeEach(toRoute, fromRoute, callback);

		expect(callback).not.toHaveBeenCalledWith('/');
	});

	it('Calls next when trying to open public route', async () => {
		const projectsStore = useProjectsStore({});
		jest.spyOn(projectsStore, 'getProjects').mockResolvedValue();

		const checkAuth = jest.spyOn(auth, 'checkAuth');
		const toRoute = {
			...route,
			meta: {
				public: true
			}
		};
		const fromRoute = {
			...route,
			name: null
		};
		const next = jest.fn();

		await onBeforeEach(toRoute, fromRoute as any, next);

		expect(next).toHaveBeenCalledWith();
		expect(checkAuth).not.toHaveBeenCalled();
	});

	it('Checks if you are authenticated on first load', async () => {
		jest.spyOn(auth, 'checkAuth').mockImplementation(() => Promise.resolve(false));

		const projectsStore = useProjectsStore({});
		jest.spyOn(projectsStore, 'getProjects').mockResolvedValue();

		projectsStore.state.projects = [
			{
				key: 'my-project'
			}
		] as any;

		const to = {
			...route,
			params: {
				project: 'my-project'
			}
		};

		const from = { ...route, name: null };
		const next = jest.fn();

		await onBeforeEach(to, from as any, next);

		expect(auth.checkAuth).toHaveBeenCalled();
	});

	it('Hydrates the store on first load when logged in', async () => {
		jest.spyOn(auth, 'checkAuth').mockImplementation(() => Promise.resolve(true));

		const projectsStore = useProjectsStore({});
		projectsStore.state.projects = [
			{
				key: 'my-project'
			}
		] as any;
		jest.spyOn(projectsStore, 'getProjects').mockResolvedValue();

		const to = {
			...route,
			params: {
				project: 'my-project'
			}
		};

		const from = { ...route, name: null };
		const next = jest.fn();

		await onBeforeEach(to, from as any, next);

		expect(hydrate).toHaveBeenCalled();
	});

	it('Calls next when all checks are done', async () => {
		jest.spyOn(auth, 'checkAuth').mockImplementation(() => Promise.resolve(true));

		const projectsStore = useProjectsStore({});
		projectsStore.state.projects = [
			{
				key: 'my-project'
			}
		] as any;
		jest.spyOn(projectsStore, 'getProjects').mockResolvedValue();

		const to = {
			...route,
			params: {
				project: 'my-project'
			}
		};

		const from = { ...route, name: null };
		const next = jest.fn();

		await onBeforeEach(to, from as any, next);

		expect(auth.checkAuth).toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith();
	});

	describe('onBeforeEnterProjectChooser', () => {
		it('Sets the current project to null on open', () => {
			const projectsStore = useProjectsStore({});
			projectsStore.state.currentProjectKey = 'my-project';
			jest.spyOn(projectsStore, 'getProjects').mockResolvedValue();

			const to = { ...route, path: '/' };
			const from = route;
			const next = jest.fn();
			onBeforeEnterProjectChooser(to, from, next);
			expect(projectsStore.state.currentProjectKey).toBe(null);
		});
	});

	describe('onBeforeEnterLogout', () => {
		it('Calls logout and redirects to login page', async () => {
			const to = { ...route, path: '/my-project/logout', params: { project: 'my-project' } };
			const from = route;
			const next = jest.fn();
			await onBeforeEnterLogout(to, from, next);
			expect(auth.logout).toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith('/my-project/login');
		});
	});

	describe('replaceRoutes', () => {
		it('Calls the handler with the default routes', async () => {
			const handler = jest.fn(() => []);
			replaceRoutes(handler);
			expect(handler).toHaveBeenCalledWith(defaultRoutes);
		});
	});
});
