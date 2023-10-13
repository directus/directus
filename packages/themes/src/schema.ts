import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';

export const TypeId = {
	Color: 'Color',
	FontFamily: 'FontFamily',
};

const Color = Type.Ref(Type.String({ $id: TypeId.Color }));
const FontFamily = Type.Ref(Type.String({ $id: TypeId.FontFamily }));

const Rules = Type.Object({
	foreground: Color,
	foregroundSubdued: Color,
	foregroundAccent: Color,

	background: Color,

	primary: Color,
	primaryBackground: Color,
	primarySubdued: Color,
	primaryAccent: Color,

	secondary: Color,
	secondaryBackground: Color,
	secondarySubdued: Color,
	secondaryAccent: Color,

	success: Color,
	successBackground: Color,
	successSubdued: Color,
	successAccent: Color,

	warning: Color,
	warningBackground: Color,
	warningSubdued: Color,
	warningAccent: Color,

	danger: Color,
	dangerBackground: Color,
	dangerSubdued: Color,
	dangerAccent: Color,

	fontFamilyDisplay: FontFamily,
	fontFamilySansSerif: FontFamily,
	fontFamilySerif: FontFamily,
	fontFamilyMonospace: FontFamily,

	navigation: Type.Object({
		background: Color,

		project: Type.Object({
			background: Color,
			foreground: Color,
		}),

		modules: Type.Object({
			background: Color,
			button: Type.Object({
				foreground: Color,
				foregroundHover: Color,
				foregroundActive: Color,

				background: Color,
				backgroundHover: Color,
				backgroundActive: Color,
			}),
		}),

		list: Type.Object({
			icon: Type.Object({
				foreground: Color,
				foregroundHover: Color,
				foregroundActive: Color,
			}),

			foreground: Color,
			foregroundHover: Color,
			foregroundActive: Color,

			background: Color,
			backgroundHover: Color,
			backgroundActive: Color,
		}),
	}),

	header: Type.Object({
		background: Color,
		headline: Type.Object({
			foreground: Color,
		}),
		title: Type.Object({
			foreground: Color,
			fontFamily: FontFamily,
		}),
	}),

	form: Type.Object({
		field: Type.Object({
			label: Type.Object({
				foreground: Color,
			}),
			input: Type.Object({
				background: Color,
				foreground: Color,
				foregroundSubdued: Color,
			}),
		}),
	}),

	sidebar: Type.Object({
		background: Color,
		foreground: Color,

		section: Type.Object({
			toggle: Type.Object({
				icon: Type.Object({
					foreground: Color,
					foregroundHover: Color,
					foregroundActive: Color,
				}),

				foreground: Color,
				foregroundHover: Color,
				foregroundActive: Color,

				background: Color,
				backgroundHover: Color,
				backgroundActive: Color,
			}),
		}),
	}),
});

export const ThemeSchema = Type.Object({
	name: Type.String(),
	appearance: Type.Union([Type.Literal('light'), Type.Literal('dark')]),
	rules: Rules,
});

export const Definitions = { $defs: { [TypeId.Color]: Color, [TypeId.FontFamily]: FontFamily } };

export type Theme = Static<typeof ThemeSchema>;
