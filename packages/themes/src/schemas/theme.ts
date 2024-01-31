import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';

const Color = Type.String({ $id: 'Color' });
const FamilyName = Type.String({ $id: 'FamilyName' });
const FontWeight = Type.String({ $id: 'FontWeight' });
const Length = Type.String({ $id: 'Length' });
const Percentage = Type.String({ $id: 'Percentage' });
const BoxShadow = Type.String({ $id: 'BoxShadow' });
const Number = Type.String({ $id: 'Number' });
const Size = Type.String({ $id: 'Size' });

const LineWidth = Type.Union([Type.String(), Type.Literal('thin'), Type.Literal('medium'), Type.Literal('thick')], {
	$id: 'LineWidth',
});

const FormRules = Type.Optional(
	Type.Object({
		columnGap: Type.Optional(Type.Union([Type.Ref(Length), Type.Ref(Percentage)])),
		rowGap: Type.Optional(Type.Union([Type.Ref(Length), Type.Ref(Percentage)])),
		field: Type.Optional(
			Type.Object({
				label: Type.Optional(
					Type.Object({
						foreground: Type.Optional(Type.Ref(Color)),
						fontFamily: Type.Optional(Type.Ref(FamilyName)),
						fontWeight: Type.Optional(Type.Ref(FontWeight)),
					}),
				),
				input: Type.Optional(
					Type.Object({
						background: Type.Optional(Type.Ref(Color)),
						backgroundSubdued: Type.Optional(Type.Ref(Color)),

						foreground: Type.Optional(Type.Ref(Color)),
						foregroundSubdued: Type.Optional(Type.Ref(Color)),

						borderColor: Type.Optional(Type.Ref(Color)),
						borderColorHover: Type.Optional(Type.Ref(Color)),
						borderColorFocus: Type.Optional(Type.Ref(Color)),

						boxShadow: Type.Optional(Type.Ref(BoxShadow)),
						boxShadowHover: Type.Optional(Type.Ref(BoxShadow)),
						boxShadowFocus: Type.Optional(Type.Ref(BoxShadow)),

						height: Type.Optional(Type.Ref(Size)),
						padding: Type.Optional(Type.Union([Type.Ref(Length), Type.Ref(Percentage)])),
					}),
				),
			}),
		),
	}),
);

