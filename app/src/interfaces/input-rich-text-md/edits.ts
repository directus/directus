import { EditorView } from '@codemirror/view';

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
		selection: string,
		cursors: { cursorHead: number; cursorFrom: number; cursorTo: number; rangeStart: number },
		options?: Record<string, any>,
	) => { newSelection: string; newCursorOffset: number; highlight?: { from: number; to: number } }
>;

export type CustomSyntax = {
	name: string;
	icon: string;
	prefix: string | null;
	suffix: string | null;
	box: 'inline' | 'block';
};

const alterations: AlterationFunctions = {
	heading(selection, { cursorHead, rangeStart }, options) {
		const level = options?.level || 3;

		let newSelection = selection;
		let newCursorOffset = 0;

		const prefix = '#'.repeat(level) + ' ';

		if (selection.startsWith(prefix)) {
			newSelection = selection.substring(prefix.length);
			newCursorOffset = cursorHead - rangeStart - prefix.length;
		} else {
			newSelection = `${prefix}${selection}`;
			newCursorOffset = cursorHead - rangeStart + prefix.length;
		}

		return { newSelection, newCursorOffset };
	},
	bold(selection, { cursorHead, rangeStart }) {
		let newSelection = selection;
		let newCursorOffset = 0;

		if (selection.startsWith('**') && selection.endsWith('**')) {
			newSelection = selection.substring(2, selection.length - 2);
			newCursorOffset = cursorHead - rangeStart - 2;
		} else {
			newSelection = `**${selection}**`;
			newCursorOffset = cursorHead - rangeStart + 2;
		}

		return { newSelection, newCursorOffset };
	},
	italic(selection, { cursorHead, rangeStart }) {
		let newSelection = selection;
		let newCursorOffset = 0;

		if (selection.startsWith('*') && selection.endsWith('*')) {
			newSelection = selection.substring(1, selection.length - 1);
			newCursorOffset = cursorHead - rangeStart - 1;
		} else {
			newSelection = `*${selection}*`;
			newCursorOffset = cursorHead - rangeStart + 1;
		}

		return { newSelection, newCursorOffset };
	},
	strikethrough(selection, { cursorHead, rangeStart }) {
		let newSelection = selection;
		let newCursorOffset = 0;

		if (selection.startsWith('~~') && selection.endsWith('~~')) {
			newSelection = selection.substring(2, selection.length - 2);
			newCursorOffset = cursorHead - rangeStart - 2;
		} else {
			newSelection = `~~${selection}~~`;
			newCursorOffset = cursorHead - rangeStart + 2;
		}

		return { newSelection, newCursorOffset };
	},
	listBulleted(selection, { cursorHead, rangeStart }) {
		let newSelection = selection;
		let newCursorOffset = 0;

		const lines = selection.split('\n');

		const isList = lines.every((line) => line.startsWith('- '));

		if (isList) {
			newSelection = lines.map((line) => line.substring(2)).join('\n');
			const removedChars = lines.length * 2;
			newCursorOffset = cursorHead - rangeStart - removedChars;
		} else {
			newSelection = lines.map((line) => `- ${line}`).join('\n');
			const addedChars = lines.length * 2;
			newCursorOffset = cursorHead - rangeStart + addedChars;
		}

		if (!selection) {
			newCursorOffset = cursorHead - rangeStart + 2;
		}

		return { newSelection, newCursorOffset };
	},
	listNumbered(selection, { cursorHead, rangeStart }) {
		let newSelection = selection;
		let newCursorOffset = 0;

		const lines = selection.split('\n');

		const isList = lines.every((line, index) => line.startsWith(`${index + 1}.`));

		if (isList) {
			const prefixes = lines.map((l) => l.match(/^\d+\. /)?.[0]?.length ?? 0);
			newSelection = lines.map((l) => l.replace(/^\d+\. /, '')).join('\n');
			const removedChars = prefixes.reduce((a, b) => a + b, 0);
			newCursorOffset = cursorHead - rangeStart - removedChars;
		} else {
			newSelection = lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
			const addedChars = lines.reduce((sum, _, index) => sum + `${index + 1}. `.length, 0);
			newCursorOffset = cursorHead - rangeStart + addedChars;
		}

		if (!selection) {
			newCursorOffset = cursorHead - rangeStart + 2;
		}

		return { newSelection, newCursorOffset };
	},
	blockquote(selection, { cursorHead, rangeStart }) {
		let newSelection = selection;
		let newCursorOffset = 0;

		const lines = selection.split('\n');

		const isList = lines.every((line) => line.startsWith('> '));

		if (isList) {
			newSelection = lines.map((line) => line.substring(2)).join('\n');
			const removedChars = lines.length * 2;
			newCursorOffset = cursorHead - rangeStart - removedChars;
		} else {
			newSelection = lines.map((line) => `> ${line}`).join('\n');
			const addedChars = lines.length * 2;
			newCursorOffset = cursorHead - rangeStart + addedChars;
		}

		if (!selection) {
			newCursorOffset = cursorHead - rangeStart + 2;
		}

		return { newSelection, newCursorOffset };
	},
	code(selection, { cursorHead, rangeStart }) {
		if (selection.includes('\n')) {
			let newSelection = selection;
			let newCursorOffset = 0;

			if (selection.startsWith('```') && selection.endsWith('```')) {
				newSelection = selection.substring(3, selection.length - 3);
				newCursorOffset = cursorHead - rangeStart - 3;
			} else {
				newSelection = '```\n' + newSelection + '\n```';
				newCursorOffset = cursorHead - rangeStart + 4;
			}

			return { newSelection, newCursorOffset };
		} else {
			let newSelection = selection;
			let newCursorOffset = 0;

			if (selection.startsWith('`') && selection.endsWith('`')) {
				newSelection = selection.substring(1, selection.length - 1);
				newCursorOffset = cursorHead - rangeStart - 1;
			} else {
				newSelection = `\`${selection}\``;
				newCursorOffset = cursorHead - rangeStart + 1;
			}

			return { newSelection, newCursorOffset };
		}
	},
	link(selection, { cursorFrom, cursorHead, rangeStart }) {
		let newSelection = selection;
		let newCursorOffset = 0;
		let highlight;

		if (selection.startsWith('[') && selection.endsWith('](url)')) {
			newSelection = selection.substring(1, selection.length - 6);
			newCursorOffset = cursorHead - rangeStart - 6;
		} else if (selection.startsWith('http')) {
			newSelection = `[](${selection})`;
			newCursorOffset = cursorFrom - rangeStart + 1;
		} else {
			newSelection = `[${selection}](url)`;

			if (selection) {
				highlight = {
					from: rangeStart + selection.length + 3,
					to: rangeStart + selection.length + 6,
				};

				newCursorOffset = cursorHead - rangeStart + 3;
			} else {
				newCursorOffset = cursorFrom - rangeStart + 1;
			}
		}

		return { newSelection, newCursorOffset, highlight };
	},
	table(selection, cursors, options) {
		if (!options) return { newSelection: selection, newCursorOffset: cursors.cursorFrom - cursors.rangeStart };

		let table = '';

		const headers = [];
		for (let i = 0; i < options.columns; i++) headers.push('Header');
		table += `| ${headers.join(' | ')} |`;
		table += `\n| ${headers.map(() => '------').join(' | ')} |`;

		for (let i = 0; i < options.rows; i++) {
			table += `\n| ${headers.map(() => 'Cell').join('   | ')}   |`;
		}

		return { newSelection: table, newCursorOffset: cursors.cursorFrom - cursors.rangeStart };
	},
	custom(selection, { cursorHead, rangeStart }, options) {
		if (!options) return { newSelection: selection, newCursorOffset: cursorHead - rangeStart };

		if (!options.prefix) options.prefix = '';
		if (!options.suffix) options.suffix = '';

		if (options.box === 'block') {
			let newSelection = selection;
			let newCursorOffset = 0;

			if (selection.startsWith(options.prefix) && selection.endsWith(options.suffix)) {
				newSelection = selection.substring(options.prefix.length, selection.length - options.suffix.length);
				newCursorOffset = cursorHead - rangeStart - options.prefix.length;
			} else {
				newSelection = `${options.prefix}\n${newSelection}\n${options.suffix}`;
				newCursorOffset = cursorHead - rangeStart + options.prefix.length + 1;
			}

			return { newSelection, newCursorOffset };
		} else {
			let newSelection = selection;
			let newCursorOffset = 0;

			if (selection.startsWith(options.prefix) && selection.endsWith(options.suffix)) {
				newSelection = selection.substring(options.prefix.length, selection.length - options.suffix.length);
				newCursorOffset = cursorHead - rangeStart - options.prefix.length;
			} else {
				newSelection = `${options.prefix}${selection}${options.suffix}`;
				newCursorOffset = cursorHead - rangeStart + options.prefix.length;
			}

			return { newSelection, newCursorOffset };
		}
	},
};

