import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';

export const TypeId = {
	Color: 'Color',
	FamilyName: 'FamilyName',
	Length: 'Length',
	Percentage: 'Percentage',
};

const Color = Type.Ref(Type.String({ $id: TypeId.Color }));
const FamilyName = Type.Ref(Type.String({ $id: TypeId.FamilyName }));
const Length = Type.Ref(Type.String({ $id: TypeId.Length }));
const Percentage = Type.Ref(Type.String({ $id: TypeId.Percentage }));

const Rules = Type.Object({
	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Base color palette
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

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Base fonts
	fontFamilyDisplay: FamilyName,
	fontFamilySansSerif: FamilyName,
	fontFamilySerif: FamilyName,
	fontFamilyMonospace: FamilyName,

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Base border styles
	borderRadius: Type.Union([Length, Percentage]),

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Scopes
	navigation: Type.Object({
		background: Color,

		project: Type.Object({
			background: Color,
			foreground: Color,
			fontFamily: FamilyName,
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

			fontFamily: FamilyName,
		}),
	}),

	header: Type.Object({
		background: Color,
		headline: Type.Object({
			foreground: Color,
			fontFamily: FamilyName,
		}),
		title: Type.Object({
			foreground: Color,
			fontFamily: FamilyName,
		}),
	}),

	form: Type.Object({
		field: Type.Object({
			label: Type.Object({
				foreground: Color,
				fontFamily: FamilyName,
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
		fontFamily: FamilyName,

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

				fontFamily: FamilyName,
			}),
		}),
	}),
});

export const ThemeSchema = Type.Object({
	name: Type.String(),
	appearance: Type.Union([Type.Literal('light'), Type.Literal('dark')]),
	rules: Rules,
});

export const Definitions = { $defs: { [TypeId.Color]: Color, [TypeId.FamilyName]: FamilyName } };

export type Theme = Static<typeof ThemeSchema>;
