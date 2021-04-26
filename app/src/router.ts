import VueRouter, { NavigationGuard, RouteConfig, Route } from 'vue-router';
import LoginRoute from '@/routes/login';
import LogoutRoute from '@/routes/logout';
import ResetPasswordRoute from '@/routes/reset-password';
import AcceptInviteRoute from '@/routes/accept-invite';
import { refresh } from '@/auth';
import { hydrate } from '@/hydrate';
import { useAppStore, useUserStore, useServerStore } from '@/stores/';
import PrivateNotFoundRoute from '@/routes/private-not-found';

import { getRootPath } from '@/utils/get-root-path';

export const defaultRoutes: RouteConfig[] = [
	{
		path: '/',
		redirect: '/login',
	},
	{
		name: 'login',
		path: '/login',
		component: LoginRoute,
		props: (route) => ({
			ssoErrorCode: route.query.error ? route.query.code : null,
			logoutReason: route.query.reason,
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
		name: 'accept-invite',
		path: '/accept-invite',
		component: AcceptInviteRoute,
		meta: {
			public: true,
		},
	},
	{
		name: 'logout',
		path: '/logout',
		component: LogoutRoute,
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
	const serverStore = useServerStore();

	// First load
	if (from.name === null) {
		// Try retrieving a fresh access token on first load
		try {
			await refresh({ navigate: false });
		} catch {
			// Ignore error
		}
	}

	if (serverStore.state.info === null) {
		await serverStore.hydrate();
	}

	if (to.meta?.public !== true && appStore.state.hydrated === false) {
		appStore.state.hydrating = false;
		if (appStore.state.authenticated === true && appStore.state.hydrating === false) {
			await hydrate();
			return next(to.fullPath);
		} else {
			return next('/login');
		}
	}

	return next();
};

let trackTimeout: number | null = null;

export const onAfterEach = (to: Route): void => {
	const userStore = useUserStore();

	if (to.meta.public !== true) {
		// The timeout gives the page some breathing room to load. No need to clog up the thread with
		// this call while more important things are loading

		if (trackTimeout) {
			clearTimeout(trackTimeout);
			trackTimeout = null;
		}

		setTimeout(() => {
			userStore.trackPage(to.fullPath);
		}, 500);
	}
};

router.beforeEach(onBeforeEach);
router.afterEach(onAfterEach);

export default router;
