import { defineTheme } from '../../utils/define-theme.js';

export default defineTheme({
	id: 'Directus Default',
	name: '$t:theme_directus_default',
	appearance: 'light',
	rules: {
		borderRadius: '6px',
		borderWidth: '2px',

		foreground: '#4f5464',
		foregroundAccent: '#172940',
		foregroundSubdued: '#a2b5cd',

		background: '#fff',
		backgroundNormal: '#f0f4f9',
		backgroundAccent: '#e4eaf1',
		backgroundSubdued: '#f7fafc',

		borderColor: '#e4eaf1',
		borderColorAccent: '#d3dae4',
		borderColorSubdued: '#f0f4f9',

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

		fonts: {
			display: {
				fontFamily: '"Inter", system-ui',
				fontWeight: '700',
			},
			sans: {
				fontFamily: '"Inter", system-ui',
				fontWeight: '500',
			},
			serif: {
				fontFamily: '"Merriweather", serif',
				fontWeight: '500',
			},
			monospace: {
				fontFamily: '"Fira Mono", monospace',
				fontWeight: '500',
			},
		},

		navigation: {
			background: 'var(--theme--background-normal)',
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
					backgroundActive: 'var(--theme--background-normal)',
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

				fontFamily: 'var(--theme--fonts--sans--font-family)',

				divider: {
					borderColor: 'var(--theme--border-color-accent)',
					borderWidth: 'var(--theme--border-width)',
				},
			},
		},

		header: {
			background: 'var(--theme--background)',
			borderColor: 'transparent',
			borderWidth: '0px',
			boxShadow: '0 4px 7px -4px rgb(0 0 0 / 0.2)',
			headline: {
				foreground: 'var(--theme--foreground-subdued)',
				fontFamily: 'var(--theme--fonts--sans--font-family)',
			},
			title: {
				foreground: 'var(--theme--foreground-accent)',
				fontFamily: 'var(--theme--fonts--display--font-family)',
				fontWeight: 'var(--theme--fonts--display--font-weight)',
			},
		},

		form: {
			columnGap: '32px',
			rowGap: '40px',

			field: {
				label: {
					foreground: 'var(--theme--foreground-accent)',
					fontFamily: 'var(--theme--fonts--sans--font-family)',
					fontWeight: '600',
				},
				input: {
					background: 'var(--theme--background)',
					backgroundSubdued: 'var(--theme--background-subdued)',

					foreground: 'var(--theme--foreground)',
					foregroundSubdued: 'var(--theme--foreground-subdued)',

					borderColor: 'var(--theme--border-color)',
					borderColorHover: 'var(--theme--border-color-accent)',
					borderColorFocus: 'var(--theme--primary)',

					boxShadow: 'none',
					boxShadowHover: 'none',
					boxShadowFocus: '0 0 16px -8px var(--theme--primary)',

					height: '60px',
					padding: '16px',
				},
			},
		},

		sidebar: {
			background: 'var(--theme--background-normal)',
			foreground: 'var(--theme--foreground-subdued)',
			fontFamily: 'var(--theme--fonts--sans--font-family)',
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

					fontFamily: 'var(--theme--fonts--sans--font-family)',

					borderColor: 'transparent',
					borderWidth: '0px',
				},

				form: {
					columnGap: 'var(--theme--form--column-gap)',
					rowGap: 'var(--theme--form--row-gap)',

					label: {
						foreground: 'var(--theme--form--field--label--foreground)',
						fontFamily: 'var(--theme--form--field--label--font-family)',
					},

					field: {
						input: {
							background: 'var(--theme--form--field--input--background)',
							foreground: 'var(--theme--form--field--input--foreground)',
							foregroundSubdued: 'var(--theme--form--field--input--foreground-subdued)',

							borderColor: 'var(--theme--form--field--input--border-color)',
							borderColorHover: 'var(--theme--form--field--input--border-color-hover)',
							borderColorFocus: 'var(--theme--form--field--input--border-color-focus)',

							boxShadow: 'var(--theme--form--field--input--box-shadow)',
							boxShadowHover: 'var(--theme--form--field--input--box-shadow-hover)',
							boxShadowFocus: 'var(--theme--form--field--input--box-shadow-focus)',

							height: '52px',
							padding: '12px',
						},
					},
				},
			},
		},

		public: {
			background: 'var(--theme--background)',
			foreground: 'var(--theme--foreground)',
			foregroundAccent: 'var(--theme--foreground-accent)',

			art: {
				background: '#0e1c2f',
				primary: 'var(--theme--primary)',
				secondary: 'var(--theme--secondary)',
				speed: '1',
			},

			form: {
				columnGap: 'var(--theme--form--column-gap)',
				rowGap: 'var(--theme--form--row-gap)',

				label: {
					foreground: 'var(--theme--form--field--label--foreground)',
					fontFamily: 'var(--theme--form--field--label--font-family)',
				},

				field: {
					input: {
						background: 'var(--theme--form--field--input--background)',
						foreground: 'var(--theme--form--field--input--foreground)',
						foregroundSubdued: 'var(--theme--form--field--input--foreground-subdued)',

						borderColor: 'var(--theme--form--field--input--border-color)',
						borderColorHover: 'var(--theme--form--field--input--border-color-hover)',
						borderColorFocus: 'var(--theme--form--field--input--border-color-focus)',

						boxShadow: 'var(--theme--form--field--input--box-shadow)',
						boxShadowHover: 'var(--theme--form--field--input--box-shadow-hover)',
						boxShadowFocus: 'var(--theme--form--field--input--box-shadow-focus)',

						height: 'var(--theme--form--field--input--height)',
						padding: 'var(--theme--form--field--input--padding)',
					},
				},
			},
		},

		popover: {
			menu: {
				background: '#fafcfd',
				borderRadius: 'var(--theme--border-radius)',
				boxShadow: '0px 0px 6px 0px rgb(23, 41, 64, 0.2), 0px 0px 12px 2px rgb(23, 41, 64, 0.05)',
			},
		},
	},
});
