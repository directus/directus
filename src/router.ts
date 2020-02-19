import VueRouter, { NavigationGuard } from 'vue-router';
import Debug from '@/routes/debug.vue';
import { useProjectsStore } from '@/stores/projects';
import { useModulesStore } from '@/stores/modules';
import LoginRoute from '@/routes/login';
import api from '@/api';

const router = new VueRouter({
	mode: 'hash',
	routes: [
		{
			path: '/:project/login',
			component: LoginRoute,
			meta: {
				public: true
			}
		},
		{
			path: '/:project/*',
			component: Debug
		}
	]
});

export const onBeforeEach: NavigationGuard = async (to, from, next) => {
	const projectsStore = useProjectsStore();
	const modulesStore = useModulesStore();

	// First load
	if (from.name === null) {
		await projectsStore.getProjects();
		modulesStore.registerGlobalModules();

		if (projectsStore.state.needsInstall === true) {
			return next('/install');
		}
	}

	if (to.params.project) {
		projectsStore.state.currentProjectKey = to.params.project;
	} else if (projectsStore.state.projects.length > 0) {
		projectsStore.state.currentProjectKey = projectsStore.state.projects[0].key;
		to.params.project = projectsStore.state.currentProjectKey;
	}

	if (to.meta?.public === true) {
		return next();
	}

	// Check authentication status
	const loggedIn = await checkAuth(to.params.project);

	if (loggedIn === false) {
		return next(`/${to.params.project}/login`);
	}

	return next();
};

export async function checkAuth(projectKey: string) {
	try {
		await api.get(`/${projectKey}/users/me`);
		return true;
	} catch {
		return false;
	}
}

router.beforeEach(onBeforeEach);

export function useRouter() {
	return router;
}

export default router;

/**
 * @TODO
 * We'll have to add a "resetRouter" function that will unregister all customly registered routes
 * on logout. This will make sure you don't accidentally still have the route from a custom module
 * for another given project.
 *
 * See https://github.com/vuejs/vue-router/issues/1234
 */
