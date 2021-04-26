import { WriteStream } from 'fs';
import { Argv } from 'yargs';
import { CLIError } from './core/exceptions';
import { CommandHelp, GeneralHelp } from './help';

export type Options = {
	format: string;
};

export type TableStyle = 'compact' | 'minimal' | 'markdown';

export type TableCellAlignment = 'left' | 'center' | 'right';

export type TableOptions = {
	head?: string[];
	headFormat?: (text: string) => string;
	style?: TableStyle;
	widths?: (number | null)[];
	alignments?: TableCellAlignment[];
	wrap?: boolean;
	truncate?: boolean;
};

export type TextLayoutOptions = {
	style: (text: string) => string;
	padding: [number, number, number, number];
	alignment: TableCellAlignment;
	removeIndent: boolean;
};

export type OutputColumn = {
	text: string;
	options?: Partial<TextLayoutOptions>;
};

export type Style = (text: string) => string;

export interface IUIComposer {
	configure(opts: { indent?: number; width?: number }): void;
	header(name: string, style?: Style): Promise<void>;
	skip(lines?: number): Promise<void>;
	markdown(src: string): Promise<void>;
	line(value: string): Promise<void>;
	text(text: string): Promise<void>;
	rows(data: OutputColumn[][]): Promise<void>;
	figlet(text: string): Promise<void>;
	table(value: string[][], options?: TableOptions): Promise<void>;
	section(name: string, wrapper?: (builder: IUIComposer) => Promise<void>, style?: Style): Promise<void>;
	wrap(wrapper: (builder: IUIComposer) => Promise<void>, verticalPadding?: number): Promise<void>;
	error(error: Error): Promise<void>;
	json(value: any, style?: TableStyle): Promise<void>;
	get(): Promise<string>;
	clear(): Promise<void>;
}

export type FormatData = {
	help?: GeneralHelp | CommandHelp;
	text: string[];
	errors: Error[];
	data?: any;
};

export interface IOutputFormat<O extends any = any> {
	registerOptions(options: Argv): Argv<O>;
	format(data: FormatData, options: O): Promise<string>;
}

export interface IOutput {
	registerFormat(name: string, format: IOutputFormat): void;
	help(value: CommandHelp | GeneralHelp): Promise<void>;
	text(value: string): Promise<void>;
	value<T>(value: T): Promise<void>;
	error(value: CLIError): Promise<void>;
	compose(builder: (ui: IUIComposer) => Promise<void>): Promise<void>;
	flush(stream: WriteStream): Promise<void>;
}
