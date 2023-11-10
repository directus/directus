import { merge } from 'lodash-es';
import type { Theme } from '../../schemas/theme.js';
import { theme as defaultTheme } from './directus-default.js';

export const theme: Theme = {
	name: 'Directus Organic',
	appearance: 'light',
	rules: merge({}, defaultTheme.rules, {
		primary: '#006666',

		backgroundPage: '#F0F7F7',
		background: '#F0F7F7',
		backgroundAccent: '#AEDADA',
		backgroundSubdued: '#F0F7F7',

		borderColor: '#e6f0f0',
		borderColorAccent: '#cee0e0',
		borderColorSubdued: '#e6f0f0',

		borderWidth: '1px',
		borderRadius: '12px',

		foregroundSubdued: '#99ABAB',

		navigation: {
			background: '#ffffff',
			modules: {
				background: '#006666',
				button: {
					backgroundActive: '#ffffff',
					foreground: '#4F9696',
				},
			},
			project: { background: '#ffffff', borderWidth: '1px', borderColor: '#e6f0f0' },
			borderColor: '#e6f0f0',
			list: { backgroundHover: '#F0F7F7', backgroundActive: '#F0F7F7', divider: { borderColor: '#e6f0f0' } },
			borderWidth: '1px',
		},

		header: { background: '#ffffff' },

		form: {
			field: {
				input: {
					background: '#ffffff',
					borderColor: '#AEDADA',
					borderColorHover: '#86C1C1',
					borderColorFocus: '#6FAEAE',
				},
			},
		},

		sidebar: {
			background: '#ffffff',
			section: { toggle: { background: '#ffffff', borderWidth: '1px', borderColor: '#F0F7F7' } },
			borderColor: '#e6f0f0',
			borderWidth: '1px',
		},

		public: {
			art: {
				primary: '#A8CCCD',
				secondary: '#AEDADA',
				background: '#F0F7F7',
				speed: '1.0',
			},
			background: 'linear-gradient(17deg, rgba(240, 247, 247,1) 0%, rgba(255,255,255,1) 100%)',
		},
	}),
};
