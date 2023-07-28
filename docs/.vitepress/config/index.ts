import { defineConfig } from 'vitepress';
import { sharedConfig } from './shared';
import { config as enUS } from './locales/en-US';

export default defineConfig({
	...sharedConfig,

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
