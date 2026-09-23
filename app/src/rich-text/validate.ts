import type { RichTextConfig } from '@directus/extensions';
import {
	type AnyExtension,
	flattenExtensions,
	getExtensionField,
	type MarkConfig,
	type NodeConfig,
	splitExtensions,
} from '@tiptap/core';
import { editorExtensions } from '@/interfaces/input-rich-text-html/extensions';
import { ComparisonDiff } from '@/interfaces/input-rich-text-html/extensions/comparison-diff';
import { PRESERVED_ATTRIBUTE_KEYS } from '@/interfaces/input-rich-text-html/extensions/preserved-attributes';

const SLUG = /^[a-z0-9-]+$/;

let coreNames: Set<string> | undefined;

function getCoreNames() {
	coreNames ??= new Set(flattenExtensions([...editorExtensions, ComparisonDiff]).map((extension) => extension.name));
	return coreNames;
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
			if (keys.has(button['key'])) return `button key "${button['key']}" is used twice`;
			keys.add(button['key']);
			if (typeof button['icon'] !== 'string') return `button "${button['key']}" needs an "icon" string`;
			if (typeof button['label'] !== 'string') return `button "${button['key']}" needs a "label" string`;
			if (typeof button['command'] !== 'function') return `button "${button['key']}" needs a "command" function`;

			if (button['isActive'] !== undefined && typeof button['isActive'] !== 'function') {
				return `button "${button['key']}" has an "isActive" that is not a function`;
			}
		}
	}

	return null;
}

function validateNames(config: RichTextConfig): string | null {
	const contributed = flattenExtensions(config.extensions ?? []);
	const core = getCoreNames();

	for (const extension of contributed) {
		if (core.has(extension.name)) return `"${extension.name}" is a core node, mark or extension name`;
	}

	const { nodeExtensions, markExtensions } = splitExtensions([...flattenExtensions(editorExtensions), ...contributed]);

	for (const extension of contributed) {
		const addGlobalAttributes = getExtensionField<AnyExtension['config']['addGlobalAttributes']>(
			extension,
			'addGlobalAttributes',
			{
				name: extension.name,
				options: extension.options,
				storage: extension.storage,
				extensions: [...nodeExtensions, ...markExtensions],
			},
		);

		for (const globalAttribute of addGlobalAttributes?.() ?? []) {
			const clash = Object.keys(globalAttribute.attributes).find((name) => PRESERVED_ATTRIBUTE_KEYS.has(name));
			if (clash) return `global attribute "${clash}" is reserved by the core editor`;
		}
	}

	const { nodeExtensions: ownNodes, markExtensions: ownMarks } = splitExtensions(contributed);

	for (const extension of [...ownNodes, ...ownMarks]) {
		const addAttributes = getExtensionField<NodeConfig['addAttributes'] | MarkConfig['addAttributes']>(
			extension,
			'addAttributes',
			{ name: extension.name, options: extension.options, storage: extension.storage },
		);

		const clash = Object.keys(addAttributes?.() ?? {}).find((name) => PRESERVED_ATTRIBUTE_KEYS.has(name));
		if (clash) return `attribute "${clash}" on "${extension.name}" is reserved by the core editor`;
	}

	return null;
}

export function validateRichTexts(configs: unknown[]): RichTextConfig[] {
	const valid: RichTextConfig[] = [];
	const ids = new Set<string>();

	for (const config of configs) {
		const label = isObject(config) && typeof config['id'] === 'string' ? `"${config['id']}"` : '(unknown id)';
		let reason: string | null;

		try {
			reason = validateShape(config);

			if (!reason && ids.has((config as RichTextConfig).id)) reason = 'another richtext extension already uses this id';
			if (!reason) reason = validateNames(config as RichTextConfig);
		} catch (error) {
			reason = `extension threw while being validated: ${error instanceof Error ? error.message : String(error)}`;
		}

		if (reason) {
			// eslint-disable-next-line no-console
			console.error(`Richtext extension ${label} was not loaded: ${reason}`);
			continue;
		}

		ids.add((config as RichTextConfig).id);
		valid.push(config as RichTextConfig);
	}

	return valid;
}
