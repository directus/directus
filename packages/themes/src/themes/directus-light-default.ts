import type { Theme } from '../schema.js';

export const theme: Theme = {
	name: 'Directus Light (Default)',
	appearance: 'light',
	variables: {
		red: 'tomato',
	},
	rules: {
		foreground: 'var(--red)',
		background: 'white',
		moduleBar: {
			background: '#000',
			foreground: '#fff',
		},
	},
};
