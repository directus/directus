import { Theme } from '@directus/shared/types';
import Color from 'color';
import { flatten } from 'flat';
import { get, isArray, mergeWith } from 'lodash';

const hexRegex = /^#[0-9a-f]{1,6}/i;

// Convert object to keys of flattened object paths, and values of valid CSS strings
function resolveCSSValues(object: Record<any, any> = {}, prefix = '', suffix = '', join = '-') {
	/** First we'll flatten object */
	const flatObj: Record<string, any> = flatten(object, {
		delimiter: join,
		safe: true, // Preserve array keys
	});

	/** Map the object to an array, add prefix/suffix */
	const cssVars: string[] = Object.keys(flatObj).map((key) => {
		let value = flatObj[key];
		// Concatenate arrays
		if (isArray(value)) {
			value = value.join(', ');
		}
		// Convert numbers to pixel values
		else if (!isNaN(parseFloat(value))) {
			value = `${value}px`;
		} else {
			try {
				const valAsColor = Color(value);
				value = valAsColor.hex().toUpperCase();
			} catch {
				// Color errored out, don't change value to hex
			}
		}
		return `${prefix}${key}: ${value}${suffix}`;
	});

	return cssVars;
}

// Output text block of CSS variables
export function resolveThemeVariables(theme: Theme['theme']): string {
	const outputVariables: string[] = [];

	if (theme.global) {
		/** Resolve all global variables first, prepend --g- */
		outputVariables.push(...resolveCSSValues(theme.global, '--g-', ';', '-'));
	}
	if (theme.components) {
		/** Next, resolve the components variables */
		outputVariables.push(...resolveCSSValues(theme.components, '--', ';', '-'));
	}

	// Join variables
	return outputVariables.join('\n');
}

// Convert object to keys of flattened object paths, and values of string | number
export function resolveFieldValues(object: Record<any, any> = {}) {
	const flatObj: Record<string, any> = flatten(object, { safe: true });

	const values = Object.keys(flatObj).reduce<Record<string, any>>((acc, key) => {
		// If value is array, return first item
		if (isArray(flatObj[key])) {
			acc[key] = flatObj[key][0];
		} else {
			acc[key] = flatObj[key];
		}
		return acc;
	}, {});

	return values;
}

/**
 * Using variable font weight ranges, Google fonts will return an error if the
 * range is outside of the capabilities of the font. So we need to make sure
 * we're retrieving the appropriate ranges.
 *
 * Hardcoding this isn't ideal. However, in order to populate these automatically
 * we'll need to build out a solution to parse the metadata retrieved from
 * https://fonts.google.com/metadata/font/Font+Name.
 *
 * For the time being, font choices are limited to the variable fonts whose usable
 * range is listed here. Note that this isn't the full range of some of the fonts,
 * rather the range that best fits Directus's use of 300-800 font weights.
 */
const fontWeightRange: Record<string, string> = {
	Inter: '300..800',
	'Open Sans': '300..800',
	Montserrat: '300..800',
	'Noto Sans Display': '300..800',
	'Josefin Sans': '300..700',
	'Merriweather Sans': '300..800',
	Merriweather: '300..800',
	'Playfair Display': '400..800',
	'Noto Serif Display': '300..800',
	'Source Serif 4': '300..800',
	'Roboto Serif': '300..800',
	'Roboto Slab': '300..800',
	'Fira Mono': '300..800',
	'Fira Code': '300..700',
	'Source Code Pro': '300..800',
	'Red Hat Mono': '300..700',
	'Roboto Mono': '300..800',
	'JetBrains Mono': '300..800',
	'Noto Sans Mono': '300..800',
};

export function resolveFontLink(fontNames: string[]) {
	const linkPrefix = 'https://fonts.googleapis.com/css2?';
	const linkSuffix = '&display=swap';
	const famPrefix = 'family=';
	const axis = ':wght@';

	const specList = fontNames.map((font) => {
		const name = font.trim().replaceAll(' ', '+');
		return famPrefix + name + axis + (fontWeightRange[font] || '300..800');
	});

	return linkPrefix + specList.join('&') + linkSuffix;
}

export function extractFontsFromTheme(theme: Partial<Theme['theme']> = {}, exclude: string[] = []) {
	const fontPaths = ['global.font.family.sans', 'global.font.family.serif', 'global.font.family.mono'];
	const externalFonts = [];
	for (const path of fontPaths) {
		const fontSetting = get(theme, path, null);

		if (!fontSetting) continue;
		if (typeof fontSetting === 'string' && !exclude.includes(fontSetting)) {
			externalFonts.push(fontSetting);
		}
		if (isArray(fontSetting)) {
			for (const nestedFontSetting of fontSetting) {
				if (typeof nestedFontSetting === 'string' && !exclude.includes(nestedFontSetting)) {
					externalFonts.push(nestedFontSetting);
				}
			}
		}
	}
	return externalFonts;
}

export function applyThemeOverrides(base: Record<string, any>, overrides: Record<string, any>) {
	/**
	 * When merging values, we'll treat the base theme values as the source of typings.
	 * If possible, we'll make the override value conform to that type.
	 */
	return mergeWith({}, base, overrides, (sourceVal, overrideVal) => {
		/**
		 * If we run into an array, we'll add the incoming value to the
		 * beginning of the existing array, instead of overwriting it.
		 */
		if (isArray(sourceVal)) {
			if (typeof overrideVal === 'string') {
				sourceVal.unshift(overrideVal);
				return sourceVal;
			}
			return overrideVal.concat(sourceVal);
		}

		if (!isNaN(parseFloat(sourceVal))) {
			/**
			 * If an override for a numeric field happened to be passed as a string,
			 * possibly with a unit, we need to only parse the numeric value.
			 */
			return parseFloat(sourceVal);
		}

		// If override value is valid color, return hex representation
		if (typeof sourceVal === 'string') {
			if (overrideVal[0] === '#') {
				overrideVal = overrideVal.substring(0, 7);
			}
			try {
				// If the source is a valid color, we'll ensure the override is as well.
				Color(sourceVal);
				try {
					return Color(overrideVal).hex().toUpperCase();
				} catch {
					// If value is partial (but invalid) hex string, return source value
					if (hexRegex.test(overrideVal.trim())) {
						return sourceVal;
					}
				}
			} catch {
				// Our source isn't a color, move on
			}
		}

		// If we got here, just defer merging to default method
		return undefined;
	});
}
