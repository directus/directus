import Joi from 'joi';
import { Theme } from '@directus/shared/types';

/**
 * The following Joi definitions align with the theme
 * type definition in shared > types > theme.ts
 */

// Matches hex values i.e. #000000
const hex = Joi.string()
	.trim()
	.pattern(/^#(([\da-fA-F]{3}){1,2})$/, 'Hexadecimal color');
// Matched css variable references i.e. var(--g-color-background-normal)
const link = Joi.string()
	.trim()
	.pattern(/^var\(\s*--[-\w]+\s*\)$/, 'CSS variable link');

// Arrays of strings. Will be joined by commas on style generation.
const list = Joi.array().items(Joi.string());

const baseColorVariants = Joi.object({
	normal: Joi.alternatives([hex, link]),
	accent: Joi.alternatives([hex, link]),
	subtle: Joi.alternatives([hex, link]),
});

const globalSettings = Joi.object({
	font: Joi.object({
		family: Joi.object({
			sans: Joi.alternatives([Joi.string(), list]),
			serif: Joi.alternatives([Joi.string(), list]),
			mono: Joi.alternatives([Joi.string(), list]),
		}),
	}),
	color: Joi.object({
		primary: baseColorVariants,
		secondary: baseColorVariants,
		success: baseColorVariants,
		warning: baseColorVariants,
		danger: baseColorVariants,
		foreground: baseColorVariants.append({
			invert: Joi.alternatives([hex, link]),
		}),
		background: baseColorVariants.append({
			page: Joi.alternatives([hex, link]),
			invert: Joi.alternatives([hex, link]),
		}),
		border: baseColorVariants,
	}),
	border: Joi.object({
		width: Joi.number().min(0).max(16),
		radius: Joi.number().min(0).max(64),
	}),
});

const subProperty = Joi.object()
	.pattern(/./, Joi.alternatives([Joi.string(), Joi.number(), hex, link, list, Joi.link('#subProperty')]))
	.id('subProperty');

const componentSettings = Joi.object().pattern(/./, subProperty);

const themeSettings = Joi.object({
	global: globalSettings,
	components: componentSettings,
});

const themeList = Joi.object().pattern(/./, themeSettings);

export function isValidThemeJson(themeJson: Record<any, Theme['theme']>) {
	const { error } = themeList.validate(themeJson, { abortEarly: true });
	return error;
}
