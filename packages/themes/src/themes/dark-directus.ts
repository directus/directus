import type { Theme } from '../schema.js';

export const theme: Theme = {
	name: 'Dark (Directus)',
	appearance: 'dark',
	rules: {
		foreground: '#c9d1d9',
		foregroundAccent: '#f0f6fc',
		foregroundSubdued: '#666672',

		background: '#0d1117',

		primary: 'var(--project-color)',
		primaryBackground: 'color-mix(in srgb, var(--theme--background), var(--theme--primary) 10%)',
		primarySubdued: 'color-mix(in srgb, var(--theme--background), var(--theme--primary) 50%)',
		primaryAccent: 'color-mix(in srgb, var(--theme--primary), #16151a 25%)',

		secondary: '#ff99dd',
		secondaryBackground: 'color-mix(in srgb, var(--theme--background), var(--theme--secondary) 10%)',
		secondarySubdued: 'color-mix(in srgb, var(--theme--background), var(--theme--secondary) 50%)',
		secondaryAccent: 'color-mix(in srgb, var(--theme--secondary), #16151a 25%)',

		success: '#2ecda7',
		successBackground: 'color-mix(in srgb, var(--theme--background), var(--theme--success) 10%)',
		successSubdued: 'color-mix(in srgb, var(--theme--background), var(--theme--success) 50%)',
		successAccent: 'color-mix(in srgb, var(--theme--success), #16151a 25%)',

		warning: '#ffa439',
		warningBackground: 'color-mix(in srgb, var(--theme--background), var(--theme--warning) 10%)',
		warningSubdued: 'color-mix(in srgb, var(--theme--background), var(--theme--warning) 50%)',
		warningAccent: 'color-mix(in srgb, var(--theme--warning), #16151a 25%)',

		danger: '#e35169',
		dangerBackground: 'color-mix(in srgb, var(--theme--background), var(--theme--danger) 10%)',
		dangerSubdued: 'color-mix(in srgb, var(--theme--background), var(--theme--danger) 50%)',
		dangerAccent: 'color-mix(in srgb, var(--theme--danger), #16151a 25%)',

		fontFamilyDisplay: 'var(--theme--font-family-sans-serif)',
		fontFamilySansSerif: '"Inter", system-ui',
		fontFamilySerif: '"Merriweather", serif',
		fontFamilyMonospace: '"Fira Mono", monospace',

		navigation: {
			background: '#21262e',

			project: {
				background: '#30363d',
				foreground: 'var(--theme--foreground-accent)',
			},

			modules: {
				background: 'var(--theme--background)',
				button: {
					foreground: 'var(--theme--foreground-subdued)',
					foregroundHover: '#fff',
					foregroundActive: 'var(--theme--foreground-accent)',

					background: 'transparent',
					backgroundHover: 'transparent',
					backgroundActive: '#21262e',
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
				backgroundHover: '#30363d',
				backgroundActive: '#30363d',
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
			background: '#21262e',
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

					background: '#30363d',
					backgroundHover: 'var(--theme--sidebar--section--toggle--background)',
					backgroundActive: 'var(--theme--sidebar--section--toggle--background)',
				},
			},
		},
	},
};
