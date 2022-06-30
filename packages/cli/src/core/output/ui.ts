import chalk from 'chalk';
import yargs from 'yargs';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import stripAnsi from 'strip-ansi';
import title from '@directus/format-title';

// @ts-ignore
import cliui from 'cliui';

import Table from 'cli-table3';
import figlet from 'figlet';
import redent from 'redent';
import { DEFAULT_THEME, highlight } from 'cli-highlight';

import { IUIComposer, OutputColumn, Style, TableOptions, TableStyle, TextLayoutOptions } from '../../output';

export const DefaultIndentSize = 2;

export const FullTerminalWidth = yargs.terminalWidth() - 2;
export const DefaultTerminalWidth = Math.min(70, yargs.terminalWidth() - 2);

export const palette = {
	header: chalk.bgWhite.black.bold,
	quote: chalk.gray,
};

const TableMinimalBorders = {
	top: '',
	'top-mid': '',
	'top-left': '',
	'top-right': '',
	bottom: '',
	'bottom-mid': '',
	'bottom-left': '',
	'bottom-right': '',
	left: '',
	'left-mid': '',
	mid: '',
	'mid-mid': '',
	right: '',
	'right-mid': '',
	middle: '',
};

const TableCompactBorders = {
	mid: '',
	'left-mid': '',
	'mid-mid': '',
	'right-mid': '',
};

const TableMarkdownBorders = {
	...TableMinimalBorders,
	left: '|',
	right: '|',
	middle: '|',
};

export class UIBuilder implements IUIComposer {
	private lines: string[];
	private indentSize: number;
	private indentLevel: number;
	private terminalWidth: number;
	private markdownRenderer: TerminalRenderer;

	constructor(indentSize: number = DefaultIndentSize, terminalWidth?: number, indentLevel?: number) {
		this.lines = [];
		this.indentLevel = indentLevel ?? 0;
		this.indentSize = indentSize;
		this.terminalWidth = terminalWidth ?? DefaultTerminalWidth;
		this.markdownRenderer = null as any as TerminalRenderer;
		this.configure({
			indent: indentSize,
			width: terminalWidth,
		});
	}

	configure(opts: { indent?: number; width?: number }): void {
		this.indentSize = opts.indent ?? DefaultIndentSize;
		this.terminalWidth = opts.width ?? DefaultTerminalWidth;
		this.markdownRenderer = new TerminalRenderer({
			width: this.terminalWidth - this.indentLevel * this.indentSize - 8,
			reflowText: true,
			showSectionPrefix: false,
			tab: this.indentSize,
			codespan: (text: string) => chalk.reset.bgGray.white(`${text}`),
			blockquote: (text: string) =>
				palette.quote(
					stripAnsi(text)
						.split('\n')
						.map((l) => `\xA0${l.trim()}`)
						.join('\n')
				),
		});

		(this.markdownRenderer as any).code = function (code: string, lang: string) {
			code = highlight(code, {
				language: lang || 'js',
				ignoreIllegals: true,
			});
			code = code
				.split('\n')
				.map((line) => `${chalk.gray('\xA0')}${line}`)
				.join('\n');
			return code + '\n\n';
		};
	}

	private defaultTextOptions(options?: Partial<TextLayoutOptions>): TextLayoutOptions {
		options = options ?? {};
		options.removeIndent = options.removeIndent ?? true;
		options.padding = options.padding ?? [0, 0, 0, 0];
		options.style = options.style ?? ((s) => chalk.reset(s));
		options.alignment = options.alignment ?? 'left';

		for (let i = 0; i < 4; i++) {
			if (i > options.padding.length - 1) {
				options.padding[i] = 0;
			}
		}

		return options as TextLayoutOptions;
	}

	private makeLayout(text: string, options?: Partial<TextLayoutOptions>): string {
		const ui = cliui({
			width: this.terminalWidth,
		});

		const opts = this.defaultTextOptions(options);
		opts.padding[3] += this.indentLevel * this.indentSize;

		ui.div({
			padding: opts.padding,
			text: opts.removeIndent ? redent(text) : text,
		});

		return opts.style(ui.toString());
	}

	async text(text: string, options?: TextLayoutOptions): Promise<void> {
		this.lines.push(this.makeLayout(text, options));
	}

	async rows(data: OutputColumn[][]): Promise<void> {
		const ui = cliui({
			width: this.terminalWidth,
		});

		data.forEach((row) => {
			ui.div(
				...row.map((col) => {
					const opts = this.defaultTextOptions(col.options);
					opts.padding[3] += this.indentLevel * this.indentSize;
					return {
						align: opts.alignment,
						padding: opts.padding,
						text: opts.style(opts.removeIndent ? redent(col.text) : col.text),
					};
				})
			);
		});

		this.lines.push(ui.toString());
	}

	async header(name: string, style?: (text: string) => string): Promise<void> {
		style = style ?? palette.header;
		this.lines.push(this.makeLayout(style(`\xA0${name.toUpperCase()}\xA0`)));
	}

