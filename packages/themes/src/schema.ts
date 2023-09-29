import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';

const Appearance = Type.Union([Type.Literal('light'), Type.Literal('dark')]);

const Variables = Type.Record(Type.String(), Type.Union([Type.String(), Type.Integer()]));

const Value = Type.Union([Type.String(), Type.Integer(), Type.KeyOf(Variables)]);

const Rules = Type.Object({
	foreground: Value,
	background: Value,
	moduleBar: Type.Object({
		background: Value,
		button: Type.Object({
			foreground: Value,
			background: Value,
			foregroundHover: Value,
			backgroundHover: Value,
			foregroundActive: Value,
			backgroundActive: Value,
		})
	}),
});

export const ThemeSchema = Type.Object({
	name: Type.String(),
	appearance: Appearance,
	variables: Variables,
	rules: Rules,
});

export type Theme = Static<typeof ThemeSchema>;