function findWordAt(view: EditorView, pos: number): { from: number; to: number } {
	const doc = view.state.doc;
	const line = doc.lineAt(pos);
	const text = line.text;
	const offsetInLine = pos - line.from;

	let start = offsetInLine;
	let end = offsetInLine;

	while (start > 0) {
		const char = text[start - 1];
		if (char === undefined || !/\w/.test(char)) break;
		start--;
	}

	while (end < text.length) {
		const char = text[end];
		if (char === undefined || !/\w/.test(char)) break;
		end++;
	}

	return {
		from: line.from + start,
		to: line.from + end,
	};
}

export function applyEdit(view: EditorView | null, type: Alteration, options?: Record<string, any>): void {
	if (!view) return;

	const selection = view.state.selection.main;
	const cursorHead = selection.head;
	const cursorFrom = selection.from;
	const cursorTo = selection.to;

	const selectedText = view.state.sliceDoc(cursorFrom, cursorTo);

	let wordRange: { from: number; to: number } | null = null;
	let word = '';

	if (!selectedText) {
		wordRange = findWordAt(view, cursorHead);
		word = view.state.sliceDoc(wordRange.from, wordRange.to).trim();
	}

	const textToTransform = selectedText || word;

	let rangeToUse: { from: number; to: number };

	if (selectedText) {
		rangeToUse = { from: cursorFrom, to: cursorTo };
	} else if (wordRange) {
		rangeToUse = { from: wordRange.from, to: wordRange.to };
	} else {
		rangeToUse = { from: cursorHead, to: cursorHead };
	}

	const originalRangeStart = rangeToUse.from;
	const originalRangeEnd = rangeToUse.to;

	const { newSelection, newCursorOffset, highlight } = alterations[type](
		textToTransform,
		{
			cursorFrom: originalRangeStart,
			cursorTo: originalRangeEnd,
			cursorHead: cursorHead,
			rangeStart: originalRangeStart,
		},
		options,
	);

	const newCursorPosition = originalRangeStart + newCursorOffset;

	view.dispatch({
		changes: {
			from: originalRangeStart,
			to: originalRangeEnd,
			insert: newSelection,
		},
		selection: highlight
			? { anchor: highlight.from, head: highlight.to }
			: { anchor: newCursorPosition, head: newCursorPosition },
	});

	view.focus();
}
