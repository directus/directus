import type { Theme } from '../schema.js';

export const theme: Theme = {
	name: 'Light (Directus)',
	appearance: 'light',
	fonts: [],
	rules: {
		foreground: '#4f5464',
		foregroundAccent: '#172940',
		foregroundSubdued: '#a2b5cd',

		background: '#fff',

		primary: 'var(--project-color)',
		secondary: '#ff99dd',
		success: '#2ecda7',
		warning: '#ffa439',
		danger: '#e35169',

		navigation: {
			background: '#f0f4f9',

			project: {
				background: '#e4eaf1',
				foreground: 'var(--theme--foreground-accent)',
			},

			modules: {
				background: '#18222f',
				button: {
					foreground: '#8196b1',
					foregroundHover: '#fff',
					foregroundActive: 'var(--theme--foreground-accent)',
					background: 'transparent',
					backgroundHover: 'transparent',
					backgroundActive: '#f0f4f9',
				},
			},

			list: {
				icon: 'var(--project-color)',
				iconHover: 'var(--project-color)',
				iconActive: 'var(--project-color)',

				foreground: 'var(--theme--foreground-accent)',
				foregroundHover: 'var(--theme--foreground-accent)',
				foregroundActive: 'var(--theme--foreground-accent)',

				background: 'transparent',
				backgroundHover: '#e4eaf1',
				backgroundActive: '#e4eaf1',
			},
		},
	},
};
