import type { RichTextConfig } from '@directus/extensions';
import {
	type AnyExtension,
	type Attributes,
	flattenExtensions,
	getAttributesFromExtensions,
	getExtensionField,
	type GlobalAttributes,
	splitExtensions,
} from '@tiptap/core';
import { editorExtensions } from '@/interfaces/input-rich-text-html/extensions';
import { ComparisonDiff } from '@/interfaces/input-rich-text-html/extensions/comparison-diff';
import { CUSTOM_FORMAT_PREFIX } from '@/interfaces/input-rich-text-html/extensions/custom-formats';
import { PRESERVED_ATTRIBUTE_KEYS } from '@/interfaces/input-rich-text-html/extensions/preserved-attributes';

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

function validateShape(config: unknown): string | null {
	if (!isObject(config)) return 'config is not an object';
	if (typeof config['id'] !== 'string' || !SLUG.test(config['id'])) return '"id" must match [a-z0-9-]+';
	if (typeof config['name'] !== 'string') return '"name" must be a string';

	const { extensions, buttons } = config;

	if (extensions !== undefined) {
		if (!Array.isArray(extensions)) return '"extensions" must be an array';
		if (!extensions.every(isTiptapExtension)) return '"extensions" must only hold Tiptap extensions, nodes or marks';
	}

	if (buttons !== undefined) {
		if (!Array.isArray(buttons)) return '"buttons" must be an array';

		const keys = new Set<string>();

		for (const button of buttons) {
			if (!isObject(button)) return 'every button must be an object';
			if (typeof button['key'] !== 'string' || !SLUG.test(button['key'])) return 'button "key" must match [a-z0-9-]+';
			const key = button['key'];
			const invalid = (problem: string) => `button "${key}" ${problem}`;

			if (keys.has(key)) return `button key "${key}" is used twice`;
			keys.add(key);
			if (typeof button['icon'] !== 'string') return invalid('needs an "icon" string');
			if (typeof button['label'] !== 'string') return invalid('needs a "label" string');
			if (typeof button['command'] !== 'function') return invalid('needs a "command" function');

			if (button['isActive'] !== undefined && typeof button['isActive'] !== 'function') {
				return invalid('has an "isActive" that is not a function');
			}
		}
	}

	return null;
}

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

function validateConflicts(config: RichTextConfig, owners: Map<string, string>): string | null {
	const contributed = flattenExtensions(config.extensions ?? []);
	const core = getCoreSchema();

	for (const { name } of contributed) {
		if (core.names.has(name)) return `"${name}" is a core node, mark or extension name`;
		if (name.startsWith(CUSTOM_FORMAT_PREFIX))
			return `"${name}" uses the "${CUSTOM_FORMAT_PREFIX}" prefix reserved for field custom formats`;
		if (owners.has(name)) return `"${name}" is already defined by richtext extension "${owners.get(name)}"`;
	}

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

function findRejection(config: unknown, ids: Set<string>, owners: Map<string, string>): string | null {
	try {
		const shapeError = validateShape(config);
		if (shapeError) return shapeError;

		const richText = config as RichTextConfig;
		if (ids.has(richText.id)) return 'another richtext extension already uses this id';

		return validateConflicts(richText, owners);
	} catch (error) {
		return `extension threw while being validated: ${error instanceof Error ? error.message : String(error)}`;
	}
}

export function validateRichTexts(configs: unknown[]): RichTextConfig[] {
	const valid: RichTextConfig[] = [];
	const ids = new Set<string>();
	// Tiptap only warns on duplicate names and one definition silently wins, so the first to load keeps the name
	const owners = new Map<string, string>();

	for (const config of configs) {
		const reason = findRejection(config, ids, owners);

		if (reason) {
			const label = isObject(config) && typeof config['id'] === 'string' ? `"${config['id']}"` : '(unknown id)';
			// eslint-disable-next-line no-console
			console.error(`Richtext extension ${label} was not loaded: ${reason}`);
			continue;
		}

		const richText = config as RichTextConfig;
		ids.add(richText.id);

		for (const { name } of flattenExtensions(richText.extensions ?? [])) {
			owners.set(name, richText.id);
		}

		valid.push(richText);
	}

	return valid;
}
