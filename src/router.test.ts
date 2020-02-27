import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import { Route } from 'vue-router';
import router, {
	onBeforeEach,
	onBeforeEnterProjectChooser,
	replaceRoutes,
	defaultRoutes
} from './router';
import { useProjectsStore } from '@/stores/projects';
import api from '@/api';
import * as auth from '@/auth';

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
		projectsStore.setCurrentProject = jest.fn();

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
		const projectsStore = useProjectsStore({});
		projectsStore.setCurrentProject = jest.fn(() => Promise.resolve(false));

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
		const projectsStore = useProjectsStore({});
		projectsStore.setCurrentProject = jest.fn(() => Promise.resolve(false));

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
		projectsStore.getProjects = jest.fn();

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
		const projectsStore = useProjectsStore({});
		projectsStore.getProjects = jest.fn();
		jest.spyOn(auth, 'checkAuth').mockImplementation(() => Promise.resolve(false));
		(projectsStore.state.projects as any) = [
			{
				key: 'my-project'
			}
		];

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
		expect(next).toHaveBeenCalledWith('/my-project/login');
	});

	it('Calls next when all checks are done', async () => {
		const projectsStore = useProjectsStore({});
		projectsStore.getProjects = jest.fn();
		jest.spyOn(auth, 'checkAuth').mockImplementation(() => Promise.resolve(true));
		(projectsStore.state.projects as any) = [
			{
				key: 'my-project'
			}
		];

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
			const to = { ...route, path: '/' };
			const from = route;
			const next = jest.fn();
			onBeforeEnterProjectChooser(to, from, next);
			expect(projectsStore.state.currentProjectKey).toBe(null);
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
