import { ExtensionType } from './types';
import { extensionTypeIconMap as extensionTypeIconMapOriginal } from '@/constants/extension-type-icon-map';

export const extensionTypeIconMap: Record<ExtensionType, string> = {
	...extensionTypeIconMapOriginal,
	missing: 'warning',
};
