import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import api from '@/api';
import { checkAuth, logout, LogoutReason } from './auth';
import { useProjectsStore } from '@/stores/projects/';
import { useRequestsStore } from '@/stores/requests/';
import router from '@/router';
jest.mock('@/router');

describe('Auth', () => {
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

	describe('logout', () => {
		it('Does not do anything when there is no current project', () => {
			const requestsStore = useRequestsStore({});
			const projectsStore = useProjectsStore({});
			jest.spyOn(requestsStore, 'reset');
			logout();
			expect(requestsStore.reset).not.toHaveBeenCalled();
		});

		it('Navigates to the current projects login page', async () => {
			const requestsStore = useRequestsStore({});
			const projectsStore = useProjectsStore({});
			projectsStore.state.currentProjectKey = 'my-project';
			logout();
			expect(router.push).toHaveBeenCalledWith({
				path: '/my-project/login'
			});
		});

		it('Adds the reason query param if any non-default reason is given', async () => {
			const requestsStore = useRequestsStore({});
			const projectsStore = useProjectsStore({});
			projectsStore.state.currentProjectKey = 'my-project';
			logout(LogoutReason.ERROR_SESSION_EXPIRED);
			expect(router.push).toHaveBeenCalledWith({
				path: '/my-project/login',
				query: {
					reason: LogoutReason.ERROR_SESSION_EXPIRED
				}
			});
		});
	});
});
