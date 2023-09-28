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

const Appearance = Type.Union([Type.Literal('light'), Type.Literal('dark')]);

const Variables = Type.Record(Type.String(), Type.Union([Color, Size, FontWeight, FontFamily]));

const Rules = Type.Object({
	foreground: Type.Union([Color, Type.KeyOf(Variables)]),
	moduleBar: Type.Object({
		foreground: Type.Union([Color, Type.KeyOf(Variables)]),
		background: Type.Union([Color, Type.KeyOf(Variables)]),
	}),
});

export const ThemeSchema = Type.Object({
	name: Type.String(),
	appearance: Appearance,
	variables: Variables,
	rules: Rules,
});

export type Theme = Static<typeof ThemeSchema>;
