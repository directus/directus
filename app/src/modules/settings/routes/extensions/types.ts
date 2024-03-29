import { ExtensionType as ExtensionTypeOriginal } from '@directus/extensions';

export type ExtensionStatus = 'enabled' | 'disabled' | 'partial';

export type ExtensionType = ExtensionTypeOriginal | 'missing';
