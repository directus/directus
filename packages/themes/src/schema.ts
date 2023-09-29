import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';

const Value = Type.Union([Type.String(), Type.Integer()]);

const Rules = Type.Object({
	foreground: Value,
	background: Value,
	navigation: Type.Object({
		background: Value,

		project: Type.Object({
			background: Value,
			foreground: Value,
		}),

		modules: Type.Object({
			background: Value,
			button: Type.Object({
				foreground: Value,
				background: Value,
				foregroundHover: Value,
				backgroundHover: Value,
				foregroundActive: Value,
				backgroundActive: Value,
			}),
		}),

		list: Type.Object({
			icon: Value,
			foreground: Value,
			background: Value,
			iconHover: Value,
			foregroundHover: Value,
			backgroundHover: Value,
			iconActive: Value,
			foregroundActive: Value,
			backgroundActive: Value,
		})
	}),
});

export const ThemeSchema = Type.Object({
	name: Type.String(),
	appearance: Type.Union([Type.Literal('light'), Type.Literal('dark')]),
	fonts: Type.Array(Type.String()),
	rules: Rules,
});

export type Theme = Static<typeof ThemeSchema>;
