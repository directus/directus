import { defineConfig } from 'vitepress';
import VitePluginMkCert from 'vite-plugin-mkcert';
import { sharedConfig } from './shared';
import { config as enUS } from './locales/en-US';

export default defineConfig({
	...sharedConfig,

	vite: {
		plugins: [
			// Docs will work on localhost via https
			// @ts-ignore
			VitePluginMkCert()
		]
	},

	locales: {
		root: {
			label: 'English',
			lang: 'en-US',
			link: '/',
			...enUS
		},
		helpUsTranslate: {
			label: 'Help us translate',
			link: 'https://locales.directus.io/',
			...enUS
		},

	},
});
