import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';

const Rules = Type.Object(
	{
		fontFamilySansSerif: Type.String(),
		foreground: Type.String(),
		background: Type.String(),
		moduleBar: Type.Object({
			background: Type.String(),
			button: Type.Object({
				foreground: Type.String(),
				background: Type.String(),
				foregroundHover: Type.String(),
				backgroundHover: Type.String(),
				foregroundActive: Type.String(),
				backgroundActive: Type.String(),
			}),
		}),
	},
);

export const ThemeSchema = Type.Object({
	name: Type.String(),
	appearance: Type.Union([Type.Literal('light'), Type.Literal('dark')]),
	fonts: Type.Array(Type.String()),
	rules: Rules,
});

export type Theme = Static<typeof ThemeSchema>;
