import formatTitle from '@directus/format-title';
import type { ContentVersion } from '@directus/types';
import { isNil } from 'lodash';
import { i18n } from '@/lang';

export function getVersionDisplayName(version: ContentVersion | null) {
	if (version === null) return i18n.global.t('main_version');

	if (isNil(version.name)) return formatTitle(version.key);

	return version.name;
}
