import { camelCase, upperFirst } from 'lodash-es';
import { components } from './custom-icons';
import { socialIcons } from './social-icons';
import icons from '@/interfaces/select-icon/icons.json';

let materialIcons: Set<string> | undefined;

/** The names `v-icon` can render: Material Symbols, the app custom icons, and the social icons. */
export function isKnownIcon(name: string): boolean {
	materialIcons ??= new Set(icons.flatMap((group) => group.icons));

	return (
		materialIcons.has(name) ||
		socialIcons.includes(name) ||
		`CustomIcon${upperFirst(camelCase(name.replace(/_/g, '-')))}` in components
	);
}
