import { Position } from 'codemirror';
import { cloneDeep } from 'lodash';

export type Alteration =
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
	prefix: string | null;
	suffix: string | null;
	box: 'inline' | 'block';
};

const alterations: AlterationFunctions = {
	heading(selection, { cursorTo }, options) {
		const level = options?.level || 3;

		let newSelection = selection;
		const newCursor = cursorTo;

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
		const newCursor = cursorTo;

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
		const newCursor = cursorTo;

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
		const newCursor = cursorTo;

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
		const newCursor = cursorTo;

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
		const newCursor = cursorTo;

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
		const newCursor = cursorTo;

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
			const newCursor = cursorTo;

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
			const newCursor = cursorTo;

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
		const newCursor = cursorTo;
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

		let table = '';

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

		if (!options.prefix) options.prefix = '';
		if (!options.suffix) options.suffix = '';

		if (options.box === 'block') {
			// Multiline
			let newSelection = selection;
			const newCursor = cursorTo;

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
			const newCursor = cursorTo;

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

export function applyEdit(codemirror: CodeMirror.Editor | null, type: Alteration, options?: Record<string, any>): void {
	if (codemirror) {
		const cursor = codemirror.getCursor('head');
		const cursorFrom = codemirror.getCursor('from');
		const cursorTo = codemirror.getCursor('to');

		const wordRange = codemirror.findWordAt(cursor);
		const word = codemirror.getRange(wordRange.anchor, wordRange.head).trim();

		const selection = codemirror.getSelection();

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
			codemirror.replaceRange(newSelection, wordRange.anchor, wordRange.head);
		} else {
			codemirror.replaceSelection(newSelection);
		}

		codemirror.setCursor(newCursor);

		if (highlight) {
			codemirror.setSelection(highlight.from, highlight.to);
		}

		codemirror.focus();
	}
}
