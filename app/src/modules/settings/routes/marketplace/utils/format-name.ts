import type { RegistryDescribeResponse, RegistryListResponse } from '@directus/extensions-registry';
import formatTitle from '@directus/format-title';

type Extension = RegistryListResponse['data'][number] | RegistryDescribeResponse['data'];

export const formatName = (extension: Extension) => {
	let name = extension.name;

	if (name.startsWith('@')) {
		name = name.split('/')[1]!;
	}

	if (name.startsWith('directus-extension-')) {
		name = name.substring('directus-extension-'.length);
	}

	return formatTitle(name);
};
