import { Extension } from '@tiptap/core';

export type TextDirectionValue = 'ltr' | 'rtl';

export interface DirectionOptions {
	types: string[];
	directions: TextDirectionValue[];
	defaultDirection: TextDirectionValue | null;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		direction: {
			setDirection: (direction: TextDirectionValue) => ReturnType;
			unsetDirection: () => ReturnType;
		};
	}
}

/** Adds a `dir` attribute to block nodes with `setDirection`/`unsetDirection` commands. */
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
