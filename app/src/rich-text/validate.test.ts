import { Extension, Mark, mergeAttributes, Node } from '@tiptap/core';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { validateRichTexts } from './validate';

const Callout = Node.create({
	name: 'callout',
	group: 'block',
	content: 'block+',
	parseHTML: () => [{ tag: 'div[data-callout]' }],
	renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0],
});

const button = { key: 'callout', icon: 'info', label: 'Callout', command: () => {} };

let error: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	error = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => error.mockRestore());

const ids = (configs: unknown[]) => validateRichTexts(configs).map((config) => config.id);

describe('validateRichTexts', () => {
	test('keeps a valid config', () => {
		expect(ids([{ id: 'callout', name: 'Callout', extensions: [Callout], buttons: [button] }])).toEqual(['callout']);
		expect(error).not.toHaveBeenCalled();
	});

	test('keeps the others when one is rejected', () => {
		const configs = [
			{ id: 'Bad Id', name: 'Bad' },
			{ id: 'callout', name: 'Callout', extensions: [Callout] },
		];

		expect(ids(configs)).toEqual(['callout']);
		expect(error).toHaveBeenCalledOnce();
	});

	test.each([
		['a non-object', 'nope'],
		['a missing id', { name: 'Callout' }],
		['a missing name', { id: 'callout' }],
		['a colon in the id', { id: 'a:b', name: 'Callout' }],
		['a non-array extensions', { id: 'callout', name: 'Callout', extensions: Callout }],
		['a non-Tiptap extension', { id: 'callout', name: 'Callout', extensions: [{ name: 'callout' }] }],
		['a non-array buttons', { id: 'callout', name: 'Callout', buttons: button }],
		['a button without a command', { id: 'callout', name: 'Callout', buttons: [{ ...button, command: undefined }] }],
		[
			'a button with a non-function isActive',
			{ id: 'callout', name: 'Callout', buttons: [{ ...button, isActive: 1 }] },
		],
		['a button without an icon', { id: 'callout', name: 'Callout', buttons: [{ ...button, icon: undefined }] }],
		['a button without a label', { id: 'callout', name: 'Callout', buttons: [{ ...button, label: undefined }] }],
		['a colon in a button key', { id: 'callout', name: 'Callout', buttons: [{ ...button, key: 'a:b' }] }],
		['a duplicate button key', { id: 'callout', name: 'Callout', buttons: [button, button] }],
	])('rejects %s', (_, config) => {
		expect(ids([config])).toEqual([]);
		expect(error).toHaveBeenCalledOnce();
	});

	test('rejects a later extension that reuses an id', () => {
		const configs = [
			{ id: 'callout', name: 'First' },
			{ id: 'callout', name: 'Second' },
		];

		expect(validateRichTexts(configs).map((config) => config.name)).toEqual(['First']);
		expect(error.mock.calls[0]!.join(' ')).toContain('"callout"');
	});

	test('rejects a node named after a core node and names the clash', () => {
		const Paragraph = Node.create({ name: 'paragraph', group: 'block', content: 'inline*' });

		expect(ids([{ id: 'my-paragraph', name: 'Paragraph', extensions: [Paragraph] }])).toEqual([]);

		const message = error.mock.calls[0]!.join(' ');
		expect(message).toContain('"my-paragraph"');
		expect(message).toContain('"paragraph"');
	});

	test('rejects a mark named after a core mark', () => {
		const Bold = Mark.create({ name: 'bold' });
		expect(ids([{ id: 'my-bold', name: 'Bold', extensions: [Bold] }])).toEqual([]);
	});

	test('rejects a core name nested inside addExtensions', () => {
		const Kit = Extension.create({
			name: 'myKit',
			addExtensions: () => [Node.create({ name: 'heading', group: 'block', content: 'inline*' })],
		});

		expect(ids([{ id: 'my-kit', name: 'Kit', extensions: [Kit] }])).toEqual([]);
	});

	test('rejects a global attribute that PreservedAttributes already owns', () => {
		const Classes = Extension.create({
			name: 'classes',
			addGlobalAttributes: () => [{ types: ['paragraph'], attributes: { class: { default: null } } }],
		});

		expect(ids([{ id: 'classes', name: 'Classes', extensions: [Classes] }])).toEqual([]);
		expect(error.mock.calls[0]!.join(' ')).toContain('"class"');
	});

	test('keeps a global attribute PreservedAttributes does not own', () => {
		const Tone = Extension.create({
			name: 'tone',
			addGlobalAttributes: () => [{ types: ['paragraph'], attributes: { tone: { default: null } } }],
		});

		expect(ids([{ id: 'tone', name: 'Tone', extensions: [Tone] }])).toEqual(['tone']);
	});

	test('rejects an extension whose addExtensions throws', () => {
		const Broken = Extension.create({
			name: 'broken',
			addExtensions: () => {
				throw new Error('boom');
			},
		});

		expect(ids([{ id: 'broken', name: 'Broken', extensions: [Broken] }])).toEqual([]);
		expect(error).toHaveBeenCalledOnce();
	});
});
