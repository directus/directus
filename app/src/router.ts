import { createRouter, createWebHistory, RouteRecordRaw, NavigationGuard, NavigationHookAfter } from 'vue-router';
import LoginRoute from '@/routes/login';
import LogoutRoute from '@/routes/logout';
import ResetPasswordRoute from '@/routes/reset-password';
import AcceptInviteRoute from '@/routes/accept-invite';
import PrivateNotFoundRoute from '@/routes/private-not-found';
import { refresh } from '@/auth';
import { hydrate } from '@/hydrate';
import { useAppStore, useUserStore, useServerStore } from '@/stores';

import { getRootPath } from '@/utils/get-root-path';

export const defaultRoutes: RouteRecordRaw[] = [
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
	{
		name: 'private-404',
		path: '/:path(.*)*',
		component: PrivateNotFoundRoute,
	},
];

export const router = createRouter({
	history: createWebHistory(getRootPath() + 'admin/'),
	routes: defaultRoutes,
});

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

	if (serverStore.info === null) {
		await serverStore.hydrate();
	}

	if (to.meta?.public !== true && appStore.hydrated === false) {
		appStore.hydrating = false;
		if (appStore.authenticated === true && appStore.hydrating === false) {
			await hydrate();
			return next(to.fullPath);
		} else {
			return next('/login');
		}
	}

	return next();
};

let trackTimeout: number | null = null;

export const onAfterEach: NavigationHookAfter = (to) => {
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
