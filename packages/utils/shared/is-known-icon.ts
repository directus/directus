import { CUSTOM_ICONS, MATERIAL_SYMBOLS, SOCIAL_ICONS } from '@directus/constants';

let knownIcons: Set<string> | undefined;

/** Whether the app can render `name` as an icon: a Material Symbol, one of its custom icons, or a social icon. */
export function isKnownIcon(name: string): boolean {
	knownIcons ??= new Set([...MATERIAL_SYMBOLS, ...CUSTOM_ICONS, ...SOCIAL_ICONS]);

	return knownIcons.has(name);
}
