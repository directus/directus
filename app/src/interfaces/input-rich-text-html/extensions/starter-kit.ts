import { type CommandProps, getMarkAttributes, type Mark, mergeAttributes, type RawCommands } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import StarterKit, { type StarterKitOptions } from '@tiptap/starter-kit';
import type { AnyExtension } from '@tiptap/vue-3';

interface LegacyTagOptions {
	keepLegacyEmphasisTags: boolean;
}

interface LegacyTagConfig {
	legacyTag: string;
	defaultTag: string;
	setCommand: keyof RawCommands;
	toggleCommand: keyof RawCommands;
}

function withLegacyTag<Options extends { HTMLAttributes: Record<string, any> }>(
	mark: Mark<Options>,
	{ legacyTag, defaultTag, setCommand, toggleCommand }: LegacyTagConfig,
) {
	return mark.extend<Options & LegacyTagOptions>({
		addOptions() {
			return { ...this.parent!(), keepLegacyEmphasisTags: false };
		},

		// Without the option the mark has no `tag` attribute, so the default schema stays the same as StarterKit's.
		addAttributes() {
			if (!this.options.keepLegacyEmphasisTags) return {};

			return {
				tag: {
					default: null,
					parseHTML: (element: HTMLElement) => (element.tagName.toLowerCase() === legacyTag ? legacyTag : null),
					renderHTML: () => ({}),
				},
			};
		},

		// Reuses the tag already in the selection, so marking across a legacy run does not split it into two tags.
		addCommands() {
			const parentCommands = this.parent!();

			if (!this.options.keepLegacyEmphasisTags) return parentCommands;

			const attributes = (state: CommandProps['state']) => ({
				tag: getMarkAttributes(state, this.name)['tag'] ?? null,
			});

			return {
				...parentCommands,
				[setCommand]:
					() =>
					({ state, commands }: CommandProps) =>
						commands.setMark(this.name, attributes(state)),
				[toggleCommand]:
					() =>
					({ state, commands }: CommandProps) =>
						commands.toggleMark(this.name, attributes(state)),
			} as Partial<RawCommands>;
		},

		renderHTML({ mark, HTMLAttributes }) {
			return [mark.attrs['tag'] ?? defaultTag, mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
		},
	});
}

const LegacyTagBold = withLegacyTag(Bold, {
	legacyTag: 'b',
	defaultTag: 'strong',
	setCommand: 'setBold',
	toggleCommand: 'toggleBold',
});

const LegacyTagItalic = withLegacyTag(Italic, {
	legacyTag: 'i',
	defaultTag: 'em',
	setCommand: 'setItalic',
	toggleCommand: 'toggleItalic',
});

// Swaps Bold and Italic in place: the extension order sets mark nesting, so moving them would reorder stored tags.
const EditorStarterKit = StarterKit.extend<StarterKitOptions & LegacyTagOptions>({
	// StarterKit defines no addOptions, so there may be no parent to call.
	addOptions() {
		return { ...this.parent?.(), keepLegacyEmphasisTags: false } as StarterKitOptions & LegacyTagOptions;
	},

	addExtensions() {
		const keepLegacyEmphasisTags = this.options.keepLegacyEmphasisTags;

		return this.parent!().map((extension) => {
			if (extension.name === 'bold') return LegacyTagBold.configure({ keepLegacyEmphasisTags });
			if (extension.name === 'italic') return LegacyTagItalic.configure({ keepLegacyEmphasisTags });
			return extension;
		});
	},
});

const STARTER_KIT_OPTIONS: Partial<StarterKitOptions> = {
	// replaced by DropCursor, which draws a vertical indicator between same-row inline-block nodes
	dropcursor: false,
	// standalone so buildLinkProtocolSchema can swap it for a per-field configured Link
	link: false,
};

export const BaseStarterKit = EditorStarterKit.configure(STARTER_KIT_OPTIONS);

/** Field schema that keeps `<b>` and `<i>` from the source instead of rewriting them to `<strong>` and `<em>`. */
export function buildLegacyEmphasisSchema(raw: unknown): { extensions: AnyExtension[]; key: string } {
	if (raw !== true) return { extensions: [], key: '' };

	return {
		extensions: [EditorStarterKit.configure({ ...STARTER_KIT_OPTIONS, keepLegacyEmphasisTags: true })],
		key: 'keepLegacyEmphasisTags',
	};
}
