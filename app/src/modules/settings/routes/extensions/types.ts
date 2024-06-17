import { ExtensionType as ExtensionTypeOriginal } from '@directus/extensions';

export type ExtensionState = 'enabled' | 'disabled' | 'partial';

export type ExtensionType = ExtensionTypeOriginal | 'missing';
