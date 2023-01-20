import path from 'path';
import { API_EXTENSION_TYPES, APP_EXTENSION_TYPES, HYBRID_EXTENSION_TYPES } from '@directus/shared/constants';
import { ExtensionOptionsBundleEntry } from '@directus/shared/types';
import { isIn, isTypeIn, pluralize } from '@directus/shared/utils';
import { pathToRelativeUrl } from '@directus/shared/utils/node';

export default function generateBundleEntrypoint(mode: 'app' | 'api', entries: ExtensionOptionsBundleEntry[]): string {
	const types = [...(mode === 'app' ? APP_EXTENSION_TYPES : API_EXTENSION_TYPES), ...HYBRID_EXTENSION_TYPES];

	const entriesForTypes = entries.filter((entry) => isIn(entry.type, types));

	const imports = entriesForTypes.map(
		(entry, i) =>
			`import e${i} from './${pathToRelativeUrl(
				path.resolve(
					isTypeIn(entry, HYBRID_EXTENSION_TYPES)
						? mode === 'app'
							? entry.source.app
							: entry.source.api
						: entry.source
				)
			)}';`
	);

	const exports = types.map(
		(type) =>
			`export const ${pluralize(type)} = [${entriesForTypes
				.map((entry, i) =>
					entry.type === type ? (mode === 'app' ? `e${i}` : `{name:'${entry.name}',config:e${i}}`) : null
				)
				.filter((e): e is string => e !== null)
				.join(',')}];`
	);

	return `${imports.join('')}${exports.join('')}`;
}
