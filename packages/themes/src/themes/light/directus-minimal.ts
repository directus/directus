import { merge } from 'lodash-es';
import type { Theme } from '../../schemas/theme.js';
import { theme as defaultTheme } from './directus-default.js';

export const theme: Theme = {
	name: 'Directus Minimal',
	appearance: 'light',
	rules: merge({}, defaultTheme.rules, {
		navigation: {
			background: '#FFFFFF',
			modules: {
				background: '#ffffff',
			},
		},
	}),
};
