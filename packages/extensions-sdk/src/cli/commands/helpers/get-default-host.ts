import type { ExtensionType } from '@directus/types';
import { LAST_BREAKING_RELEASE } from '../../../constants/last-breaking.js';

const FIRST_SUPPORTED_RELEASE: Partial<Record<ExtensionType, string>> = {
	richtext: '12.6.0',
};

export default function getDefaultHost(type: ExtensionType): string {
	return `^${FIRST_SUPPORTED_RELEASE[type] ?? LAST_BREAKING_RELEASE}`;
}
