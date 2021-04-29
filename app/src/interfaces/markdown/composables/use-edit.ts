import { Ref } from '@vue/composition-api';
import { Position } from 'codemirror';
import { cloneDeep } from 'lodash';

type Alteration =
	| 'bold'
	| 'italic'
	| 'strikethrough'
	| 'listBulleted'
	| 'listNumbered'
	| 'heading'
	| 'blockquote'
	| 'code'
	| 'link'
	| 'table'
	| 'custom';

type AlterationFunctions = Record<
	Alteration,
	(
		selections: string,
		cursors: { cursorHead: Position; cursorFrom: Position; cursorTo: Position },
		options?: Record<string, any>
	) => { newSelection: string; newCursor: Position; highlight?: { from: Position; to: Position } }
>;

export type CustomSyntax = {
	name: string;
	icon: string;
	prefix: string;
	suffix: string;
	box: 'inline' | 'block';
};

export function useEdit(codemirror: Ref<CodeMirror.EditorFromTextArea | null>): Record<string, any> {
	const alterations: AlterationFunctions = {
		heading(selection, { cursorTo }, options) {
			const level = options?.level || 3;

			let newSelection = selection;
			let newCursor = cursorTo;

			const prefix = '#'.repeat(level) + ' ';

			if (selection.startsWith(prefix)) {
				newSelection = selection.substring(prefix.length);
			} else {
				newSelection = `${prefix}${selection}`;
				newCursor.ch = newCursor.ch + prefix.length;
			}

			return { newSelection, newCursor };
		},
		bold(selection, { cursorTo }) {
			let newSelection = selection;
			let newCursor = cursorTo;

			if (selection.startsWith('**') && selection.endsWith('**')) {
				newSelection = selection.substring(2, selection.length - 2);
			} else {
				newSelection = `**${selection}**`;
				newCursor.ch = newCursor.ch + 2;
			}

			return { newSelection, newCursor };
		},
		italic(selection, { cursorTo }) {
			let newSelection = selection;
			let newCursor = cursorTo;

			if (selection.startsWith('*') && selection.endsWith('*')) {
				newSelection = selection.substring(1, selection.length - 1);
			} else {
				newSelection = `*${selection}*`;
				newCursor.ch = newCursor.ch + 1;
			}

			return { newSelection, newCursor };
		},
		strikethrough(selection, { cursorTo }) {
			let newSelection = selection;
			let newCursor = cursorTo;

			if (selection.startsWith('~~') && selection.endsWith('~~')) {
				newSelection = selection.substring(2, selection.length - 2);
			} else {
				newSelection = `~~${selection}~~`;
				newCursor.ch = newCursor.ch + 2;
			}

			return { newSelection, newCursor };
		},
		listBulleted(selection, { cursorTo }) {
			let newSelection = selection;
			let newCursor = cursorTo;

			const lines = selection.split('\n');

			const isList = lines.every((line) => line.startsWith('- '));

			if (isList) {
				newSelection = lines.map((line) => line.substring(2)).join('\n');
			} else {
				newSelection = lines.map((line) => `- ${line}`).join('\n');
			}

			if (!selection) {
				newCursor.ch = newCursor.ch + 2;
			}

			return { newSelection, newCursor };
		},
		listNumbered(selection, { cursorTo }) {
			let newSelection = selection;
			let newCursor = cursorTo;

			const lines = selection.split('\n');

			const isList = lines.every((line, index) => line.startsWith(`${index + 1}.`));

			if (isList) {
				newSelection = lines.map((line) => line.substring(3)).join('\n');
			} else {
				newSelection = lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
			}

			if (!selection) {
				newCursor.ch = newCursor.ch + 2;
			}

			return { newSelection, newCursor };
		},
		blockquote(selection, { cursorTo }) {
			let newSelection = selection;
			let newCursor = cursorTo;

			const lines = selection.split('\n');

			const isList = lines.every((line) => line.startsWith('> '));

			if (isList) {
				newSelection = lines.map((line) => line.substring(2)).join('\n');
			} else {
				newSelection = lines.map((line) => `> ${line}`).join('\n');
			}

			if (!selection) {
				newCursor.ch = newCursor.ch + 2;
			}

			return { newSelection, newCursor };
		},
		code(selection, { cursorTo }) {
			if (selection.includes('\n')) {
				// Multiline
				let newSelection = selection;
				let newCursor = cursorTo;

				if (selection.startsWith('```') && selection.endsWith('```')) {
					newSelection = selection.substring(3, selection.length - 3);
				} else {
					newSelection = '```\n' + newSelection + '\n```';
					newCursor.line = newCursor.line + 1;
				}

				return { newSelection, newCursor };
			} else {
				// Inline
				let newSelection = selection;
				let newCursor = cursorTo;

				if (selection.startsWith('`') && selection.endsWith('`')) {
					newSelection = selection.substring(1, selection.length - 1);
				} else {
					newSelection = `\`${selection}\``;
					newCursor.ch = newCursor.ch + 1;
				}

				return { newSelection, newCursor };
			}
		},
		link(selection, { cursorFrom, cursorTo }) {
			let newSelection = selection;
			let newCursor = cursorTo;
			let highlight;

			if (selection.endsWith('](url)')) {
				newSelection = selection.substring(1, selection.length - 6);
			} else if (selection.startsWith('http')) {
				newSelection = `[](${selection})`;
				newCursor.ch = cursorFrom.ch + 1;
			} else {
				newSelection = `[${selection}](url)`;

				if (selection) {
					highlight = {
						from: {
							...cloneDeep(newCursor),
							ch: newCursor.ch + 3,
						},
						to: {
							...cloneDeep(newCursor),
							ch: newCursor.ch + 6,
						},
					};
				} else {
					newCursor.ch = cursorFrom.ch + 1;
				}
			}

			return { newSelection, newCursor, highlight };
		},
		table(selection, cursors, options) {
			if (!options) return { newSelection: selection, newCursor: cursors.cursorFrom };

			let table: string = '';

			// Headers
			const headers = [];
			for (let i = 0; i < options.columns; i++) headers.push('Header');
			table += `| ${headers.join(' | ')} |`;
			table += `\n| ${headers.map(() => '------').join(' | ')} |`;

			for (let i = 0; i < options.rows; i++) {
				table += `\n| ${headers.map(() => 'Cell').join('   | ')}   |`;
			}

			return { newSelection: table, newCursor: cursors.cursorFrom };
		},
		custom(selection, { cursorTo, cursorHead }, options) {
			if (!options) return { newSelection: selection, newCursor: cursorHead };

			if (options.box === 'block') {
				// Multiline
				let newSelection = selection;
				let newCursor = cursorTo;

				if (selection.startsWith(options.prefix) && selection.endsWith(options.suffix)) {
					newSelection = selection.substring(options.prefix.length, selection.length - options.suffix.length);
				} else {
					newSelection = `${options.prefix}\n${newSelection}\n${options.suffix}`;
					newCursor.line = newCursor.line + 1;
				}

				return { newSelection, newCursor };
			} else {
				// Inline
				let newSelection = selection;
				let newCursor = cursorTo;

				if (selection.startsWith(options.prefix) && selection.endsWith(options.suffix)) {
					newSelection = selection.substring(1, selection.length - 1);
				} else {
					newSelection = `${options.prefix}${selection}${options.suffix}`;
					newCursor.ch = newCursor.ch + 1;
				}

				return { newSelection, newCursor };
			}
		},
	};

	return { edit };

	function edit(type: Alteration, options?: Record<string, any>) {
		if (codemirror.value) {
			const cursor = codemirror.value.getCursor('head');
			const cursorFrom = codemirror.value.getCursor('from');
			const cursorTo = codemirror.value.getCursor('to');

			const wordRange = codemirror.value.findWordAt(cursor);
			const word = codemirror.value.getRange(wordRange.anchor, wordRange.head).trim();

			const selection = codemirror.value.getSelection();

			const { newSelection, newCursor, highlight } = alterations[type](
				selection || word,
				{
					cursorFrom: cloneDeep(selection ? cursorFrom : wordRange.anchor),
					cursorTo: cloneDeep(selection ? cursorTo : wordRange.head),
					cursorHead: cursor,
				},
				options
			);

			if (word && !selection) {
				codemirror.value.replaceRange(newSelection, wordRange.anchor, wordRange.head);
			} else {
				codemirror.value.replaceSelection(newSelection);
			}

			codemirror.value.setCursor(newCursor);

			if (highlight) {
				codemirror.value.setSelection(highlight.from, highlight.to);
			}

			codemirror.value.focus();
		}
	}
}
