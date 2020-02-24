import VueRouter, { NavigationGuard, RouteConfig } from 'vue-router';
import Debug from '@/routes/debug.vue';
import { useProjectsStore } from '@/stores/projects';
import LoginRoute from '@/routes/login';
import ProjectChooserRoute from '@/routes/project-chooser';
import { checkAuth } from '@/auth';

export const onBeforeEnterProjectChooser: NavigationGuard = (to, from, next) => {
	const projectsStore = useProjectsStore();
	projectsStore.state.currentProjectKey = null;
	next();
};

export const defaultRoutes: RouteConfig[] = [
	{
		path: '/',
		component: ProjectChooserRoute,
		meta: {
			public: true
		},
		beforeEnter: onBeforeEnterProjectChooser
	},
	{
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
		path: '/:project/login',
		component: LoginRoute,
		meta: {
			public: true
		}
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
		path: '/:project/*',
		// This will be Private404
		component: Debug
	},
	{
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

	// Only on first load is from.name null. On subsequent requests, from.name is undefined | string
	const firstLoad = from.name === null;

	// Before we do anything, we have to make sure we're aware of the projects that exist in the
	// platform. We can also use this to (async) register all the globally available modules
	if (firstLoad) {
		await projectsStore.getProjects();
	}

	// When there aren't any projects, we should redirect to the install page to force the
	// user to setup a project.
	if (projectsStore.state.needsInstall === true && to.path !== '/install') {
		return next('/install');
	}

	// Keep the projects store currentProjectKey in sync with the route
	if (to.params.project && projectsStore.state.currentProjectKey !== to.params.project) {
		const projectExists = await projectsStore.setCurrentProject(to.params.project);

		if (to.path !== '/' && projectExists === false) {
			return next('/');
		}
	}

	// If the route you're trying to open is a public route, like login or password reset, we don't
	// have to perform the auth check below
	if (to.meta?.public === true) {
		return next();
	}

	// If you're trying to load a full URL (including) project, redirect to the login page of that
	// project if you're not logged in yet. Otherwise, redirect to the
	if (firstLoad) {
		const loggedIn = await checkAuth();

		if (loggedIn === false) {
			return next(`/${projectsStore.state.currentProjectKey}/login`);
		}
	}

	return next();
};

router.beforeEach(onBeforeEach);

export default router;

/**
 * @TODO
 * We'll have to add a "resetRouter" function that will unregister all customly registered routes
 * on logout. This will make sure you don't accidentally still have the route from a custom module
 * for another given project.
 *
 * See https://github.com/vuejs/vue-router/issues/1234
 */
