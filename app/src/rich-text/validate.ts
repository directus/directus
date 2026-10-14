import type {
	RichTextBubbleMenu,
	RichTextConfig,
	RichTextOptionValues,
	RichTextPerField,
	RichTextToolbarButton,
} from '@directus/extensions';
import {
	type AnyExtension,
	type Attributes,
	flattenExtensions,
	getAttributesFromExtensions,
	getExtensionField,
	getSchema,
	type GlobalAttributes,
	splitExtensions,
} from '@tiptap/core';
import { isKnownIcon } from '@/components/v-icon/known-icons';
import { editorExtensions, fieldEditorExtensions } from '@/interfaces/input-rich-text-html/extensions';
import { ComparisonDiff } from '@/interfaces/input-rich-text-html/extensions/comparison-diff';
import { CUSTOM_FORMAT_PREFIX } from '@/interfaces/input-rich-text-html/extensions/custom-formats';
import { PRESERVED_ATTRIBUTE_KEYS } from '@/interfaces/input-rich-text-html/extensions/preserved-attributes';
import { optionValues, type ResolvedRichText, stableStringify } from '@/rich-text/register';

const SLUG = /^[a-z0-9-]+$/;

interface CoreSchema {
	names: Set<string>;
	/** Attribute names each core node or mark type defines, from its own and from global attributes. */
	attributes: Map<string, Set<string>>;
	nodeTypes: string[];
	markTypes: string[];
}

let coreSchema: CoreSchema | undefined;

