import { VERSION_KEY_DRAFT } from '@directus/constants';
import formatTitle from '@directus/format-title';
import type { ContentVersion } from '@directus/types';
import { isNil } from 'lodash';
import { i18n } from '@/lang';

export function getVersionDisplayName(version: Pick<ContentVersion, 'key' | 'name'> | null) {
	if (version === null) return i18n.global.t('main_version');

	if (version.key === VERSION_KEY_DRAFT) return i18n.global.t('draft');

	if (isNil(version.name)) return formatTitle(version.key);

	return version.name;
}
