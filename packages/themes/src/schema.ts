import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';

export const TypeId = {
	Color: 'color',
	Weight: 'weight',
};

const Color = Type.Ref(Type.String({ $id: TypeId.Color }));
// const Weight = Type.Integer({ $id: TypeId.Weight });

const Rules = Type.Object({
	foreground: Color,
	foregroundSubdued: Color,
	foregroundAccent: Color,

	background: Color,

	primary: Color,
	secondary: Color,
	success: Color,
	warning: Color,
	danger: Color,

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
	fonts: Type.Array(Type.String()),
	rules: Rules,
});

export const Definitions = { $defs: { [TypeId.Color]: Color } };

export type Theme = Static<typeof ThemeSchema>;
