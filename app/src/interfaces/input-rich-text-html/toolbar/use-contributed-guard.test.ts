import type { RichTextCommandButton, RichTextMenuButton } from '@directus/extensions';
import type { Editor } from '@tiptap/vue-3';
import { afterEach, beforeEach, describe, expect, type MockInstance, test, vi } from 'vitest';
import { useContributedGuard } from './use-contributed-guard';

const editor = {} as Editor;

const boom = () => {
	throw new Error('boom');
};

let error: MockInstance<typeof console.error>;

beforeEach(() => {
	error = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe('guard', () => {
	test('returns the result of a callback that does not throw', () => {
		const { guard } = useContributedGuard();
		expect(guard('a', false, () => true)).toBe(true);
	});

	test('returns the fallback after a throw and logs the key once', () => {
		const { guard } = useContributedGuard();
		const run = vi.fn(boom);

		expect(guard('ext:a', false, run)).toBe(false);
		expect(guard('ext:a', false, run)).toBe(false);
		expect(run).toHaveBeenCalledOnce();
		expect(error).toHaveBeenCalledOnce();
		expect(error.mock.calls[0]!.join(' ')).toContain('"ext:a"');
	});
});

describe('guardButton', () => {
	const menuButton = (overrides: Partial<RichTextMenuButton> = {}): RichTextMenuButton => ({
		key: 'tone',
		icon: 'info',
		label: 'Tone',
		items: [
			{ key: 'info', label: 'Info', command: () => {} },
			{ key: 'warn', label: 'Warn', command: () => {} },
		],
		...overrides,
	});

	test('disables a command button whose command threw', () => {
		const { guardButton } = useContributedGuard();
		const callout: RichTextCommandButton = { key: 'callout', icon: 'info', label: 'Callout', command: boom };
		const button = guardButton('ext:callout', callout);

		expect(button.isDisabled!(editor)).toBe(false);
		button.command(editor);
		expect(button.isDisabled!(editor)).toBe(true);
	});

	test('disables a menu button whose isActive threw', () => {
		const { guardButton } = useContributedGuard();
		const button = guardButton('ext:tone', menuButton({ isActive: boom }));

		expect(button.isActive!(editor)).toBe(false);
		expect(button.isDisabled!(editor)).toBe(true);
	});

	test('disables only the item that threw', () => {
		const { guardButton } = useContributedGuard();
		const [info, warn] = menuButton().items;
		const button = guardButton('ext:tone', menuButton({ items: [{ ...info!, isActive: boom }, warn!] }));

		expect(button.items[0]!.isActive!(editor)).toBe(false);
		expect(button.items[0]!.isDisabled!(editor)).toBe(true);
		expect(button.items[1]!.isDisabled!(editor)).toBe(false);
		expect(button.isDisabled!(editor)).toBe(false);
		expect(error.mock.calls[0]!.join(' ')).toContain('"ext:tone:info"');
	});
});
