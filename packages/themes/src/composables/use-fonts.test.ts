import { describe, expect, it, vi } from 'vitest';
import { useFonts } from './use-fonts';

vi.mock('@directus/utils/browser', () => ({ cssVar: () => 'Inter' }));

const ThemeSchemaMock = {
	rules: {
		fonts: {
			display: {
				fontFamily: '"Roboto", "Open Sans"',
				fontWeight: '700',
			},
			sans: {
				fontFamily: 'Arial',
				fontWeight: '400',
			},
			serif: {
				fontFamily: '"Fira Mono"',
				fontWeight: '500',
			},
			monospace: {
				fontFamily: '"Lato"',
				fontWeight: '300',
			},
		},
		notAFontPath: {
			fontFamily: '"EB Garamond"',
			fontWeight: '700',
		},
	},
};

describe('useFonts', () => {
	it('should return googleFonts with correct families and weights', () => {
		const { googleFonts } = useFonts(ThemeSchemaMock);
		const fonts = googleFonts.value;

		expect(fonts).toContain('Roboto:wght@700');
		expect(fonts).toContain('Open+Sans:wght@700');
		expect(fonts).toContain('Lato:wght@300');
	});

	it('should not include local fonts in googleFonts', () => {
		const { googleFonts } = useFonts(ThemeSchemaMock);
		const fonts = googleFonts.value;
		expect(fonts.some((f) => f.startsWith('Fira+Mono'))).toBe(false);
	});

	it('should handle missing weights gracefully', () => {
		const theme = {
			rules: {
				fonts: {
					display: {
						fontFamily: '"Roboto"',
						// no weight
					},
				},
			},
		};

		const { googleFonts } = useFonts(theme);
		const fonts = googleFonts.value;
		// Default weight should be 400
		expect(fonts).toContain('Roboto:wght@400');
	});

	it('should ignore font families not wrapped in quotes', () => {
		const theme = {
			rules: {
				fonts: {
					display: {
						fontFamily: 'Roboto, Arial',
						fontWeight: '700',
					},
				},
			},
		};

		const { googleFonts } = useFonts(theme);
		const fonts = googleFonts.value;
		// Should not include unquoted font names
		expect(fonts.length).toBe(0);
	});

	it('should handle var() font families', () => {
		const theme = {
			rules: {
				fonts: {
					display: {
						fontFamily: 'var(--custom-font)',
						fontWeight: '700',
					},
				},
			},
		};

		const { googleFonts } = useFonts(theme);
		const fonts = googleFonts.value;
		// Should not include var() fonts in googleFonts
		expect(fonts.length).toBe(0);
	});

	it('should sort weights of the same font from lowest to highest', () => {
		const theme = {
			rules: {
				fonts: {
					display: {
						fontFamily: '"Roboto"',
						fontWeight: '900',
					},
					sans: {
						fontFamily: '"Roboto"',
						fontWeight: '100',
					},
					serif: {
						fontFamily: '"Roboto"',
						fontWeight: '400',
					},
				},
			},
		};

		const { googleFonts } = useFonts(theme);
		const fonts = googleFonts.value;
		const robotoEntry = fonts.find((f) => f.startsWith('Roboto:wght@'));
		expect(robotoEntry).toBe('Roboto:wght@100;400;900');
	});

	it('should convert multiple spaces in font names to pluses in googleFonts', () => {
		const theme = {
			rules: {
				fonts: {
					display: {
						fontFamily: '"Very Fancy Font"',
						fontWeight: '500',
					},
				},
			},
		};

		const { googleFonts } = useFonts(theme);
		const fonts = googleFonts.value;
		expect(fonts).toContain('Very+Fancy+Font:wght@500');
	});
});
