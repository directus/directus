import type { Theme } from '../schema.js';

export const theme: Theme = {
	name: 'Light (Directus)',
	appearance: 'light',
	fonts: [],
	rules: {
		foreground: '#4f5464',
		background: '#fff',
		navigation: {
			background: '#f0f4f9',

			project: {
				background: '#e4eaf1',
				foreground: '#172940'
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
				foreground: '#172940',
				background: 'transparent',

				iconHover: 'var(--brand)',
				foregroundHover: '#172940',
				backgroundHover: '#e4eaf1',

				iconActive: 'var(--brand)',
				foregroundActive: '#172940',
				backgroundActive: '#e4eaf1',
			}
		},
	},
};
