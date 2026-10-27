import { camelCase, upperFirst } from 'lodash-es';
import { components } from './custom-icons';
import materialSymbols from './material-symbols.json';
import { socialIcons } from './social-icons';

let materialIcons: Set<string> | undefined;

// material-symbols.json lists every ligature in material-symbols.woff2: regenerate it when the font changes
/** The names `v-icon` can render: Material Symbols, the app custom icons, and the social icons. */
export function isKnownIcon(name: string): boolean {
	materialIcons ??= new Set(materialSymbols);

	return (
		materialIcons.has(name) ||
		socialIcons.includes(name) ||
		`CustomIcon${upperFirst(camelCase(name.replace(/_/g, '-')))}` in components
	);
}
