import fs from 'node:fs';
import path from 'node:path';

export default defineNuxtConfig({
	components: [
		{ path: '~/components', pathPrefix: false },
		{ path: '~/components/block', pathPrefix: false },
		{ path: '~/components/shared', pathPrefix: false },
		{ path: '~/components/base', pathPrefix: false },
		{ path: '~/components/forms', pathPrefix: false },
	],

	ssr: true,
	modules: [
		'@nuxt/image',
		'@nuxtjs/seo',
		'@nuxt/scripts',
		'@vueuse/nuxt',
		'nuxt-security',
		'@nuxtjs/tailwindcss',
		'shadcn-nuxt',
		'@nuxt/icon',
		'@nuxtjs/color-mode',
	],

	css: ['~/assets/css/tailwind.css'],

	runtimeConfig: {
		public: {
			siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
			directusUrl: process.env.DIRECTUS_URL,
			dontDoThisInProductionToken: process.env.DIRECTUS_SERVER_TOKEN,
		},
		directusServerToken: process.env.DIRECTUS_SERVER_TOKEN,
	},

	shadcn: {
		/**
		 * Prefix for all the imported component
		 */
		prefix: '',
		/**
		 * Directory that the component lives in.
		 * @default "./components/ui"
		 */
		componentDir: './app/components/ui',
	},

	security: {
		headers: {
			contentSecurityPolicy: {
				'img-src': ["'self'", 'data:', '*'],
				'script-src': ["'self'", "'unsafe-inline'", '*'],
				'connect-src': ["'self'", process.env.DIRECTUS_URL!],
				'frame-ancestors': ["'self'", process.env.DIRECTUS_URL!, 'http://localhost:8080'],
			},
		},
	},

	// devtools: { enabled: true },

	// Image Configuration - https://image.nuxt.com/providers/directus
	image: {
		providers: {
			directus: {
				provider: 'directus',
				options: {
					baseURL: `${process.env.DIRECTUS_URL}/assets/`,
				},
			},
			local: {
				provider: 'ipx',
			},
		},
	},

	colorMode: {
		preference: 'system',
		fallback: 'light',
		classSuffix: '',
	},

	site: {
		url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
	},
	vue: {
		propsDestructure: true,
	},

	sitemap: {
		sources: ['/api/sitemap'],
	},

	compatibilityDate: '2025-01-16',

	// NOTE: testing environments for visual editing
	$env: {
		'visual-editing:monolith': {
			// available via `const { public: { visualEditingTestEnv, testCase } } = useRuntimeConfig()`
			runtimeConfig: { public: { visualEditingTestEnv: 'monolith', testCase: 'basic' } },
			// every page needs to be server rendered only
			hooks: {
				'pages:extend'(pages) {
					pages.forEach((page) => (page.mode = 'server'));
				},
				'nitro:build:public-assets'() {
					const sourceFile = path.join(__dirname, 'node_modules/@directus/visual-editing/dist', 'visual-editing.js');
					const destFile = path.join(__dirname, '.output/public', 'visual-editing.js');
					fs.copyFile(sourceFile, destFile, () => {});
				},
			},

			// add global script
			app: {
				head: {
					script: [
						{ src: '/visual-editing.js', type: 'text/javascript' },
						{
							innerHTML: `document.addEventListener('DOMContentLoaded', function () {
								DirectusVisualEditing.apply({ directusUrl: '${process.env.DIRECTUS_URL}' });
							});`,
							type: 'text/javascript',
							crossorigin: 'anonymous',
						},
					],
				},
			},
		},
		'visual-editing:ssr': {
			// available via `const { public: { visualEditingTestEnv, testCase } } = useRuntimeConfig()`
			runtimeConfig: { public: { visualEditingTestEnv: 'ssr', testCase: 'basic' } },
		},
		'visual-editing:ssg': {
			// available via `const { public: { visualEditingTestEnv, testCase } } = useRuntimeConfig()`
			runtimeConfig: { public: { visualEditingTestEnv: 'ssg', testCase: 'refresh-ssg' } },
		},
	},
	$development: {
		// available via `const { public: { visualEditingTestEnv, testCase } } = useRuntimeConfig()`
		runtimeConfig: { public: { visualEditingTestEnv: 'dev', testCase: 'basic' } },
	},
});