const Rules = Type.Object({
	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Base border styles
	borderRadius: Type.Optional(Type.Union([Type.Ref(Length), Type.Ref(Percentage)])),
	borderWidth: Type.Optional(Type.Ref(LineWidth)),

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Base color palette
	foreground: Type.Optional(Type.Ref(Color)),
	foregroundSubdued: Type.Optional(Type.Ref(Color)),
	foregroundAccent: Type.Optional(Type.Ref(Color)),

	background: Type.Optional(Type.Ref(Color)),

	backgroundNormal: Type.Optional(Type.Ref(Color)),
	backgroundAccent: Type.Optional(Type.Ref(Color)),
	backgroundSubdued: Type.Optional(Type.Ref(Color)),

	borderColor: Type.Optional(Type.Ref(Color)),
	borderColorAccent: Type.Optional(Type.Ref(Color)),
	borderColorSubdued: Type.Optional(Type.Ref(Color)),

	primary: Type.Optional(Type.Ref(Color)),
	primaryBackground: Type.Optional(Type.Ref(Color)),
	primarySubdued: Type.Optional(Type.Ref(Color)),
	primaryAccent: Type.Optional(Type.Ref(Color)),

	secondary: Type.Optional(Type.Ref(Color)),
	secondaryBackground: Type.Optional(Type.Ref(Color)),
	secondarySubdued: Type.Optional(Type.Ref(Color)),
	secondaryAccent: Type.Optional(Type.Ref(Color)),

	success: Type.Optional(Type.Ref(Color)),
	successBackground: Type.Optional(Type.Ref(Color)),
	successSubdued: Type.Optional(Type.Ref(Color)),
	successAccent: Type.Optional(Type.Ref(Color)),

	warning: Type.Optional(Type.Ref(Color)),
	warningBackground: Type.Optional(Type.Ref(Color)),
	warningSubdued: Type.Optional(Type.Ref(Color)),
	warningAccent: Type.Optional(Type.Ref(Color)),

	danger: Type.Optional(Type.Ref(Color)),
	dangerBackground: Type.Optional(Type.Ref(Color)),
	dangerSubdued: Type.Optional(Type.Ref(Color)),
	dangerAccent: Type.Optional(Type.Ref(Color)),

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Base fonts
	fonts: Type.Optional(
		Type.Object({
			display: Type.Optional(
				Type.Object({
					fontFamily: Type.Optional(Type.Ref(FamilyName)),
					fontWeight: Type.Optional(Type.Ref(FontWeight)),
				}),
			),
			sans: Type.Optional(
				Type.Object({
					fontFamily: Type.Optional(Type.Ref(FamilyName)),
					fontWeight: Type.Optional(Type.Ref(FontWeight)),
				}),
			),
			serif: Type.Optional(
				Type.Object({
					fontFamily: Type.Optional(Type.Ref(FamilyName)),
					fontWeight: Type.Optional(Type.Ref(FontWeight)),
				}),
			),
			monospace: Type.Optional(
				Type.Object({
					fontFamily: Type.Optional(Type.Ref(FamilyName)),
					fontWeight: Type.Optional(Type.Ref(FontWeight)),
				}),
			),
		}),
	),

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Scopes
	navigation: Type.Optional(
		Type.Object({
			background: Type.Optional(Type.Ref(Color)),
			backgroundAccent: Type.Optional(Type.Ref(Color)),

			borderWidth: Type.Optional(Type.Ref(LineWidth)),
			borderColor: Type.Optional(Type.Ref(Color)),

			project: Type.Optional(
				Type.Object({
					background: Type.Optional(Type.Ref(Color)),
					foreground: Type.Optional(Type.Ref(Color)),
					fontFamily: Type.Optional(Type.Ref(FamilyName)),
					borderWidth: Type.Optional(Type.Ref(LineWidth)),
					borderColor: Type.Optional(Type.Ref(Color)),
				}),
			),

			modules: Type.Optional(
				Type.Object({
					background: Type.Optional(Type.Ref(Color)),
					borderWidth: Type.Optional(Type.Ref(LineWidth)),
					borderColor: Type.Optional(Type.Ref(Color)),

					button: Type.Optional(
						Type.Object({
							foreground: Type.Optional(Type.Ref(Color)),
							foregroundHover: Type.Optional(Type.Ref(Color)),
							foregroundActive: Type.Optional(Type.Ref(Color)),

							background: Type.Optional(Type.Ref(Color)),
							backgroundHover: Type.Optional(Type.Ref(Color)),
							backgroundActive: Type.Optional(Type.Ref(Color)),
						}),
					),
				}),
			),

			list: Type.Optional(
				Type.Object({
					icon: Type.Optional(
						Type.Object({
							foreground: Type.Optional(Type.Ref(Color)),
							foregroundHover: Type.Optional(Type.Ref(Color)),
							foregroundActive: Type.Optional(Type.Ref(Color)),
						}),
					),

					foreground: Type.Optional(Type.Ref(Color)),
					foregroundHover: Type.Optional(Type.Ref(Color)),
					foregroundActive: Type.Optional(Type.Ref(Color)),

					background: Type.Optional(Type.Ref(Color)),
					backgroundHover: Type.Optional(Type.Ref(Color)),
					backgroundActive: Type.Optional(Type.Ref(Color)),

					fontFamily: Type.Optional(Type.Ref(FamilyName)),

					divider: Type.Object({
						borderColor: Type.Optional(Type.Ref(Color)),
						borderWidth: Type.Optional(Type.Ref(LineWidth)),
					}),
				}),
			),
		}),
	),

	header: Type.Optional(
		Type.Object({
			background: Type.Optional(Type.Ref(Color)),
			borderWidth: Type.Optional(Type.Ref(LineWidth)),
			borderColor: Type.Optional(Type.Ref(Color)),
			boxShadow: Type.Optional(Type.Ref(BoxShadow)),
			headline: Type.Optional(
				Type.Object({
					foreground: Type.Optional(Type.Ref(Color)),
					fontFamily: Type.Optional(Type.Ref(FamilyName)),
				}),
			),
			title: Type.Optional(
				Type.Object({
					foreground: Type.Optional(Type.Ref(Color)),
					fontFamily: Type.Optional(Type.Ref(FamilyName)),
					fontWeight: Type.Optional(Type.Ref(FontWeight)),
				}),
			),
		}),
	),

	form: FormRules,

	sidebar: Type.Optional(
		Type.Object({
			background: Type.Optional(Type.Ref(Color)),
			foreground: Type.Optional(Type.Ref(Color)),
			fontFamily: Type.Optional(Type.Ref(FamilyName)),
			borderWidth: Type.Optional(Type.Ref(LineWidth)),
			borderColor: Type.Optional(Type.Ref(Color)),

			section: Type.Optional(
				Type.Object({
					toggle: Type.Optional(
						Type.Object({
							icon: Type.Optional(
								Type.Object({
									foreground: Type.Optional(Type.Ref(Color)),
									foregroundHover: Type.Optional(Type.Ref(Color)),
									foregroundActive: Type.Optional(Type.Ref(Color)),
								}),
							),

							foreground: Type.Optional(Type.Ref(Color)),
							foregroundHover: Type.Optional(Type.Ref(Color)),
							foregroundActive: Type.Optional(Type.Ref(Color)),

							background: Type.Optional(Type.Ref(Color)),
							backgroundHover: Type.Optional(Type.Ref(Color)),
							backgroundActive: Type.Optional(Type.Ref(Color)),

							fontFamily: Type.Optional(Type.Ref(FamilyName)),

							borderWidth: Type.Optional(Type.Ref(LineWidth)),
							borderColor: Type.Optional(Type.Ref(Color)),
						}),
					),

					form: FormRules,
				}),
			),
		}),
	),

	public: Type.Optional(
		Type.Object({
			background: Type.Optional(Type.Ref(Color)),
			foreground: Type.Optional(Type.Ref(Color)),
			foregroundAccent: Type.Optional(Type.Ref(Color)),

			art: Type.Optional(
				Type.Object({
					background: Type.Optional(Type.Ref(Color)),
					primary: Type.Optional(Type.Ref(Color)),
					secondary: Type.Optional(Type.Ref(Color)),
					speed: Type.Optional(Type.Ref(Number)),
				}),
			),

			form: FormRules,
		}),
	),

	popover: Type.Optional(
		Type.Object({
			menu: Type.Optional(
				Type.Object({
					background: Type.Optional(Type.Ref(Color)),
					borderRadius: Type.Optional(Type.Optional(Type.Union([Type.Ref(Length), Type.Ref(Percentage)]))),
					boxShadow: Type.Optional(Type.Ref(BoxShadow)),
				}),
			),
		}),
	),
});

export const ThemeSchema = Type.Object({
	id: Type.String(),
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
		Size,
		Number,
	},
};

export type Theme = Static<typeof ThemeSchema>;
