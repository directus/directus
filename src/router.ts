import VueRouter, { NavigationGuard } from 'vue-router';
import Debug from '@/routes/debug.vue';
import { useProjectsStore } from '@/stores/projects';

const router = new VueRouter({
	mode: 'hash',
	routes: [
		{
			path: '/:project/*',
			component: Debug
		},
		{
			path: '/',
			component: Debug
		},
		{
			path: '*',
			component: Debug
		}
	]
});

export const onBeforeEach: NavigationGuard = async (to, from, next) => {
	const projectsStore = useProjectsStore();

	// First load
	if (from.name === null) {
		await projectsStore.getProjects();

		if (projectsStore.state.needsInstall === true) {
			return next('/install');
		}
	}

	if (to.params.project) {
		projectsStore.state.currentProjectKey = to.params.project;
	}

	return next();
};

router.beforeEach(onBeforeEach);

export function useRouter() {
	return router;
}

export default router;