	async table(values: string[][], options?: TableOptions): Promise<void> {
		const opts = options || {};
		opts.style = opts.style || 'minimal';
		opts.headFormat = opts.headFormat || ((v) => chalk.reset.green.bold(v));
		opts.alignments = opts.alignments || values[0]?.map((_) => 'left') || [];
		opts.widths = opts.widths || values[0]?.map((_) => null) || [];
		opts.wrap = opts.wrap ?? true;
		opts.truncate = opts.truncate ?? true;
		if (opts.head) {
			opts.head = opts.head.map(opts.headFormat);
		}

		let table: Table.Table | undefined;

		switch (opts.style) {
			case 'compact':
				table = new Table({
					head: opts.head,
					colAligns: opts.alignments,
					colWidths: opts.widths,
					chars: TableCompactBorders,
					wordWrap: opts.wrap,
					truncate: opts.truncate ? '…' : undefined,
				});
				break;
			case 'markdown':
				table = new Table({
					head: opts.head,
					colAligns: opts.alignments,
					colWidths: opts.widths,
					chars: TableMarkdownBorders,
					wordWrap: opts.wrap,
					truncate: opts.truncate ? '…' : undefined,
				});
				break;
			case 'minimal':
			default:
				table = new Table({
					head: opts.head,
					colAligns: opts.alignments,
					colWidths: opts.widths,
					chars: TableMinimalBorders,
					wordWrap: opts.wrap,
					truncate: opts.truncate ? '…' : undefined,
				});
				break;
		}

		if (table) {
			table.push(...(values as any));
			await this.text(table.toString());
		}
	}

	async skip(lines = 1): Promise<void> {
		for (let i = 0; i < lines /*Math.max(lines, 1)*/; i++) {
			await this.line('');
		}
	}

	async line(value: string): Promise<void> {
		await this.text(value);
	}

	markdown(text: string): string {
		return marked(redent(text), {
			baseUrl: 'https://docs.directus.io',
			renderer: this.markdownRenderer as any,
			sanitize: false,
		}).trim();
	}

	async figlet(text: string): Promise<void> {
		await this.text(figlet.textSync(text, 'Big'));
	}

	async section(name: string, wrapper?: (builder: IUIComposer) => Promise<void>, style?: Style): Promise<void> {
		await this.header(name, style);
		await this.skip();
		if (wrapper) {
			await this.wrap(wrapper);
			await this.skip();
		}
	}

	async wrap(build: (builder: IUIComposer) => Promise<void>, verticalPadding?: number): Promise<void> {
		this.indentLevel += 1;
		verticalPadding = verticalPadding ?? 0;
		await this.skip(verticalPadding);
		await build(this);
		await this.skip(verticalPadding);
		this.indentLevel -= 1;
	}

	async error(
		err: Error,
		options?: {
			title?: string;
			stacktrace?: boolean;
		}
	): Promise<void> {
		options = options || {};
		options.stacktrace = options.stacktrace ?? false;
		options.title = options.title || 'Error';

		await this.skip();
		await this.header(options.title, chalk.bgRed.black);
		await this.skip();
		await this.wrap(async (builder) => {
			await builder.line(chalk.redBright(err.message));
		});

		if (!options.stacktrace) {
			await this.skip(2);
		} else {
			const stack = new UIBuilder(this.indentSize, FullTerminalWidth, this.indentLevel);
			await stack.wrap((builder) => builder.line(chalk.grey(err.stack ?? 'No stacktrace available')), 1);
			await stack.skip(1);
			this.lines.push(await stack.get());
		}
	}

	async json<T>(value: T, style: TableStyle = 'compact'): Promise<void> {
		if (Array.isArray(value)) {
			this.lines.push(await this.jsonArray(value, style));
			return;
		}

		const fields = Object.keys(value).sort();
		const val = value as Record<string, any>;
		const ui = new UIBuilder(this.indentSize, FullTerminalWidth, this.indentLevel);
		await ui.wrap(
			async (ui) =>
				await ui.table(
					await Promise.all(
						fields.map(async (field) => {
							return [
								field,
								await this.jsonHighlight(val[field], {
									highlight: true,
									pretty: true,
								}),
							];
						})
					),
					{
						wrap: true,
						head: ['Property', 'Value'],
						alignments: ['right', 'left'],
						headFormat: (v) => chalk.reset.bold(title(v)),
						style,
					}
				)
		);

		this.lines.push(await ui.get());
	}

	private async jsonArray<T>(values: T[], style: TableStyle = 'compact'): Promise<string> {
		const ui = new UIBuilder(this.indentSize, FullTerminalWidth, this.indentLevel);

		if (values.length <= 0) {
			await ui.wrap((ui) =>
				ui.table([], {
					style,
				})
			);
		} else {
			const fields = Object.keys(values[0]!).sort();
			await ui.wrap(
				async (ui) =>
					await ui.table(
						await Promise.all(
							values.map((row: T) =>
								Promise.all(
									fields.map((field) =>
										this.jsonHighlight((row as any)[field], {
											highlight: true,
											pretty: true,
										})
									)
								)
							)
						),
						{
							wrap: true,
							head: fields,
							headFormat: (v) => chalk.reset.bold(title(v)),
							style,
						}
					)
			);
		}

		return await ui.get();
	}

	private async jsonHighlight(
		value: any,
		options?: {
			pretty: boolean;
			highlight: boolean;
		}
	): Promise<string> {
		let formatted = JSON.stringify(value, null, options?.pretty || options?.highlight ? 2 : 0) ?? 'undefined';
		if (options?.highlight) {
			formatted = highlight(formatted, {
				ignoreIllegals: true,
				language: 'json',
				theme: {
					...DEFAULT_THEME,
					string: chalk.reset.rgb(234, 118, 116),
				},
			});
		}
		return formatted;
	}

	async get(): Promise<string> {
		return this.lines.join('\n');
	}

	async clear(): Promise<void> {
		this.lines = [];
	}
}
