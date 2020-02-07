import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import VueRouter, { Route } from 'vue-router';
import { onBeforeEach, useRouter } from './router';
import { useProjectsStore } from '@/stores/projects';

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

	describe('useRouter', () => {
		it('Returns the store instance', () => {
			const router = useRouter();

			expect(router instanceof VueRouter).toBe(true);
		});
	});
});
