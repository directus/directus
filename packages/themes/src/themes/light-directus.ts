import type { Theme } from '../schema.js';

export const theme: Theme = {
	name: 'Light (Directus)',
	appearance: 'light',
	variables: {},
	rules: {
		foreground: '#4f5464',
		background: 'white',
		moduleBar: {
			background: '#18222f',
			button: {
				foreground: '#8196b1',
				foregroundHover: 'white',
				foregroundActive: '#172940',
				background: 'transparent',
				backgroundHover: 'transparent',
				backgroundActive: '#f0f4f9'
			}
		},
	},
};
