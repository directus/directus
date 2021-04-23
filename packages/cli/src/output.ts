import { Argv } from 'yargs';
import { CLIError } from './core/exceptions';

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

export interface IOutputBuilder {
	configure(opts: { indent?: number; width?: number }): void;
	header(name: string, style?: Style): Promise<void>;
	skip(lines?: number): Promise<void>;
	markdown(src: string): Promise<void>;
	line(value: string): Promise<void>;
	text(text: string): Promise<void>;
	rows(data: OutputColumn[][]): Promise<void>;
	figlet(text: string): Promise<void>;
	table(value: string[][], options?: TableOptions): Promise<void>;
	section(name: string, wrapper?: (builder: IOutputBuilder) => Promise<void>, style?: Style): Promise<void>;
	wrap(wrapper: (builder: IOutputBuilder) => Promise<void>, verticalPadding?: number): Promise<void>;
	error(error: Error): Promise<void>;
	get(): Promise<string>;
	clear(): Promise<void>;
}

export interface IOutputFormat<O extends any = any> {
	registerOptions(options: Argv): Argv<O>;
	formatText<T>(text: string, value: T | undefined, options: O): Promise<string>;
	formatValue<T>(value: T, options: O): Promise<string>;
	formatError(err: CLIError, options: O): Promise<string>;
}

export interface IOutput {
	registerFormat(name: string, format: IOutputFormat): void;
	writeText<T>(text: string, value?: T): void;
	writeValue<T>(value: T): Promise<void>;
	writeError(err: CLIError): Promise<void>;
	build<T>(build: (builder: IOutputBuilder) => Promise<void>, value?: T): Promise<void>;
	flush(): Promise<void>;
}
