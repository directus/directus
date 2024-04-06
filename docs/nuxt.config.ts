export default defineNuxtConfig({
	devtools: { enabled: true },
	modules: ['@nuxt/content', "@nuxt/image"],
	image: {
		provider: 'directus',
		directus: {
			baseURL: `${process.env.DIRECTUS_URL}/assets/`,
		}
	},
})
