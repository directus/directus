import { HstVue } from '@histoire/plugin-vue';
import { defineConfig } from 'histoire';

export default defineConfig({
	plugins: [HstVue()],
	setupFile: './src/__histoire__/setup.ts',
	theme: {
		title: 'Directus Components',
		favicon: './public/favicon.ico',
		logo: {
			light: './src/assets/logo-dark.svg',
			dark: './src/assets/logo.svg',
		},
		logoHref: 'https://directus.io',
		colors: {
			primary: {
				50: '#fcfcff',
				100: '#ece7ff',
				200: '#cabeff',
				300: '#a996ff',
				400: '#876dff',
				500: '#6644ff',
				600: '#380cff',
				700: '#2600d3',
				800: '#1c009b',
				900: '#120063',
			},
		},
	},
	tree: {
		groups: [
			{
				id: 'components',
				title: 'Components',
				include: (file) => file.path.includes('components/'),
			},
			{
				id: 'other',
				title: 'Other',
				include: () => true,
			},
		],
	},
	backgroundPresets: [],
	viteIgnorePlugins: ['directus-extensions-serve', 'directus-extensions-build'],
	viteNodeInlineDeps: [/@joeattardi\/emoji-button/],
	vite: {
		base: '/',
	},
});
