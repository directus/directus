export const APP_EXTENSION_TYPES = ['interface', 'display', 'layout', 'module', 'panel', 'theme', 'richtext'] as const;

export const API_EXTENSION_TYPES = ['hook', 'endpoint'] as const;

export const HYBRID_EXTENSION_TYPES = ['operation'] as const;

export const BUNDLE_EXTENSION_TYPES = ['bundle'] as const;

export const EXTENSION_TYPES: readonly [
	'interface',
	'display',
	'layout',
	'module',
	'panel',
	'theme',
	'richtext',
	'hook',
	'endpoint',
	'operation',
	'bundle',
] = [...APP_EXTENSION_TYPES, ...API_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES, ...BUNDLE_EXTENSION_TYPES] as const;

export const NESTED_EXTENSION_TYPES: readonly [
	'interface',
	'display',
	'layout',
	'module',
	'panel',
	'theme',
	'richtext',
	'hook',
	'endpoint',
	'operation',
] = [...APP_EXTENSION_TYPES, ...API_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES] as const;

export const APP_OR_HYBRID_EXTENSION_TYPES: readonly [
	'interface',
	'display',
	'layout',
	'module',
	'panel',
	'theme',
	'richtext',
	'operation',
] = [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES] as const;

export const APP_OR_HYBRID_EXTENSION_PACKAGE_TYPES: readonly [
	'interface',
	'display',
	'layout',
	'module',
	'panel',
	'theme',
	'richtext',
	'operation',
	'bundle',
] = [...APP_OR_HYBRID_EXTENSION_TYPES, ...BUNDLE_EXTENSION_TYPES] as const;