function getCoreSchema(): CoreSchema {
	if (coreSchema) return coreSchema;

	const core = flattenExtensions([...editorExtensions, ComparisonDiff]);
	const { nodeExtensions, markExtensions } = splitExtensions(core);
	const attributes = new Map<string, Set<string>>();

	for (const { type, name } of getAttributesFromExtensions(core)) {
		attributes.set(type, (attributes.get(type) ?? new Set()).add(name));
	}

	coreSchema = {
		names: new Set(core.map((extension) => extension.name)),
		attributes,
		// mirrors what Tiptap resolves the `nodes` and `*` shorthands to
		nodeTypes: nodeExtensions.filter((extension) => extension.name !== 'text').map((extension) => extension.name),
		markTypes: markExtensions.map((extension) => extension.name),
	};

	return coreSchema;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isTiptapExtension = (value: unknown): value is AnyExtension =>
	isObject(value) &&
	typeof value['name'] === 'string' &&
	['extension', 'node', 'mark'].includes(value['type'] as string);

const PREDICATES = ['isActive', 'isDisabled'] as const;

function findPredicateError(value: Record<string, unknown>): string | null {
	const predicate = PREDICATES.find((name) => value[name] !== undefined && typeof value[name] !== 'function');
	return predicate ? `has an "${predicate}" that is not a function` : null;
}

// `check` returns the problem of one entry; the walker prefixes it with the entry's noun and key
function validateKeyed(
	entries: unknown,
	field: string,
	noun: string,
	check: (entry: Record<string, unknown>) => string | null,
): string | null {
	if (!Array.isArray(entries)) return `"${field}" must be an array`;

	const keys = new Set<string>();

	for (const entry of entries) {
		if (!isObject(entry)) return `every ${noun} must be an object`;
		const key = entry['key'];
		if (typeof key !== 'string' || !SLUG.test(key)) return `${noun} "key" must match [a-z0-9-]+`;
		if (keys.has(key)) return `${noun} key "${key}" is used twice`;
		keys.add(key);

		const problem = check(entry);
		if (problem) return `${noun} "${key}" ${problem}`;
	}

	return null;
}

function validateItem(item: Record<string, unknown>): string | null {
	if (typeof item['label'] !== 'string') return 'needs a "label" string';
	if (item['icon'] !== undefined && typeof item['icon'] !== 'string') return 'has an "icon" that is not a string';
	if (typeof item['command'] !== 'function') return 'needs a "command" function';
	return findPredicateError(item);
}

function validateButton(button: Record<string, unknown>, { allowItems }: { allowItems: boolean }): string | null {
	if (typeof button['icon'] !== 'string') return 'needs an "icon" string';
	if (typeof button['label'] !== 'string') return 'needs a "label" string';

	const items = button['items'];

	if (items !== undefined) {
		if (!allowItems) return 'cannot have "items"';
		if (button['command'] !== undefined) return 'needs a "command" or "items", not both';
		if (Array.isArray(items) && items.length === 0) return 'has no items';
		const itemsError = validateKeyed(items, 'items', 'item', validateItem);
		if (itemsError) return itemsError;
	} else if (typeof button['command'] !== 'function') {
		return 'needs a "command" function or an "items" array';
	}

	return findPredicateError(button);
}

function validateBubbleMenu(menu: Record<string, unknown>): string | null {
	if (typeof menu['shouldShow'] !== 'function') return 'needs a "shouldShow" function';
	return validateKeyed(menu['buttons'], 'buttons', 'button', (button) => validateButton(button, { allowItems: false }));
}

function validateOptions(options: unknown): string | null {
	if (options === undefined) return null;
	if (!Array.isArray(options)) return '"options" must be an array';

	const fields = new Set<string>();

	for (const option of options) {
		if (!isObject(option) || typeof option['field'] !== 'string') return 'every option needs a "field" string';
		if (fields.has(option['field'])) return `option "${option['field']}" is defined twice`;
		fields.add(option['field']);
	}

	return null;
}

const PER_FIELD = ['extensions', 'buttons', 'bubbleMenus'] as const;

function validateShape(config: unknown): string | null {
	if (!isObject(config)) return 'config is not an object';
	if (typeof config['id'] !== 'string' || !SLUG.test(config['id'])) return '"id" must match [a-z0-9-]+';
	if (typeof config['name'] !== 'string') return '"name" must be a string';

	const optionsError = validateOptions(config['options']);
	if (optionsError) return optionsError;

	for (const field of PER_FIELD) {
		const value = config[field];
		if (value !== undefined && !Array.isArray(value) && typeof value !== 'function')
			return `"${field}" must be an array or a function`;
	}

	return null;
}

function validateExtensionList(extensions: unknown): string | null {
	if (!Array.isArray(extensions)) return '"extensions" must be an array';
	if (!extensions.every(isTiptapExtension)) return '"extensions" must only hold Tiptap extensions, nodes or marks';
	return null;
}

const validateButtons = (buttons: unknown) =>
	validateKeyed(buttons, 'buttons', 'button', (button) => validateButton(button, { allowItems: true }));

const validateBubbleMenus = (bubbleMenus: unknown) =>
	validateKeyed(bubbleMenus, 'bubbleMenus', 'bubble menu', validateBubbleMenu);

function callAttributesField<T>(
	extension: AnyExtension,
	field: 'addGlobalAttributes' | 'addAttributes',
	context: object = {},
): T | undefined {
	const getAttributes = getExtensionField<(() => T) | undefined>(extension, field, {
		name: extension.name,
		options: extension.options,
		storage: extension.storage,
		...context,
	});

	return getAttributes?.();
}

const findReservedKey = (attributes: object = {}) =>
	Object.keys(attributes).find((name) => PRESERVED_ATTRIBUTE_KEYS.has(name));

function resolveGlobalTypes(types: GlobalAttributes[number]['types'], core: CoreSchema): string[] {
	if (Array.isArray(types)) return types;
	if (types === '*') return [...core.nodeTypes, ...core.markTypes];
	if (types === 'nodes') return core.nodeTypes;
	if (types === 'marks') return core.markTypes;
	return [];
}

/**
 * A later attribute definition wins when Tiptap builds the schema, so a contributed global attribute
 * named after one a core type already has would silently replace it (e.g. `textAlign` on
 * `paragraph` with a new default).
 */
function findCoreAttributeClash(
	types: GlobalAttributes[number]['types'],
	attributes: object = {},
	core: CoreSchema,
): { type: string; name: string } | undefined {
	for (const type of resolveGlobalTypes(types, core)) {
		const coreAttributes = core.attributes.get(type);
		if (!coreAttributes) continue;

		const name = Object.keys(attributes).find((key) => coreAttributes.has(key));
		if (name) return { type, name };
	}

	return undefined;
}

function validateNames(extensions: AnyExtension[], owners: Map<string, string>): string | null {
	const core = getCoreSchema();

	for (const { name } of flattenExtensions(extensions)) {
		if (core.names.has(name)) return `"${name}" is a core node, mark or extension name`;
		if (name.startsWith(CUSTOM_FORMAT_PREFIX))
			return `"${name}" uses the "${CUSTOM_FORMAT_PREFIX}" prefix reserved for field custom formats`;
		if (owners.has(name)) return `"${name}" is already defined by richtext extension "${owners.get(name)}"`;
	}

	return null;
}

function validateAttributes(extensions: AnyExtension[]): string | null {
	const contributed = flattenExtensions(extensions);
	const core = getCoreSchema();
	const { nodeExtensions, markExtensions } = splitExtensions([...flattenExtensions(editorExtensions), ...contributed]);

	for (const extension of contributed) {
		const globalAttributes = callAttributesField<GlobalAttributes>(extension, 'addGlobalAttributes', {
			extensions: [...nodeExtensions, ...markExtensions],
		});

		for (const { types, attributes } of globalAttributes ?? []) {
			const reserved = findReservedKey(attributes);
			if (reserved) return `global attribute "${reserved}" is reserved by the core editor`;

			const clash = findCoreAttributeClash(types, attributes, core);
			if (clash) return `global attribute "${clash.name}" is already defined on core type "${clash.type}"`;
		}
	}

	const { nodeExtensions: ownNodes, markExtensions: ownMarks } = splitExtensions(contributed);

	for (const extension of [...ownNodes, ...ownMarks]) {
		const clash = findReservedKey(callAttributesField<Attributes>(extension, 'addAttributes'));
		if (clash) return `attribute "${clash}" on "${extension.name}" is reserved by the core editor`;
	}

	return null;
}

const validateExtensions = (extensions: unknown, owners: Map<string, string>): string | null =>
	validateExtensionList(extensions) ??
	validateNames(extensions as AnyExtension[], owners) ??
	validateAttributes(extensions as AnyExtension[]) ??
	validateSchemaBuild(extensions as AnyExtension[]);

type Checked = { reason: string } | { config: RichTextConfig; defaults: ResolvedRichText };

function check(config: unknown, ids: Set<string>, owners: Map<string, string>): Checked {
	try {
		const shapeError = validateShape(config);
		if (shapeError) return { reason: shapeError };

		const richText = config as RichTextConfig;
		if (ids.has(richText.id)) return { reason: 'another richtext extension already uses this id' };

		const values = optionValues(richText);

		const run = <T>(entries: RichTextPerField<T, RichTextOptionValues> | undefined) =>
			typeof entries === 'function' ? entries(values) : (entries ?? []);

		const defaults = {
			extensions: run(richText.extensions),
			buttons: run(richText.buttons),
			bubbleMenus: run(richText.bubbleMenus),
		};

		const reason =
			validateExtensions(defaults.extensions, owners) ??
			validateButtons(defaults.buttons) ??
			validateBubbleMenus(defaults.bubbleMenus);

		if (reason) return { reason };

		return { config: richText, defaults: { id: richText.id, name: richText.name, key: '', ...defaults } };
	} catch (error) {
		return { reason: `extension threw while being validated: ${errorMessage(error)}` };
	}
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

// a schema-build throw would otherwise surface in every field that enabled the extension
function validateSchemaBuild(extensions: AnyExtension[]): string | null {
	try {
		getSchema(fieldEditorExtensions(extensions));
		return null;
	} catch (error) {
		return `extension threw while building the editor schema: ${errorMessage(error)}`;
	}
}

const FALLBACK_ICON = 'extension';

// an unknown name renders as its raw ligature text, so the button gets a placeholder instead of a rejection
function knownIcons(id: string) {
	const knownIcon = (icon: string, owner: string): string => {
		if (isKnownIcon(icon)) return icon;

		// eslint-disable-next-line no-console
		console.warn(
			`Richtext extension "${id}": ${owner} uses the unknown icon "${icon}". ` +
				`It shows the "${FALLBACK_ICON}" icon instead.`,
		);

		return FALLBACK_ICON;
	};

	const withKnownIcon = <T extends RichTextToolbarButton>(button: T, owner: string): T => ({
		...button,
		icon: knownIcon(button.icon, owner),
		...(button.items
			? {
					items: button.items.map((item) =>
						item.icon ? { ...item, icon: knownIcon(item.icon, `${owner} item "${item.key}"`) } : item,
					),
				}
			: {}),
	});

	return {
		buttons: (buttons: RichTextToolbarButton[]) =>
			buttons.map((button) => withKnownIcon(button, `button "${button.key}"`)),
		bubbleMenus: (bubbleMenus: RichTextBubbleMenu[]) =>
			bubbleMenus.map((menu) => ({
				...menu,
				buttons: menu.buttons.map((button) =>
					withKnownIcon(button, `bubble menu "${menu.key}" button "${button.key}"`),
				),
			})),
	};
}

const nameList = (extensions: AnyExtension[]) =>
	flattenExtensions(extensions)
		.map(({ name }) => name)
		.sort()
		.join(', ');

/**
 * Wraps a factory so each new set of option values gets the load-time checks once. A failing set
 * throws, which leaves the extension out of that field only (see resolveRichText).
 */
function guardFactory<T>(
	factory: (values: RichTextOptionValues) => T[],
	validate: (entries: unknown) => string | null,
	finish: (entries: T[]) => T[],
): (values: RichTextOptionValues) => T[] {
	const cache = new Map<string, { entries: T[] } | { error: Error }>();

	return (values) => {
		const key = stableStringify(values);
		let result = cache.get(key);

		if (!result) {
			try {
				const entries = factory(values);
				const reason = validate(entries);
				result = reason ? { error: new Error(reason) } : { entries: finish(entries) };
			} catch (error) {
				result = { error: error instanceof Error ? error : new Error(String(error)) };
			}

			cache.set(key, result);
		}

		if ('error' in result) throw result.error;
		return result.entries;
	};
}

function guarded(config: RichTextConfig, defaults: ResolvedRichText): RichTextConfig {
	const icons = knownIcons(config.id);
	const { extensions, buttons, bubbleMenus } = config;
	const defaultNames = nameList(defaults.extensions);

	const sameNames = (entries: AnyExtension[]) => {
		const names = nameList(entries);
		return names === defaultNames ? null : `"extensions" returns the names [${names}] instead of [${defaultNames}]`;
	};

	return {
		...config,
		extensions:
			typeof extensions === 'function'
				? guardFactory(
						extensions,
						(entries) =>
							validateExtensionList(entries) ??
							sameNames(entries as AnyExtension[]) ??
							validateAttributes(entries as AnyExtension[]) ??
							validateSchemaBuild(entries as AnyExtension[]),
						(entries) => entries,
					)
				: extensions,
		buttons:
			typeof buttons === 'function'
				? guardFactory(buttons, validateButtons, icons.buttons)
				: buttons && icons.buttons(buttons),
		bubbleMenus:
			typeof bubbleMenus === 'function'
				? guardFactory(bubbleMenus, validateBubbleMenus, icons.bubbleMenus)
				: bubbleMenus && icons.bubbleMenus(bubbleMenus),
	};
}

const sortKey = (config: unknown) => (isObject(config) && typeof config['id'] === 'string' ? config['id'] : null);

// load order follows readdir, which differs between filesystems, so sort by id to make the
// conflict winner, schema parse priority and toolbar order the same on every deployment
function byId(a: unknown, b: unknown): number {
	const keyA = sortKey(a);
	const keyB = sortKey(b);
	if (keyA === keyB) return 0;
	if (keyA === null) return 1;
	if (keyB === null) return -1;
	// code-unit compare, localeCompare would change the order with the browser locale
	return keyA < keyB ? -1 : 1;
}

/**
 * Returns the valid configs sorted by id. On a name conflict the config whose id sorts first wins.
 */
export function validateRichTexts(configs: unknown[]): RichTextConfig[] {
	const valid: RichTextConfig[] = [];
	const ids = new Set<string>();
	// Tiptap only warns on duplicate names and one definition silently wins, so the first by id keeps the name
	const owners = new Map<string, string>();

	for (const config of [...configs].sort(byId)) {
		const checked = check(config, ids, owners);

		if ('reason' in checked) {
			const label = isObject(config) && typeof config['id'] === 'string' ? `"${config['id']}"` : '(unknown id)';
			// eslint-disable-next-line no-console
			console.error(`Richtext extension ${label} was not loaded: ${checked.reason}`);
			continue;
		}

		const { config: richText, defaults } = checked;
		ids.add(richText.id);

		for (const { name } of flattenExtensions(defaults.extensions)) {
			owners.set(name, richText.id);
		}

		valid.push(guarded(richText, defaults));
	}

	return valid;
}
