import type { Theme } from '../schema.js';

export const theme: Theme = {
	name: 'Light (Directus)',
	appearance: 'light',
	rules: {
		foreground: '#4f5464',
		foregroundAccent: '#172940',
		foregroundSubdued: '#a2b5cd',

		background: '#fff',

		primary: 'var(--project-color)',
		primaryBackground: 'color-mix(in srgb, var(--theme--background), var(--theme--primary) 10%)',
		primarySubdued: 'color-mix(in srgb, var(--theme--background), var(--theme--primary) 50%)',
		primaryAccent: 'color-mix(in srgb, var(--theme--primary), #2e3c43 25%)',

		secondary: '#ff99dd',
		secondaryBackground: 'color-mix(in srgb, var(--theme--background), var(--theme--secondary) 10%)',
		secondarySubdued: 'color-mix(in srgb, var(--theme--background), var(--theme--secondary) 50%)',
		secondaryAccent: 'color-mix(in srgb, var(--theme--secondary), #2e3c43 25%)',

		success: '#2ecda7',
		successBackground: 'color-mix(in srgb, var(--theme--background), var(--theme--success) 10%)',
		successSubdued: 'color-mix(in srgb, var(--theme--background), var(--theme--success) 50%)',
		successAccent: 'color-mix(in srgb, var(--theme--success), #2e3c43 25%)',

		warning: '#ffa439',
		warningBackground: 'color-mix(in srgb, var(--theme--background), var(--theme--warning) 10%)',
		warningSubdued: 'color-mix(in srgb, var(--theme--background), var(--theme--warning) 50%)',
		warningAccent: 'color-mix(in srgb, var(--theme--warning), #2e3c43 25%)',

		danger: '#e35169',
		dangerBackground: 'color-mix(in srgb, var(--theme--background), var(--theme--danger) 10%)',
		dangerSubdued: 'color-mix(in srgb, var(--theme--background), var(--theme--danger) 50%)',
		dangerAccent: 'color-mix(in srgb, var(--theme--danger), #2e3c43 25%)',

		fontFamilyDisplay: 'var(--theme--font-family-sans-serif)',
		fontFamilySansSerif: '"Inter", system-ui',
		fontFamilySerif: '"Merriweather", serif',
		fontFamilyMonospace: '"Fira Mono", monospace',

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
				icon: {
					foreground: 'var(--theme--primary)',
					foregroundHover: 'var(--theme--navigation--list--icon--foreground)',
					foregroundActive: 'var(--theme--navigation--list--icon--foreground)',
				},

				foreground: 'var(--theme--foreground-accent)',
				foregroundHover: 'var(--theme--navigation--list--foreground)',
				foregroundActive: 'var(--theme--navigation--list--foreground)',

				background: 'transparent',
				backgroundHover: '#e4eaf1',
				backgroundActive: '#e4eaf1',
			},
		},

		header: {
			background: 'var(--theme--background)',
			headline: {
				foreground: 'var(--theme--foreground-subdued)',
			},
			title: {
				foreground: 'var(--theme--foreground-accent)',
				fontFamily: 'var(--theme--font-family-display)',
			},
		},

		form: {
			field: {
				label: {
					foreground: 'var(--theme--foreground-accent)',
				},
				input: {
					background: 'var(--theme--background)',
					foreground: 'var(--theme--foreground)',
					foregroundSubdued: 'var(--theme--foreground-subdued)',
				},
			},
		},

		sidebar: {
			background: '#f0f4f9',
			foreground: 'var(--theme--foreground-subdued)',

			section: {
				toggle: {
					icon: {
						foreground: 'var(--theme--foreground-accent)',
						foregroundHover: 'var(--theme--sidebar--section--toggle--icon--foreground)',
						foregroundActive: 'var(--theme--sidebar--section--toggle--icon--foreground)',
					},

					foreground: 'var(--theme--foreground-accent)',
					foregroundHover: 'var(--theme--sidebar--section--toggle--foreground)',
					foregroundActive: 'var(--theme--sidebar--section--toggle--foreground)',

					background: '#e4eaf1',
					backgroundHover: 'var(--theme--sidebar--section--toggle--background)',
					backgroundActive: 'var(--theme--sidebar--section--toggle--background)',
				},
			},
		},
	},
};
