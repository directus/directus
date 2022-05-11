import { Theme } from '@directus/shared/types';

export const darkTheme: Theme = {
	name: 'Directus Dark 2022',
	author: 'Directus',
	description: 'Primary dark Directus theme',
	theme: {
		global: {
			font: {
				family: {
					sans: [
						'Inter',
						'-apple-system',
						'BlinkMacSystemFont',
						'Segoe UI',
						'Roboto',
						'Helvetica',
						'Arial',
						'sans-serif',
						'Apple Color Emoji',
						'Segoe UI Emoji',
						'Segoe UI Symbol',
					],
					serif: ['Merriweather', 'serif'],
					mono: ['Fira Mono', 'monospace', 'sans-serif'],
				},
			},
			border: {
				width: 2,
				radius: 6,
			},
			color: {
				primary: {
					normal: '#8866ff',
					accent: '#a48bff',
					subtle: '#191a2d',
				},
				secondary: {
					normal: '#FF99DD',
					accent: '#ffbdd9',
					subtle: '#1f1924',
				},
				success: {
					normal: '#2ECDA7',
					accent: '#35e5bb',
					subtle: '#0d1e1f',
				},
				warning: {
					normal: '#FBC54F',
					accent: '#fcdcac',
					subtle: '#1d1b16',
				},
				danger: {
					normal: '#E35169',
					accent: '#e7828f',
					subtle: '#231820',
				},
				border: {
					normal: '#30363D',
					accent: '#484f58',
					subtle: '#21262D',
				},
				background: {
					normal: '#21262E',
					accent: '#30363D',
					subtle: '#161B22',
					page: '#0D1117',
					invert: '#FFFFFF',
				},
				foreground: {
					normal: '#C9D1D9',
					accent: '#F0F6FC',
					subtle: '#666672',
					invert: '#0D1117',
				},
			},
		},
		components: {
			module: {
				background: {
					normal: '#0D1117',
					hover: '#0D1117',
					active: '#21262E',
				},
				foreground: {
					normal: '#666672',
					hover: '#FFFFFF',
					active: '#F0F6FC',
				},
			},
		},
	},
};
