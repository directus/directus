import { z } from 'zod';

const Color = z.string();
const FamilyName = z.string().meta({ $ref: 'FamilyName' });
const FontWeight = z.string().meta({ $ref: 'FontWeight' });
const Length = z.string();
const Percentage = z.string();
const BoxShadow = z.string();
const Number = z.string();
const Size = z.string();

const LineWidth = z.union([z.string(), z.literal('thin'), z.literal('medium'), z.literal('thick')]);

const FormRules = z
	.object({
		columnGap: z.union([Length, Percentage]).optional(),
		rowGap: z.union([Length, Percentage]).optional(),
		field: z
			.object({
				label: z
					.object({
						foreground: Color.optional(),
						fontFamily: FamilyName.optional(),
						fontWeight: FontWeight.optional(),
					})
					.optional(),
				input: z
					.object({
						background: Color.optional(),
						backgroundSubdued: Color.optional(),

						foreground: Color.optional(),
						foregroundSubdued: Color.optional(),

						borderColor: Color.optional(),
						borderColorHover: Color.optional(),
						borderColorFocus: Color.optional(),

						boxShadow: BoxShadow.optional(),
						boxShadowHover: BoxShadow.optional(),
						boxShadowFocus: BoxShadow.optional(),

						height: Size.optional(),
						padding: z.union([Length, Percentage]).optional(),
					})
					.optional(),
			})
			.optional(),
	})
	.optional();

