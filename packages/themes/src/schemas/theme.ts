import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';

const Color = Type.String({ $id: 'Color' });
const FamilyName = Type.String({ $id: 'FamilyName' });
const Length = Type.String({ $id: 'Length' });
const Percentage = Type.String({ $id: 'Percentage' });
const BoxShadow = Type.String({ $id: 'BoxShadow' });
const Number = Type.String({ $id: 'Number' });

const LineWidth = Type.Union([Type.String(), Type.Literal('thin'), Type.Literal('medium'), Type.Literal('thick')], {
	$id: 'LineWidth',
});

const Rules = Type.Object({
	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Base fonts
	fontFamilyDisplay: Type.Ref(FamilyName),
	fontFamilySansSerif: Type.Ref(FamilyName),
	fontFamilySerif: Type.Ref(FamilyName),
	fontFamilyMonospace: Type.Ref(FamilyName),

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Base border styles
	borderRadius: Type.Union([Type.Ref(Length), Type.Ref(Percentage)]),
	borderWidth: Type.Ref(LineWidth),

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Base color palette
	foreground: Type.Ref(Color),
	foregroundSubdued: Type.Ref(Color),
	foregroundAccent: Type.Ref(Color),

	background: Type.Ref(Color),

	backgroundNormal: Type.Ref(Color),
	backgroundAccent: Type.Ref(Color),
	backgroundSubdued: Type.Ref(Color),

	borderColor: Type.Ref(Color),
	borderColorAccent: Type.Ref(Color),
	borderColorSubdued: Type.Ref(Color),

	primary: Type.Ref(Color),
	primaryBackground: Type.Ref(Color),
	primarySubdued: Type.Ref(Color),
	primaryAccent: Type.Ref(Color),

	secondary: Type.Ref(Color),
	secondaryBackground: Type.Ref(Color),
	secondarySubdued: Type.Ref(Color),
	secondaryAccent: Type.Ref(Color),

	success: Type.Ref(Color),
	successBackground: Type.Ref(Color),
	successSubdued: Type.Ref(Color),
	successAccent: Type.Ref(Color),

	warning: Type.Ref(Color),
	warningBackground: Type.Ref(Color),
	warningSubdued: Type.Ref(Color),
	warningAccent: Type.Ref(Color),

	danger: Type.Ref(Color),
	dangerBackground: Type.Ref(Color),
	dangerSubdued: Type.Ref(Color),
	dangerAccent: Type.Ref(Color),

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Scopes
	navigation: Type.Object({
		background: Type.Ref(Color),
		backgroundAccent: Type.Ref(Color),

		borderWidth: Type.Ref(LineWidth),
		borderColor: Type.Ref(Color),

		project: Type.Object({
			background: Type.Ref(Color),
			foreground: Type.Ref(Color),
			fontFamily: Type.Ref(FamilyName),
			borderWidth: Type.Ref(LineWidth),
			borderColor: Type.Ref(Color),
		}),

		modules: Type.Object({
			background: Type.Ref(Color),
			borderWidth: Type.Ref(LineWidth),
			borderColor: Type.Ref(Color),

			button: Type.Object({
				foreground: Type.Ref(Color),
				foregroundHover: Type.Ref(Color),
				foregroundActive: Type.Ref(Color),

				background: Type.Ref(Color),
				backgroundHover: Type.Ref(Color),
				backgroundActive: Type.Ref(Color),
			}),
		}),

		list: Type.Object({
			icon: Type.Object({
				foreground: Type.Ref(Color),
				foregroundHover: Type.Ref(Color),
				foregroundActive: Type.Ref(Color),
			}),

			foreground: Type.Ref(Color),
			foregroundHover: Type.Ref(Color),
			foregroundActive: Type.Ref(Color),

			background: Type.Ref(Color),
			backgroundHover: Type.Ref(Color),
			backgroundActive: Type.Ref(Color),

			fontFamily: Type.Ref(FamilyName),

			divider: Type.Object({
				borderColor: Type.Ref(Color),
				borderWidth: Type.Ref(LineWidth),
			}),
		}),
	}),

	header: Type.Object({
		background: Type.Ref(Color),
		borderWidth: Type.Ref(LineWidth),
		borderColor: Type.Ref(Color),
		boxShadow: Type.Ref(BoxShadow),
		headline: Type.Object({
			foreground: Type.Ref(Color),
			fontFamily: Type.Ref(FamilyName),
		}),
		title: Type.Object({
			foreground: Type.Ref(Color),
			fontFamily: Type.Ref(FamilyName),
		}),
	}),

	form: Type.Object({
		field: Type.Object({
			label: Type.Object({
				foreground: Type.Ref(Color),
				fontFamily: Type.Ref(FamilyName),
			}),
			input: Type.Object({
				background: Type.Ref(Color),
				backgroundSubdued: Type.Ref(Color),

				foreground: Type.Ref(Color),
				foregroundSubdued: Type.Ref(Color),

				borderColor: Type.Ref(Color),
				borderColorHover: Type.Ref(Color),
				borderColorFocus: Type.Ref(Color),

				boxShadow: Type.Ref(BoxShadow),
				boxShadowHover: Type.Ref(BoxShadow),
				boxShadowFocus: Type.Ref(BoxShadow),
			}),
		}),
	}),

	sidebar: Type.Object({
		background: Type.Ref(Color),
		foreground: Type.Ref(Color),
		fontFamily: Type.Ref(FamilyName),
		borderWidth: Type.Ref(LineWidth),
		borderColor: Type.Ref(Color),

		section: Type.Object({
			toggle: Type.Object({
				icon: Type.Object({
					foreground: Type.Ref(Color),
					foregroundHover: Type.Ref(Color),
					foregroundActive: Type.Ref(Color),
				}),

				foreground: Type.Ref(Color),
				foregroundHover: Type.Ref(Color),
				foregroundActive: Type.Ref(Color),

				background: Type.Ref(Color),
				backgroundHover: Type.Ref(Color),
				backgroundActive: Type.Ref(Color),

				fontFamily: Type.Ref(FamilyName),

				borderWidth: Type.Ref(LineWidth),
				borderColor: Type.Ref(Color),
			}),
		}),
	}),

	public: Type.Object({
		background: Type.Ref(Color),
		foreground: Type.Ref(Color),
		foregroundAccent: Type.Ref(Color),

		art: Type.Object({
			background: Type.Ref(Color),
			primary: Type.Ref(Color),
			secondary: Type.Ref(Color),
			speed: Type.Ref(Number),
		}),

		form: Type.Object({
			field: Type.Object({
				input: Type.Object({
					background: Type.Ref(Color),
					foreground: Type.Ref(Color),
					foregroundSubdued: Type.Ref(Color),

					borderColor: Type.Ref(Color),
					borderColorHover: Type.Ref(Color),
					borderColorFocus: Type.Ref(Color),

					boxShadow: Type.Ref(BoxShadow),
					boxShadowHover: Type.Ref(BoxShadow),
					boxShadowFocus: Type.Ref(BoxShadow),
				}),
			}),
		}),
	}),
});

export const ThemeSchema = Type.Object({
	name: Type.String(),
	appearance: Type.Union([Type.Literal('light'), Type.Literal('dark')]),
	rules: Rules,
});

export const Definitions = {
	$defs: {
		Color,
		FamilyName,
		Length,
		Percentage,
		LineWidth,
		BoxShadow,
		Number,
	},
};

export type Theme = Static<typeof ThemeSchema>;
