import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import * as hydration from '@/hydrate';
import api from '@/api';
import { checkAuth, login, logout, LogoutReason } from './auth';
import { useProjectsStore } from '@/stores/projects/';
import { useRequestsStore } from '@/stores/requests/';
import router from '@/router';
import { eachMonthOfInterval } from 'date-fns';

jest.mock('@/api');
jest.mock('@/router');
jest.mock('@/hydrate');

describe('Auth', () => {
	beforeAll(() => {
		Vue.config.productionTip = false;
		Vue.config.devtools = false;
		Vue.use(VueCompositionAPI);
	});

	beforeEach(() => {
		jest.spyOn(api, 'get');
		jest.spyOn(api, 'post');
		jest.spyOn(hydration, 'hydrate');
		jest.spyOn(hydration, 'dehydrate');
	});

	describe('checkAuth', () => {
		it('Does not ping the API if the curent project key is null', async () => {
			useProjectsStore({}).state.currentProjectKey = null;
			(api.get as jest.Mock).mockImplementation(() =>
				Promise.resolve({ data: { data: { authenticated: true } } })
			);
			await checkAuth();
			expect(api.get).not.toHaveBeenCalled();
		});

		it('Calls the api with the correct endpoint', async () => {
			useProjectsStore({}).state.currentProjectKey = 'test-project';
			(api.get as jest.Mock).mockImplementation(() =>
				Promise.resolve({ data: { data: { authenticated: true } } })
			);
			await checkAuth();
			expect(api.get).toHaveBeenCalledWith('/test-project/auth/check');
		});

		it('Returns true if user is logged in', async () => {
			useProjectsStore({}).state.currentProjectKey = 'test-project';
			(api.get as jest.Mock).mockImplementation(() =>
				Promise.resolve({ data: { data: { authenticated: true } } })
			);
			const loggedIn = await checkAuth();
			expect(loggedIn).toBe(true);
		});

		it('Returns false if user is logged out', async () => {
			useProjectsStore({}).state.currentProjectKey = 'test-project';
			(api.get as jest.Mock).mockImplementation(() =>
				Promise.resolve({ data: { data: { authenticated: false } } })
			);
			const loggedIn = await checkAuth();
			expect(loggedIn).toBe(false);
		});
	});

	describe('login', () => {
		it('Calls /auth/authenticate with the provided credentials', async () => {
			useProjectsStore({}).state.currentProjectKey = 'test-project';
			await login({ email: 'test', password: 'test' });
			expect(api.post).toHaveBeenCalledWith('/test-project/auth/authenticate', {
				mode: 'cookie',
				email: 'test',
				password: 'test'
			});
		});

		it('Calls hydrate on successful login', async () => {
			useProjectsStore({}).state.currentProjectKey = 'test-project';
			await login({ email: 'test', password: 'test' });
			expect(hydration.hydrate).toHaveBeenCalled();
		});
	});

	describe('logout', () => {
		it('Does not do anything when there is no current project', async () => {
			const projectsStore = useProjectsStore({});
			await logout();
			expect(hydration.dehydrate).not.toHaveBeenCalled();
		});

		it('Calls dehydrate', async () => {
			useProjectsStore({}).state.currentProjectKey = 'test-project';
			await logout();
			expect(hydration.dehydrate).toHaveBeenCalled();
		});

		it('Posts to /logout on regular sign out', async () => {
			useProjectsStore({}).state.currentProjectKey = 'test-project';
			await logout();
			expect(api.post).toHaveBeenCalledWith('/test-project/auth/logout');
		});

		it('Navigates to the current projects login page', async () => {
			const projectsStore = useProjectsStore({});
			projectsStore.state.currentProjectKey = 'my-project';
			await logout();
			expect(router.push).toHaveBeenCalledWith({
				path: '/my-project/login',
				query: {
					reason: LogoutReason.SIGN_OUT
				}
			});
		});

		it('Does not navigate when the navigate option is false', async () => {
			const projectsStore = useProjectsStore({});
			projectsStore.state.currentProjectKey = 'my-project';
			await logout({ navigate: false });
			expect(router.push).not.toHaveBeenCalled();
		});

		it('Adds the reason query param if any non-default reason is given', async () => {
			const projectsStore = useProjectsStore({});
			projectsStore.state.currentProjectKey = 'my-project';
			await logout({ reason: LogoutReason.ERROR_SESSION_EXPIRED });
			expect(router.push).toHaveBeenCalledWith({
				path: '/my-project/login',
				query: {
					reason: LogoutReason.ERROR_SESSION_EXPIRED
				}
			});
		});
	});
});
