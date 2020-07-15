import VueRouter, { NavigationGuard, RouteConfig, Route } from 'vue-router';
import LoginRoute from '@/routes/login';
import InstallRoute from '@/routes/install';
import ResetPasswordRoute from '@/routes/reset-password';
import { refresh } from '@/auth';
import { hydrate } from '@/hydrate';
import useAppStore from '@/stores/app';
import useUserStore from '@/stores/user';
import PrivateNotFoundRoute from '@/routes/private-not-found';
import useSettingsStore from '@/stores/settings';
import { logout } from '@/auth';

import getRootPath from '@/utils/get-root-path';

export const defaultRoutes: RouteConfig[] = [
	{
		path: '/',
		redirect: '/login',
	},
	{
		name: 'install',
		path: '/install',
		component: InstallRoute,
		/**
		 * @todo redirect to /login if project is already installed
		 */
		meta: {
			public: true,
		},
	},
	{
		name: 'login',
		path: '/login',
		component: LoginRoute,
		props: (route) => ({
			ssoErrorCode: route.query.error ? route.query.code : null,
		}),
		meta: {
			public: true,
		},
	},
	{
		name: 'reset-password',
		path: '/reset-password',
		component: ResetPasswordRoute,
		meta: {
			public: true,
		},
	},
	{
		name: 'logout',
		path: '/logout',
		async beforeEnter(to, from, next) {
			await logout({ navigate: false });
			next('/login');
		},
		meta: {
			public: true,
		},
	},
	/**
	 * @NOTE
	 * Dynamic modules need to be inserted here. By default, VueRouter.addRoutes adds the route
	 * to the end of this list, meaning that the Private404 will match before the custom module..
	 * Vue Router dynamic route registration is under discussion:
	 * https://github.com/vuejs/vue-router/issues/1156, and has an RFC:
	 * https://github.com/vuejs/rfcs/pull/122
	 *
	 * In order to achieve what we need, we can use the custom replaceRoutes function exported
	 * below to replace all the routes. This allows us to override this list of routes with the
	 * list augmented with the module routes in the correct location.
	 */
	{
		name: 'private-404',
		path: '/*',
		component: PrivateNotFoundRoute,
	},
];

const router = new VueRouter({
	mode: 'history',
	base: getRootPath() + 'admin/',
	routes: defaultRoutes,
});

export function replaceRoutes(routeFilter: (routes: RouteConfig[]) => RouteConfig[]): void {
	const newRoutes = routeFilter([...defaultRoutes]);
	const newRouter = new VueRouter({
		mode: 'history',
		base: getRootPath() + 'admin/',
		routes: newRoutes,
	});

	// @ts-ignore - Matcher is not officially part of the public API (https://github.com/vuejs/vue-router/issues/2844#issuecomment-509529927)
	router.matcher = newRouter.matcher;
}

export const onBeforeEach: NavigationGuard = async (to, from, next) => {
	const appStore = useAppStore();
	const settingsStore = useSettingsStore();

	// First load
	if (from.name === null) {
		// Try retrieving a fresh access token on first load
		try {
			await refresh({ navigate: false });
		} catch {}
	}

	if (settingsStore.state.settings === null) {
		await settingsStore.hydrate();
	}

	if (to.meta?.public !== true && appStore.state.hydrated === false) {
		appStore.state.hydrating = false;
		if (appStore.state.authenticated) await hydrate();
		else return next('/login');
	}

	return next();
};

export const onAfterEach = (to: Route) => {
	const userStore = useUserStore();

	if (to.meta.public !== true) {
		// The timeout gives the page some breathing room to load. No need to clog up the thread with
		// this call while more important things are loading
		setTimeout(() => {
			userStore.trackPage(to.fullPath);
		}, 2500);
	}
};

router.beforeEach(onBeforeEach);
router.afterEach(onAfterEach);

export default router;
