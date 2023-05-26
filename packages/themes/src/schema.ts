import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';

/** CSS color value, f.e. hex, rgba, hsl */
const Color = Type.String();

/** CSS size, f.e. px, em, % */
const Size = Type.String();

/** CSS font weight, f.e. 700, bold */
const FontWeight = Type.Integer();

/** CSS font family, f.e. 'Comic Sans, MS', 'Roboto' */
const FontFamily = Type.String();

export const ThemeSchema = Type.Object({
	name: Type.String(),
	type: Type.Union([Type.Literal('light'), Type.Literal('dark')]),
	rules: Type.Object({
		foreground: Color,

		'header.foreground': Color,
		'header.title.family': FontFamily,
		'header.title.weight': FontWeight,
		'header.title.size': Size,
	}),
});

export type Theme = Static<typeof ThemeSchema>;
