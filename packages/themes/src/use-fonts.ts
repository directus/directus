import { get } from 'lodash-es';
import type { MaybeRef } from 'vue';
import { computed, unref } from 'vue';
import type { Theme } from './schema.js';
import { ThemeSchema, TypeId } from './schema.js';

export const useFonts = (rules: MaybeRef<Theme>) => {
	const paths: string[][] = [];

	const find = (schema: Record<string, unknown>, path: string[] = []) => {
		for (const [key, value] of Object.entries(schema)) {
			if (typeof value === 'object' && value !== null) {
				if ('type' in value && value.type === 'object' && 'properties' in value) {
					find(value.properties as Record<string, unknown>, [...path, key]);
				}

				if ('$ref' in value && value.$ref === TypeId.FontFamily) {
					paths.push([...path, key]);
				}
			}
		}
	};

	find(ThemeSchema.properties.rules.properties);

	const fonts = computed(() => {
		const defs: string[] = [];

		for (const path of paths) {
			defs.push(get(unref(rules).rules, path).trim());
		}

		const fonts = new Set<string>();

		for (const def of defs) {
			const stack = def.split(',');
			stack.forEach((font) => fonts.add(font));
		}

		return Array.from(fonts);
	});

	const googleFonts = computed(() => {
		return fonts.value
			.filter((font) => {
				/**
				 * I (Rijk)'d like the definition to remain valid CSS, so we can't introduce new characters
				 * to differentiate. However, both `"font"` and `font` are valid font identifiers, so we
				 * could rely on the existence of `""` as a sneaky way to differentiate between Google Font
				 * and "regular" font.
				 *
				 * There's no way in JS to check what fonts exist, so we'll have to assume all custom fonts
				 * are coming from Google Fonts.
				 */

				if (font.startsWith('"') && font.endsWith('"') && font.includes('var(') === false) {
					/* While Inter/Merriweather/Fira Mono are Google Fonts, we ship them locally as they're
					 * used in the default theme. They shouldn't be double-loaded so they're filtered out here.
					 */
					const localFonts = ['Inter', 'Merriweather', 'Fira Mono'];

					if (localFonts.includes(font) || localFonts.map((font) => `"${font}"`).includes(font)) {
						return false;
					}

					return true;
				}

				return false;
			})
			.map((font) => {
				if (font.startsWith('"') && font.endsWith('"')) {
					font = font.slice(1, -1);
				}

				return font.replace(' ', '+');
			});
	});

	return { fonts, googleFonts };
};
