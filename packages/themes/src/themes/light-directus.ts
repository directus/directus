import type { Theme } from '../schema.js';

export const theme: Theme = {
	name: 'Light (Directus)',
	appearance: 'light',
	fonts: [],
	rules: {
		background: '#fff',
		foreground: '#4f5464',
		foregroundAccent: '#172940',
		foregroundSubdued: '#a2b5cd',
		navigation: {
			background: '#f0f4f9',

			project: {
				background: '#e4eaf1',
				foreground: '#172940',
			},

			modules: {
				background: '#18222f',
				button: {
					foreground: '#8196b1',
					foregroundHover: '#fff',
					foregroundActive: '#172940',
					background: 'transparent',
					backgroundHover: 'transparent',
					backgroundActive: '#f0f4f9',
				},
			},

			list: {
				icon: 'var(--brand)',
				iconHover: 'var(--brand)',
				iconActive: 'var(--brand)',

				foreground: '#172940',
				foregroundHover: '#172940',
				foregroundActive: '#172940',

				background: 'transparent',
				backgroundHover: '#e4eaf1',
				backgroundActive: '#e4eaf1',
			},
		},
	},
};
