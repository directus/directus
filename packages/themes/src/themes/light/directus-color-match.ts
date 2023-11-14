import type { Theme } from '../../schemas/theme.js';

export const theme: Theme = {
	name: 'Directus Color Match',
	appearance: 'light',
	rules: {
		background: 'color-mix(in srgb, #FFFFFF, var(--theme--primary) 7%)',
		backgroundAccent: 'color-mix(in srgb, #FFFFFF, var(--theme--primary) 20%)',
		backgroundNormal: 'color-mix(in srgb, #FFFFFF, var(--theme--primary) 15%)',
		backgroundSubdued: 'color-mix(in srgb, #FFFFFF, var(--theme--primary) 7%)',

		borderColor: 'color-mix(in srgb, #FFFFFF, var(--theme--primary) 20%)',
		borderColorAccent: 'color-mix(in srgb, #FFFFFF, var(--theme--primary) 40%)',
		borderColorSubdued: 'color-mix(in srgb, #FFFFFF, var(--theme--primary) 15%)',

		borderRadius: '12px',
		borderWidth: '1px',

		fontFamilyDisplay: '"Montserrat", system-ui',

		foreground: 'color-mix(in srgb, #000000, var(--theme--primary) 70%)',
		foregroundAccent: 'color-mix(in srgb, #000000, var(--theme--primary) 50%)',
		foregroundSubdued: 'color-mix(in srgb, #FFFFFF, var(--theme--primary) 40%)',

		form: {
			field: {
				input: { background: '#FFFFFF', backgroundSubdued: 'color-mix(in srgb, #FFFFFF, var(--theme--primary) 7%)' },
			},
		},
		navigation: {
			background: '#FFFFFF',
			backgroundAccent: 'var(--theme--background)',
			borderWidth: 'var(--theme--border-width)',
			borderColor: 'var(--theme--border-color-subdued)',
			modules: {
				background: 'color-mix(in srgb, #000000, var(--theme--primary) 90%)',
				button: { backgroundActive: '#FFFFFF', foreground: 'var(--theme--foreground-subdued)' },
			},
			project: { borderWidth: '1px', background: '#FFFFFF', borderColor: 'var(--theme--border-color-subdued)' },
			list: { divider: { borderColor: 'var(--theme--border-color-subdued)' } },
		},
		header: {
			background: '#FFFFFF',
			borderWidth: '1px',
			borderColor: 'var(--theme--border-color-subdued)',
			boxShadow: '0 4px 7px -4px rgba(0,102,102, 0.2)',
		},
		sidebar: {
			background: '#FFFFFF',
			borderWidth: '1px',
			borderColor: 'var(--theme--border-color-subdued)',
			section: {
				toggle: {
					borderColor: 'var(--theme--border-color-subdued)',
					borderWidth: '1px',
					background: '#FFFFFF',
					foreground: 'var(--theme--foreground-subdued)',
					foregroundHover: 'var(--theme--foreground)',
					foregroundActive: 'var(--theme--foreground-accent)',
					icon: {
						foreground: 'var(--theme--foreground-subdued)',
						foregroundHover: 'var(--theme--foreground)',
						foregroundActive: 'var(--theme--foreground-accent)',
					},
				},
			},
		},
		public: {
			art: {
				background: 'color-mix(in srgb, #FFFFFF, var(--theme--primary) 10%)',
				primary: 'color-mix(in srgb, #FFFFFF, var(--theme--primary) 60%)',
				secondary: 'color-mix(in srgb, #FFFFFF, var(--theme--secondary) 70%)',
			},
			background: '#FFFFFF',
		},
	},
};
