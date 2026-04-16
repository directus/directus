export default defineNuxtRouteMiddleware((to, from) => {
	const version = (from.query.version || to.query.version) as string | undefined;

	if (version && !to.query.version) {
		return navigateTo({ ...to, query: { ...to.query, version } });
	}
});
