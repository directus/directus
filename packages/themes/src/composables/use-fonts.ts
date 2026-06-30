import type { DeepPartial, Theme } from '@directus/types';
import { ThemeSchema } from '@directus/types';
import { cssVar } from '@directus/utils/browser';
import { get } from 'lodash-es';
import type { MaybeRef } from 'vue';
import { computed, unref } from 'vue';
import { ZodObject, ZodOptional, ZodString, ZodUnion } from 'zod';

export const useFonts = (theme: MaybeRef<Theme | DeepPartial<Theme>>) => {
	const paths = computed(() => {
		const paths: Map<string, { family: string | null; weight: string | null }> = new Map();

		const find = (schema: unknown, path: string[] = []) => {
			if (schema instanceof ZodObject) {
				for (const [key, value] of Object.entries(schema.shape)) {
					find(value, [...path, key]);
				}
			} else if (schema instanceof ZodOptional) {
				find(schema.def.innerType, path);
			} else if (schema instanceof ZodUnion) {
				for (const option of schema.options) {
					find(option, path);
				}
			} else if (schema instanceof ZodString) {
				const parentPath = path.slice(0, -1).join('.');
				const key = path.at(-1)!;

				if (schema.meta()?.['$ref'] === 'FamilyName') {
					if (paths.has(parentPath)) {
						paths.set(parentPath, { family: key, weight: paths.get(parentPath)!.weight });
					} else {
						paths.set(parentPath, { family: key, weight: null });
					}
				} else if (schema.meta()?.['$ref'] === 'FontWeight') {
					if (paths.has(parentPath)) {
						paths.set(parentPath, { family: paths.get(parentPath)!.family, weight: key });
					} else {
						paths.set(parentPath, { family: null, weight: key });
					}
				}
			}
		};

		find(ThemeSchema.shape.rules);

		return paths;
	});

	const fonts = computed(() => {
		/** [family, weight] */
		const defs: Map<string, Set<string>> = new Map();

		for (const [path, { family, weight }] of paths.value.entries()) {
			let familyDefinition: string | null = null;
			let weightDefinition: string | null = null;
			const pathParts = path.split('.');

			if (family) {
				familyDefinition = get(unref(theme).rules, [...pathParts, family]);
			}

			if (weight) {
				weightDefinition = get(unref(theme).rules, [...pathParts, weight]);
			}

			if (familyDefinition) {
				const stack = familyDefinition.split(',');

				for (const def of stack) {
					const trimmed = def.trim();

					if (trimmed.startsWith('var(--')) {
						stack.push(cssVar(trimmed.slice(6, -1)));
						continue;
					}

					if ((trimmed.startsWith('"') && trimmed.endsWith('"')) === false) {
						continue;
					}

					const noQuotes = trimmed.slice(1, -1);

					if (defs.has(noQuotes)) {
						defs.get(noQuotes)!.add(weightDefinition ?? '400');
					} else {
						defs.set(noQuotes, new Set([weightDefinition ?? '400']));
					}
				}
			}
		}

		return defs;
	});

	const googleFonts = computed(() => {
		const families: string[] = [];

		for (const [family, weights] of fonts.value.entries()) {
			const localFonts = ['Inter', 'Merriweather', 'Fira Mono'];

			if (localFonts.includes(family) === false) {
				const weightsParam = Array.from(weights)
					.sort((a, b) => Number(a) - Number(b))
					.join(';');

				families.push(`${family.replaceAll(' ', '+')}:wght@${weightsParam}`);
			}
		}

		return families;
	});

	return { googleFonts };
};
