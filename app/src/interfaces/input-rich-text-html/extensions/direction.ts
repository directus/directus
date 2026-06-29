import { Extension } from '@tiptap/core';

export type TextDirectionValue = 'ltr' | 'rtl';

export interface DirectionOptions {
	/** Node types that carry a `dir` attribute (block-level, matching TinyMCE's directionality). */
	types: string[];
	/** Accepted direction values; anything else parses back to `defaultDirection`. */
	directions: TextDirectionValue[];
	/**
	 * Per-node attribute default. Kept `null` (decoupled from the editor's visual default) so the
	 * `dir` attribute serializes only when explicitly set — existing content without `dir`
	 * round-trips unchanged instead of being stamped on every block.
	 */
	defaultDirection: TextDirectionValue | null;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		direction: {
			/** Set `dir` on the block(s) at the current selection. */
			setDirection: (direction: TextDirectionValue) => ReturnType;
			/** Remove `dir` from the block(s) at the current selection. */
			unsetDirection: () => ReturnType;
		};
	}
}

/**
 * Adds a `dir` global attribute to block nodes and `setDirection`/`unsetDirection` commands —
 * the Tiptap replacement for TinyMCE's `directionality` plugin (CMS-2646).
 *
 * Modeled on `@tiptap/extension-text-align`. We deliberately use a custom extension rather than
 * Tiptap v3's built-in `TextDirection`: that one ties the per-node `dir` default to the global
 * direction option, which stamps `dir` onto every block on serialization and breaks round-trip
 * parity. Here `defaultDirection` stays `null`, so plain `dir` attributes round-trip and untagged
 * content is left alone. The editor's *visual* default direction is applied to the container in
 * input-rich-text-html.vue, not here.
 */
export const Direction = Extension.create<DirectionOptions>({
	name: 'direction',

	addOptions() {
		return {
			types: ['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'listItem'],
			directions: ['ltr', 'rtl'],
			defaultDirection: null,
		};
	},

	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					dir: {
						default: this.options.defaultDirection,
						parseHTML: (element) => {
							const dir = element.getAttribute('dir');
							return (this.options.directions as string[]).includes(dir ?? '')
								? (dir as TextDirectionValue)
								: this.options.defaultDirection;
						},
						renderHTML: (attributes) => (attributes.dir ? { dir: attributes.dir } : {}),
					},
				},
			},
		];
	},

	addCommands() {
		return {
			setDirection:
				(direction) =>
				({ commands }) => {
					if (!this.options.directions.includes(direction)) return false;
					return this.options.types.map((type) => commands.updateAttributes(type, { dir: direction })).some(Boolean);
				},
			unsetDirection:
				() =>
				({ commands }) =>
					this.options.types.map((type) => commands.resetAttributes(type, 'dir')).some(Boolean),
		};
	},
});
