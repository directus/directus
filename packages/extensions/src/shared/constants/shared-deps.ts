/**
 * Dependencies that we guarantee are available in the global scope of the app's bundle when app
 * extensions are used. These are virtually rewritten to use the existing bundled instances in the
 * global scope rather than local copies
 */
export const APP_SHARED_DEPS = [
	'@directus/extensions-sdk',
	'vue',
	'vue-router',
	'vue-i18n',
	'pinia',
	// `richtext` extensions must share the editor's ProseMirror classes. `@tiptap/pm` has no root export
	'@tiptap/core',
	'@tiptap/vue-3',
	'@tiptap/pm/commands',
	'@tiptap/pm/dropcursor',
	'@tiptap/pm/gapcursor',
	'@tiptap/pm/history',
	'@tiptap/pm/keymap',
	'@tiptap/pm/model',
	'@tiptap/pm/schema-list',
	'@tiptap/pm/state',
	'@tiptap/pm/tables',
	'@tiptap/pm/transform',
	'@tiptap/pm/view',
	// `changeset` and `inputrules` are not in the app, and are safe to bundle because of APP_SHARED_DEP_ALIASES
] as const;

const TIPTAP_PM_PREFIX = '@tiptap/pm/';

/** `@tiptap/pm/<name>` is `export * from 'prosemirror-<name>'`, so bare imports can use the shared subpath */
export const APP_SHARED_DEP_ALIASES: Readonly<Record<string, string>> = Object.fromEntries(
	APP_SHARED_DEPS.filter((dep) => dep.startsWith(TIPTAP_PM_PREFIX)).map((dep) => [
		`prosemirror-${dep.slice(TIPTAP_PM_PREFIX.length)}`,
		dep,
	]),
);

/**
 * Dependencies that we guarantee are available in the node_modules of the API when API extensions
 * are used. The `directus:*` extensions are virtual entrypoints available in the sandbox
 */
export const API_SHARED_DEPS = ['directus', 'directus:api'] as const;
