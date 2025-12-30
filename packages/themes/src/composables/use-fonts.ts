import type { DeepPartial, Theme } from '@directus/types';
import { ThemeSchema } from '@directus/types';
import { cssVar } from '@directus/utils/browser';
import { get } from 'lodash-es';
import type { MaybeRef } from 'vue';
import { computed, unref } from 'vue';

export const useFonts = (theme: MaybeRef<Theme | DeepPartial<Theme>>) => {
	const paths = computed(() => {
		const paths: Map<string[], { family: string | null; weight: string | null }> = new Map();

		const find = (schema: Record<string, unknown>, path: string[] = []) => {
			for (const [key, value] of Object.entries(schema)) {
				if (typeof value === 'object' && value !== null) {
					if ('type' in value && value.type === 'object' && 'properties' in value) {
						find(value.properties as Record<string, unknown>, [...path, key]);
					}

					if ('$ref' in value && value.$ref === 'FamilyName') {
						if (paths.has(path)) {
							paths.set(path, { family: key, weight: paths.get(path)!.weight });
						} else {
							paths.set(path, { family: key, weight: null });
						}
					}

					if ('$ref' in value && value.$ref === 'FontWeight') {
						if (paths.has(path)) {
							paths.set(path, { family: paths.get(path)!.family, weight: key });
						} else {
							paths.set(path, { family: null, weight: key });
						}
					}
				}
			}
		};

		find(ThemeSchema.properties.rules.properties);

		return paths;
	});

	const fonts = computed(() => {
		/** [family, weight] */
		const defs: Map<string, Set<string>> = new Map();

		for (const [path, { family, weight }] of paths.value.entries()) {
			let familyDefinition = null;
			let weightDefinition = null;

			if (family) {
				familyDefinition = get(unref(theme).rules, [...path, family]) as string;
			}

			if (weight) {
				weightDefinition = get(unref(theme).rules, [...path, weight]) as string;
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
