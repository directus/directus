import type { Theme } from '../schema.js';

export const theme: Theme = {
	name: 'Light (Directus)',
	appearance: 'light',
	rules: {
		fontFamilyDisplay: 'var(--theme--font-family-sans-serif)',
		fontFamilySansSerif: '"Inter", system-ui',
		fontFamilySerif: '"Merriweather", serif',
		fontFamilyMonospace: '"Fira Mono", monospace',

		borderRadius: '6px',
		borderWidth: '2px',

		foreground: '#4f5464',
		foregroundAccent: '#172940',
		foregroundSubdued: '#a2b5cd',

		backgroundPage: '#fff',

		background: '#f0f4f9',
		backgroundAccent: '#e4eaf1',
		backgroundSubdued: '#f7fafc',

		borderColor: '#e4eaf1',
		borderColorAccent: '#d3dae4',
		borderColorSubdued: '#f0f4f9',

		primary: 'var(--project-color)',
		primaryBackground: 'color-mix(in srgb, var(--theme--background-page), var(--theme--primary) 10%)',
		primarySubdued: 'color-mix(in srgb, var(--theme--background-page), var(--theme--primary) 50%)',
		primaryAccent: 'color-mix(in srgb, var(--theme--primary), #2e3c43 25%)',

		secondary: '#ff99dd',
		secondaryBackground: 'color-mix(in srgb, var(--theme--background-page), var(--theme--secondary) 10%)',
		secondarySubdued: 'color-mix(in srgb, var(--theme--background-page), var(--theme--secondary) 50%)',
		secondaryAccent: 'color-mix(in srgb, var(--theme--secondary), #2e3c43 25%)',

		success: '#2ecda7',
		successBackground: 'color-mix(in srgb, var(--theme--background-page), var(--theme--success) 10%)',
		successSubdued: 'color-mix(in srgb, var(--theme--background-page), var(--theme--success) 50%)',
		successAccent: 'color-mix(in srgb, var(--theme--success), #2e3c43 25%)',

		warning: '#ffa439',
		warningBackground: 'color-mix(in srgb, var(--theme--background-page), var(--theme--warning) 10%)',
		warningSubdued: 'color-mix(in srgb, var(--theme--background-page), var(--theme--warning) 50%)',
		warningAccent: 'color-mix(in srgb, var(--theme--warning), #2e3c43 25%)',

		danger: '#e35169',
		dangerBackground: 'color-mix(in srgb, var(--theme--background-page), var(--theme--danger) 10%)',
		dangerSubdued: 'color-mix(in srgb, var(--theme--background-page), var(--theme--danger) 50%)',
		dangerAccent: 'color-mix(in srgb, var(--theme--danger), #2e3c43 25%)',

		navigation: {
			background: 'var(--theme--background)',
			backgroundAccent: 'var(--theme--background-accent)',

			borderColor: 'transparent',
			borderWidth: '0px',

			project: {
				borderColor: 'transparent',
				borderWidth: '0px',
				background: 'var(--theme--navigation--background-accent)',
				foreground: 'var(--theme--foreground-accent)',
				fontFamily: 'var(--theme--font-family-sans-serif)',
			},

			modules: {
				background: '#0e1c2f',
				borderColor: 'transparent',
				borderWidth: '0px',

				button: {
					foreground: '#8196b1',
					foregroundHover: '#fff',
					foregroundActive: 'var(--theme--foreground-accent)',

					background: 'transparent',
					backgroundHover: 'transparent',
					backgroundActive: 'var(--theme--background)',
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
				backgroundHover: 'var(--theme--navigation--background-accent)',
				backgroundActive: 'var(--theme--navigation--background-accent)',

				fontFamily: 'var(--theme--font-family-sans-serif)',

				divider: {
					borderColor: 'var(--theme--border-color-accent)',
					borderWidth: 'var(--theme--border-width)',
				},
			},
		},

		header: {
			background: 'var(--theme--background-page)',
			borderColor: 'transparent',
			borderWidth: '0px',
			boxShadow: '0 4px 7px -4px rgb(0 0 0 / 0.2)',
			headline: {
				foreground: 'var(--theme--foreground-subdued)',
				fontFamily: 'var(--theme--font-family-sans-serif)',
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
					fontFamily: 'var(--theme--font-family-sans-serif)',
				},
				input: {
					background: 'var(--theme--background-page)',
					foreground: 'var(--theme--foreground)',
					foregroundSubdued: 'var(--theme--foreground-subdued)',

					borderColor: 'var(--theme--border-color)',
					borderColorHover: 'var(--theme--border-color-accent)',
					borderColorFocus: 'var(--theme--primary)',

					boxShadow: 'none',
					boxShadowHover: 'none',
					boxShadowFocus: '0 0 16px -8px var(--theme--primary)',
				},
			},
		},

		sidebar: {
			background: 'var(--theme--background)',
			foreground: 'var(--theme--foreground-subdued)',
			fontFamily: 'var(--theme--font-family-sans-serif)',
			borderColor: 'transparent',
			borderWidth: '0px',

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

					background: 'var(--theme--background-accent)',
					backgroundHover: 'var(--theme--sidebar--section--toggle--background)',
					backgroundActive: 'var(--theme--sidebar--section--toggle--background)',

					fontFamily: 'var(--theme--font-family-sans-serif)',

					borderColor: 'transparent',
					borderWidth: '0px',
				},
			},
		},

		public: {
			art: {
				background: '#0e1c2f',
				primary: 'var(--theme--primary)',
				secondary: 'var(--theme--secondary)',
				speed: '1',
			},
		},
	},
};
