import { defineConfig } from 'vitepress';
import VitePluginMkCert from 'vite-plugin-mkcert';
import { sharedConfig } from './shared';
import { config as enUS } from './locales/en-US';
import { config as ruRU } from './locales/ru-RU';

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
		ru: {
			label: 'Русский',
			lang: 'ru-RU',
			link: '/ru/',
			...ruRU
		},
		helpUsTranslate: {
			label: 'Help us translate',
			link: 'https://locales.directus.io/',
			...enUS
		},

	},
});
