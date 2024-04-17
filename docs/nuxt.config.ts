export default defineNuxtConfig({
	css: ['~/assets/css/main.scss'],
	modules: [
		'@nuxt/content',
		'@nuxt/image',
		'nuxt-icon',
		'nuxt-headlessui',
	],
	content: {
		highlight: {
			theme: {
				default: 'github-light',
				dark: 'github-dark',
			},
			langs: ['json', 'js', 'ts', 'html', 'css', 'vue', 'shell', 'mdc', 'md', 'yaml', 'bash', 'swift', 'python'],
		},
		markdown: {
			toc: {
				depth: 1,
			},
		}
	},
	image: {
		provider: 'directus',
		directus: {
			baseURL: `${process.env.DIRECTUS_URL}/assets/`,
		},
	},
	headlessui: {
        prefix: 'H',
    },
})
