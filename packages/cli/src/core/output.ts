import { defaults } from './utils';
import { Argv } from 'yargs';
import { IOptions } from '../options';
import { IOutput, IUIComposer, IOutputFormat } from '../output';
import { HumanOutputFormat } from './output/formats/human';
import { OutputBuilder } from './output/ui';
import { CLIError, CLIRuntimeError } from './exceptions';
import { CommandHelp, GeneralHelp } from '../help';
import { WriteStream } from 'fs';

export type OutputOptions = {
	format: string;
};

export class Output implements IOutput {
	private options: IOptions;
	private formats: {
		human: IOutputFormat;
		[name: string]: IOutputFormat;
	};
	private _text: string[];
	private _help?: GeneralHelp | CommandHelp;
	private _value?: any;
	private _errors: Error[];

	constructor(options: IOptions) {
		this.formats = {
			human: new HumanOutputFormat(),
		};
		this._text = [];
		this._errors = [];
		this.options = options;
		this.options.feature('output', (builder: Argv, _, raw) => {
			builder.option('format', {
				description: 'The output format',
				default: 'human',
				choices: [...Object.keys(this.formats)],
			});

			const explicitFormat = raw.format ?? 'human';
			Object.entries(this.formats).forEach(([name, format]) => {
				if (name === explicitFormat) {
					format.registerOptions(builder);
				}
			});

			if (explicitFormat != 'human' && !(explicitFormat in this.formats)) {
				this.formats['human']!.registerOptions(builder);
				throw new CLIRuntimeError(`Unknown output format: ${explicitFormat}`);
			}
		});
	}

	async help(help: GeneralHelp | CommandHelp): Promise<void> {
		this._help = help;
	}

	async text(text: string): Promise<void> {
		this._text.push(text);
	}

	async value<T>(value: T): Promise<void> {
		this._value = value;
	}

	async error(err: CLIError): Promise<void> {
		this._errors.push({
			name: err.name,
			message: err.message,
			stack: err.stack,
		});
	}

	async flush(stream: WriteStream): Promise<void> {
		stream.write(
			await this.getFormatter().format(
				{
					data: {
						data: this._value,
						help: this._help,
						errors: this._errors.length > 0 ? this._errors : undefined,
					},
					help: this._help,
					text: this._text,
					errors: this._errors,
				},
				this.getOptions()
			)
		);

		this._help = undefined;
		this._value = undefined;
		this._errors = [];
		this._text = [];
	}

	registerFormat(name: string, format: IOutputFormat): void {
		this.formats[name] = format;
	}

	async compose(builder: (builder: IUIComposer) => Promise<void>): Promise<void> {
		const outputBuilder = new OutputBuilder();
		await builder(outputBuilder);
		await this.text(await outputBuilder.get());
	}

	getFormatter(): IOutputFormat {
		const { format } = this.getOptions();
		return this.formats[format] ?? this.formats['human']!;
	}

	getOptions(options?: Partial<OutputOptions>): OutputOptions {
		const opts = this.options.values() as OutputOptions & { [k: string]: any };
		return defaults(options, {
			...opts,
			format: (opts.format as any) ?? 'human',
		}) as OutputOptions;
	}
}
