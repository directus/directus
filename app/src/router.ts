import { refresh } from '@/auth';
import { hydrate } from '@/hydrate';
import TFASetup from '@/routes/tfa-setup.vue';
import AcceptInviteRoute from '@/routes/accept-invite.vue';
import LoginRoute from '@/routes/login/login.vue';
import LogoutRoute from '@/routes/logout.vue';
import ShareRoute from '@/routes/shared/shared.vue';
import PrivateNotFoundRoute from '@/routes/private-not-found.vue';
import ResetPasswordRoute from '@/routes/reset-password/reset-password.vue';
import { useAppStore } from '@/stores/app';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';
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
		name: 'tfa-setup',
		path: '/tfa-setup',
		component: TFASetup,
		meta: {
			track: false,
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
	const userStore = useUserStore();

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

	if (serverStore.info.project === null) {
		await serverStore.hydrate();
	}

	if (to.meta?.public !== true) {
		if (appStore.hydrated === false) {
			appStore.hydrating = false;
			if (appStore.authenticated === true) {
				await hydrate();
				if (
					userStore.currentUser &&
					to.fullPath === '/tfa-setup' &&
					!('share' in userStore.currentUser) &&
					userStore.currentUser.tfa_secret !== null
				) {
					return userStore.currentUser.last_page || '/login';
				}
				return to.fullPath;
			} else {
				if (to.fullPath) {
					return '/login?redirect=' + encodeURIComponent(to.fullPath);
				} else {
					return '/login';
				}
			}
		}

		if (userStore.currentUser && !('share' in userStore.currentUser) && userStore.currentUser.role) {
			if (to.path !== '/tfa-setup') {
				if (userStore.currentUser.role.enforce_tfa && userStore.currentUser.tfa_secret === null) {
					if (userStore.currentUser.last_page === to.fullPath) {
						return '/tfa-setup';
					} else {
						return '/tfa-setup?redirect=' + encodeURIComponent(to.fullPath);
					}
				}
			} else if (userStore.currentUser.tfa_secret !== null) {
				return userStore.currentUser.last_page || '/login';
			}
		}
	}
};

let trackTimeout: number | null = null;

export const onAfterEach: NavigationHookAfter = (to) => {
	const userStore = useUserStore();

	if (to.meta.public !== true && to.meta.track !== false) {
		// The timeout gives the page some breathing room to load. No need to clog up the thread with
		// this call while more important things are loading

		if (trackTimeout) {
			window.clearTimeout(trackTimeout);
			trackTimeout = null;
		}

		trackTimeout = window.setTimeout(() => {
			userStore.trackPage(to.fullPath);
		}, 500);
	}
};

router.beforeEach(onBeforeEach);
router.afterEach(onAfterEach);
