export default defineNuxtConfig({
	devtools: { enabled: true },
	modules: [
		'@nuxt/content',
		'@nuxt/image',
		'nuxt-headlessui'
	],
	image: {
		provider: 'directus',
		directus: {
			baseURL: `${process.env.DIRECTUS_URL}/assets/`,
		}
	},
	headlessui: {
        prefix: 'H'
    }
})
