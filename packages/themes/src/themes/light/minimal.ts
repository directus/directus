import { defineTheme } from '../../utils/define-theme.js';

export default defineTheme({
	id: 'Directus Minimal',
	name: '$t:theme_directus_minimal',
	appearance: 'light',
	rules: {
		borderWidth: '1px',
		backgroundPage: 'color-mix(in srgb, #FFFFFF, var(--theme--primary) 7%)',
		navigation: {
			background: '#FFFFFF',
			modules: {
				background: '#FFFFFF',
				button: {
					backgroundActive: '#F1F5F9',
					foreground: 'var(--theme--foreground)',
					foregroundHover: 'var(--theme--primary)',
					foregroundActive: 'var(--theme--primary)',
					backgroundHover: '#F1F5F9',
					background: '#FFFFFF',
				},
				borderWidth: '1px',
				borderColor: 'var(--theme--border-color)',
			},
			project: {
				borderWidth: '1px',
				background: '#FFFFFF',
				borderColor: 'var(--theme--border-color)',
			},
			list: {
				icon: {
					foreground: '#0F172A',
				},
				divider: {
					borderColor: 'var(--theme--border-color)',
				},
			},
			borderWidth: '1px',
			backgroundAccent: '#F1F5F9',
			borderColor: 'var(--theme--border-color)',
		},
		header: {
			background: '#FFFFFF',
			borderWidth: '1px',
			borderColor: 'var(--theme--border-color)',
			boxShadow: '0 4px 7px -4px rgba(0,102,102, 0.1)',
		},
		backgroundAccent: '#E2E8F0',
		backgroundSubdued: '#F8FAFC',
		background: '#FFFFFF',
		foreground: '#1E293B',
		foregroundAccent: '#0F172A',
		foregroundSubdued: '#94A3B8',
		borderRadius: '4px',
		borderColor: '#E2E8F0',
		borderColorAccent: '#CBD5E1',
		borderColorSubdued: '#F1F5F9',
		form: {
			rowGap: '32px',
			field: {
				input: {
					background: '#FFFFFF',
					backgroundSubdued: '#F8FAFC',
					boxShadowFocus: 'none',
					height: '52px',
				},
			},
		},
		sidebar: {
			background: '#FFFFFF',
			borderWidth: '1px',
			borderColor: 'var(--theme--border-color)',
			section: {
				toggle: {
					borderColor: 'var(--theme--border-color)',
					borderWidth: '1px',
					background: '#FFFFFF',
					foreground: 'var(--theme--foreground-subdued)',
					foregroundHover: 'var(--theme--foreground)',
					foregroundActive: 'var(--theme--foreground-accent)',
					icon: {
						foreground: 'var(--theme--foreground)',
						foregroundHover: 'var(--theme--foreground)',
						foregroundActive: 'var(--theme--foreground-accent)',
					},
				},
				form: {
					field: {
						input: {
							height: '42px',
						},
					},
				},
			},
		},
		public: {
			art: {
				background: 'color-mix(in srgb, #FFFFFF, var(--project-color) 10%)',
				primary: 'color-mix(in srgb, #FFFFFF, var(--project-color) 70%)',
				secondary: 'color-mix(in srgb, #FFFFFF, var(--project-color) 40%)',
			},
			background: '#FFFFFF',
		},
		backgroundNormal: '#F1F5F9',
		secondary: '#64748B',
		primary: '#0F172A',
		primaryBackground: '#F1F5F9',
		primarySubdued: '#F8FAFC',
		primaryAccent: '#E2E8F0',
		secondaryAccent: '#E2E8F0',
		secondaryBackground: '#F1F5F9',
		secondarySubdued: '#F8FAFC',
		fonts: {
			display: {
				fontFamily: 'system-ui',
			},
		},
	},
});