const Rules = z.object({
	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Base border styles
	borderRadius: z.union([Length, Percentage]).optional(),
	borderWidth: LineWidth.optional(),

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Base color palette
	foreground: Color.optional(),
	foregroundSubdued: Color.optional(),
	foregroundAccent: Color.optional(),

	background: Color.optional(),

	backgroundNormal: Color.optional(),
	backgroundAccent: Color.optional(),
	backgroundSubdued: Color.optional(),

	borderColor: Color.optional(),
	borderColorAccent: Color.optional(),
	borderColorSubdued: Color.optional(),

	primary: Color.optional(),
	primaryBackground: Color.optional(),
	primarySubdued: Color.optional(),
	primaryAccent: Color.optional(),

	secondary: Color.optional(),
	secondaryBackground: Color.optional(),
	secondarySubdued: Color.optional(),
	secondaryAccent: Color.optional(),

	success: Color.optional(),
	successBackground: Color.optional(),
	successSubdued: Color.optional(),
	successAccent: Color.optional(),

	warning: Color.optional(),
	warningBackground: Color.optional(),
	warningSubdued: Color.optional(),
	warningAccent: Color.optional(),

	danger: Color.optional(),
	dangerBackground: Color.optional(),
	dangerSubdued: Color.optional(),
	dangerAccent: Color.optional(),

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Base fonts
	fonts: z
		.object({
			display: z
				.object({
					fontFamily: FamilyName.optional(),
					fontWeight: FontWeight.optional(),
				})
				.optional(),
			sans: z
				.object({
					fontFamily: FamilyName.optional(),
					fontWeight: FontWeight.optional(),
				})
				.optional(),
			serif: z
				.object({
					fontFamily: FamilyName.optional(),
					fontWeight: FontWeight.optional(),
				})
				.optional(),
			monospace: z
				.object({
					fontFamily: FamilyName.optional(),
					fontWeight: FontWeight.optional(),
				})
				.optional(),
		})
		.optional(),

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Scopes
	navigation: z
		.object({
			background: Color.optional(),
			backgroundAccent: Color.optional(),

			borderWidth: LineWidth.optional(),
			borderColor: Color.optional(),

			project: z
				.object({
					background: Color.optional(),
					foreground: Color.optional(),
					fontFamily: FamilyName.optional(),
					borderWidth: LineWidth.optional(),
					borderColor: Color.optional(),
				})
				.optional(),

			modules: z
				.object({
					background: Color.optional(),
					borderWidth: LineWidth.optional(),
					borderColor: Color.optional(),

					button: z
						.object({
							foreground: Color.optional(),
							foregroundHover: Color.optional(),
							foregroundActive: Color.optional(),

							background: Color.optional(),
							backgroundHover: Color.optional(),
							backgroundActive: Color.optional(),
						})
						.optional(),
				})
				.optional(),

			list: z
				.object({
					icon: z
						.object({
							foreground: Color.optional(),
							foregroundHover: Color.optional(),
							foregroundActive: Color.optional(),
						})
						.optional(),

					foreground: Color.optional(),
					foregroundHover: Color.optional(),
					foregroundActive: Color.optional(),

					background: Color.optional(),
					backgroundHover: Color.optional(),
					backgroundActive: Color.optional(),

					fontFamily: FamilyName.optional(),

					divider: z.object({
						borderColor: Color.optional(),
						borderWidth: LineWidth.optional(),
					}),
				})
				.optional(),
		})
		.optional(),

	header: z
		.object({
			background: Color.optional(),
			borderWidth: LineWidth.optional(),
			borderColor: Color.optional(),
			boxShadow: BoxShadow.optional(),
			headline: z
				.object({
					foreground: Color.optional(),
					fontFamily: FamilyName.optional(),
				})
				.optional(),
			title: z
				.object({
					foreground: Color.optional(),
					fontFamily: FamilyName.optional(),
					fontWeight: FontWeight.optional(),
				})
				.optional(),
		})
		.optional(),

	form: FormRules,

	sidebar: z
		.object({
			background: Color.optional(),
			foreground: Color.optional(),
			fontFamily: FamilyName.optional(),
			borderWidth: LineWidth.optional(),
			borderColor: Color.optional(),

			section: z
				.object({
					toggle: z
						.object({
							icon: z
								.object({
									foreground: Color.optional(),
									foregroundHover: Color.optional(),
									foregroundActive: Color.optional(),
								})
								.optional(),

							foreground: Color.optional(),
							foregroundHover: Color.optional(),
							foregroundActive: Color.optional(),

							background: Color.optional(),
							backgroundHover: Color.optional(),
							backgroundActive: Color.optional(),

							fontFamily: FamilyName.optional(),

							borderWidth: LineWidth.optional(),
							borderColor: Color.optional(),
						})
						.optional(),

					form: FormRules,
				})
				.optional(),
		})
		.optional(),

	public: z
		.object({
			background: Color.optional(),
			foreground: Color.optional(),
			foregroundAccent: Color.optional(),

			art: z
				.object({
					background: Color.optional(),
					primary: Color.optional(),
					secondary: Color.optional(),
					speed: Number.optional(),
				})
				.optional(),

			form: FormRules,
		})
		.optional(),

	popover: z
		.object({
			menu: z
				.object({
					background: Color.optional(),
					borderRadius: z.union([Length, Percentage]).optional(),
					boxShadow: BoxShadow.optional(),
				})
				.optional(),
		})
		.optional(),

	banner: z
		.object({
			background: Color.optional(),
			padding: z.union([Length, Percentage]).optional(),
			borderRadius: z.union([Length, Percentage]).optional(),

			avatar: z
				.object({
					background: Color.optional(),
					foreground: Color.optional(),
					borderRadius: z.union([Length, Percentage]).optional(),
				})
				.optional(),

			headline: z
				.object({
					foreground: Color.optional(),
					fontFamily: FamilyName.optional(),
					fontWeight: FontWeight.optional(),
				})
				.optional(),

			title: z
				.object({
					foreground: Color.optional(),
					fontFamily: FamilyName.optional(),
					fontWeight: FontWeight.optional(),
				})
				.optional(),

			subtitle: z
				.object({
					foreground: Color.optional(),
					fontFamily: FamilyName.optional(),
					fontWeight: FontWeight.optional(),
				})
				.optional(),

			art: z
				.object({
					foreground: Color.optional(),
				})
				.optional(),
		})
		.optional(),
});

export const ThemeSchema = z.object({
	id: z.string(),
	name: z.string(),
	appearance: z.union([z.literal('light'), z.literal('dark')]),
	rules: Rules,
});

export type Theme = z.infer<typeof ThemeSchema>;
