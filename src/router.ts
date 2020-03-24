import VueRouter, { NavigationGuard, RouteConfig, Route } from 'vue-router';
import Debug from '@/routes/debug.vue';
import { useProjectsStore } from '@/stores/projects';
import LoginRoute from '@/routes/login';
import LogoutRoute from '@/routes/logout';
import ProjectChooserRoute from '@/routes/project-chooser';
import { checkAuth } from '@/auth';
import { hydrate, dehydrate } from '@/hydrate';
import useAppStore from '@/stores/app';
import useUserStore from '@/stores/user';

export const onBeforeEnterProjectChooser: NavigationGuard = (to, from, next) => {
	const projectsStore = useProjectsStore();
	projectsStore.state.currentProjectKey = null;
	next();
};

export const defaultRoutes: RouteConfig[] = [
	{
		name: 'project-chooser',
		path: '/',
		component: ProjectChooserRoute,
		meta: {
			public: true
		},
		beforeEnter: onBeforeEnterProjectChooser
	},
	{
		name: 'install',
		path: '/install',
		component: LoginRoute,
		meta: {
			public: true
		}
	},
	{
		path: '/:project',
		redirect: '/:project/login'
	},
	{
		name: 'login',
		path: '/:project/login',
		component: LoginRoute,
		meta: {
			public: true
		}
	},
	{
		name: 'logout',
		path: '/:project/logout',
		component: LogoutRoute
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
		path: '/:project/*',
		// This will be Private404
		component: Debug
	},
	{
		name: 'public-404',
		path: '*',
		// This will be Public404
		component: Debug
	}
];

const router = new VueRouter({
	mode: 'hash',
	routes: defaultRoutes
});

export function replaceRoutes(routeFilter: (routes: RouteConfig[]) => RouteConfig[]): void {
	const newRoutes = routeFilter([...defaultRoutes]);
	const newRouter = new VueRouter({ routes: newRoutes });

	// @ts-ignore - Matcher is not officially part of the public API (https://github.com/vuejs/vue-router/issues/2844#issuecomment-509529927)
	router.matcher = newRouter.matcher;
}

export const onBeforeEach: NavigationGuard = async (to, from, next) => {
	const projectsStore = useProjectsStore();
	const appStore = useAppStore();

	// Make sure the projects store is aware of all projects that exist
	if (projectsStore.state.projects === null) {
		await projectsStore.getProjects();
	}

	// When there aren't any projects, we should redirect to the install page to force the
	// user to setup a project.
	if (projectsStore.state.needsInstall === true && to.path !== '/install') {
		return next('/install');
	}

	// Keep the projects store currentProjectKey in sync with the route
	if (to.params.project && projectsStore.state.currentProjectKey !== to.params.project) {
		// If the store is hydrated for the current project, make sure to dehydrate it
		if (appStore.state.hydrated === true) {
			await dehydrate();
		}

		const projectExists = await projectsStore.setCurrentProject(to.params.project);

		// If the project you're trying to access doesn't exist, redirect to `/`
		if (to.path !== '/' && projectExists === false) {
			return next('/');
		}
	}

	// The store can only be hydrated if you're an authenticated user. If the store is hydrated, we
	// can safely assume you're logged in
	if (appStore.state.hydrated === false) {
		const authenticated = await checkAuth();

		if (authenticated === true) {
			await hydrate();
		} else if (to.meta?.public !== true) {
			return next(`/${to.params.project}/login`);
		}
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

/**
 * @TODO
 * We'll have to add a "resetRouter" function that will unregister all customly registered routes
 * on logout. This will make sure you don't accidentally still have the route from a custom module
 * for another given project.
 *
 * See https://github.com/vuejs/vue-router/issues/1234
 */
