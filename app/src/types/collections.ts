import { Collection as CollectionRaw, CollectionType } from '@directus/types';
import { TranslateResult } from 'vue-i18n';

export interface Collection extends CollectionRaw {
	name: string | TranslateResult;
	icon: string;
	type: CollectionType;
	color?: string | null;
}
