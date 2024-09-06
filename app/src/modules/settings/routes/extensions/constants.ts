import { extensionTypeIconMap as extensionTypeIconMapOriginal } from '@/constants/extension-type-icon-map';
import { ExtensionType } from './types';

export const extensionTypeIconMap: Record<ExtensionType, string> = {
	...extensionTypeIconMapOriginal,
	missing: 'warning',
};
