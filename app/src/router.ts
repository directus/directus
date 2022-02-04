import { refresh } from '@/auth';
import { hydrate } from '@/hydrate';
import AcceptInviteRoute from '@/routes/accept-invite';
import LoginRoute from '@/routes/login';
import LogoutRoute from '@/routes/logout';
import ShareRoute from '@/routes/shared';
import PrivateNotFoundRoute from '@/routes/private-not-found';
import ResetPasswordRoute from '@/routes/reset-password';
import { useAppStore, useServerStore, useUserStore } from '@/stores';
import { getRootPath } from '@/utils/get-root-path';
import { createRouter, createWebHistory, NavigationGuard, NavigationHookAfter, RouteRecordRaw } from 'vue-router';

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
		name: 'shared',
		path: '/shared/:id([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})',
		component: ShareRoute,
		meta: {
			public: true,
		},
	},
	{
		name: 'private-404',
		path: '/:_(.+)+',
		component: PrivateNotFoundRoute,
	},
];

export const router = createRouter({
	history: createWebHistory(getRootPath() + 'admin/'),
	routes: defaultRoutes,
});

let firstLoad = true;

export const onBeforeEach: NavigationGuard = async (to) => {
	const appStore = useAppStore();
	const serverStore = useServerStore();

	// First load
	if (firstLoad) {
		firstLoad = false;
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
			return to.fullPath;
		} else {
			if (to.fullPath) {
				return '/login?redirect=' + encodeURIComponent(to.fullPath);
			} else {
				return '/login';
			}
		}
	}
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
