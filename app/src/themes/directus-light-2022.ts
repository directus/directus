import { Theme } from '@directus/shared/types';

export const lightTheme: Theme = {
	name: 'Directus Light 2022',
	author: 'Directus',
	description: 'Primary light Directus theme',
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
					normal: '#6644FF',
					accent: '#4800e2',
					subtle: '#f2efff',
				},
				secondary: {
					normal: '#FF99DD',
					accent: '#ff77ba',
					subtle: '#ffebf9',
				},
				success: {
					normal: '#2ECDA7',
					accent: '#28b694',
					subtle: '#dbf7f0',
				},
				warning: {
					normal: '#FBC54F',
					accent: '#e5b23b',
					subtle: '#ffefcd',
				},
				danger: {
					normal: '#E35169',
					accent: '#bc3b52',
					subtle: '#fcedef',
				},
				border: {
					normal: '#D3DAE4',
					accent: '#A2B5CD',
					subtle: '#F0F4F9',
				},
				background: {
					normal: '#F0F4F9',
					accent: '#E4EAF1',
					subtle: '#F7FAFC',
					page: '#FFFFFF',
					invert: '#0D1117',
				},
				foreground: {
					normal: '#4F5464',
					accent: '#172940',
					subtle: '#A2B5CD',
					invert: '#FFFFFF',
				},
			},
		},
		components: {
			module: {
				background: {
					normal: '#18222F',
					hover: '#18222F',
					active: '#F0F4F9',
				},
				foreground: {
					normal: '#8196B1',
					hover: '#FFFFFF',
					active: '#172940',
				},
			},
		},
	},
};
