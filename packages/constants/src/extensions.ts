export const APP_EXTENSION_TYPES = ['interface', 'display', 'layout', 'module', 'panel', 'theme'] as const;

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
	'operation',
] = [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES] as const;

export const APP_OR_HYBRID_EXTENSION_PACKAGE_TYPES: readonly [
	'interface',
	'display',
	'layout',
	'module',
	'panel',
	'theme',
	'operation',
	'bundle',
] = [...APP_OR_HYBRID_EXTENSION_TYPES, ...BUNDLE_EXTENSION_TYPES] as const;
