import { refresh } from '@/auth';
import { hydrate } from '@/hydrate';
import AcceptInviteRoute from '@/routes/accept-invite.vue';
import LoginRoute from '@/routes/login/login.vue';
import LogoutRoute from '@/routes/logout.vue';
import PrivateNotFoundRoute from '@/routes/private-not-found.vue';
import RegisterRoute from '@/routes/register/register.vue';
import ResetPasswordRoute from '@/routes/reset-password/reset-password.vue';
import Setup from '@/routes/setup/setup.vue';
import ShareRoute from '@/routes/shared/shared.vue';
import TFASetup from '@/routes/tfa-setup.vue';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';
import { getRootPath } from '@/utils/get-root-path';
import { useAppStore } from '@directus/stores';
import { useLocalStorage } from '@vueuse/core';
import { createRouter, createWebHistory, NavigationGuard, NavigationHookAfter, RouteRecordRaw } from 'vue-router';

export const defaultRoutes: RouteRecordRaw[] = [
	{
		path: '/',
		redirect: () => {
			const serverStore = useServerStore();

			if (serverStore.info.setupCompleted) {
				return '/login';
			} else {
				return '/setup';
			}
		},
	},
	{
		name: 'setup',
		path: '/setup',
		component: Setup,
		beforeEnter: async (_from, _to, next) => {
			const serverStore = useServerStore();

			if (serverStore.info.setupCompleted) {
				return next('/login');
			}

			return next();
		},
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
		name: 'register',
		path: '/register',
		component: RegisterRoute,
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
	const requireTfaSetup = useLocalStorage<string | null>('directus-require_tfa_setup', null);

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
		try {
			await serverStore.hydrate();
		} catch (error: any) {
			appStore.error = error;
		}
	}

	if (!serverStore.info.setupCompleted) {
		if (to.fullPath === '/setup') return;
		return '/setup';
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

		if (userStore.currentUser && !('share' in userStore.currentUser)) {
			if (to.path !== '/tfa-setup') {
				// Check for role-based enforcement
				if (userStore.currentUser.enforce_tfa && userStore.currentUser.tfa_secret === null) {
					if (userStore.currentUser.last_page === to.fullPath) {
						return '/tfa-setup';
					} else {
						return '/tfa-setup?redirect=' + encodeURIComponent(to.fullPath);
					}
				}

				// Check for user-initiated TFA setup request in localStorage
				if (requireTfaSetup.value === userStore.currentUser.id && userStore.currentUser.tfa_secret === null) {
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

	return;
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
			userStore.trackPage(to);
		}, 500);
	}
};

router.beforeEach(onBeforeEach);
router.afterEach(onAfterEach);
