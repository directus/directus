import { defaults } from './utils';
import { Argv } from 'yargs';
import { IOptions } from '../options';
import { IOutput, IOutputBuilder, IOutputFormat } from '../output';
import { HumanOutputFormat } from './output/formats/human';
import { OutputBuilder } from './output/builder';
import { CLIError, CLIRuntimeError } from './exceptions';

export type OutputOptions = {
	format: string;
};

export class Output implements IOutput {
	private options: IOptions;
	private formats: {
		human: IOutputFormat;
		[name: string]: IOutputFormat;
	};
	private lines: string[];

	constructor(options: IOptions) {
		this.formats = {
			human: new HumanOutputFormat(),
		};
		this.lines = [];
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

	async writeText<T>(text: string, value?: T): Promise<void> {
		const formatter = this.getFormatter();
		this.lines.push(await formatter.formatText(text, value, this.getOptions()));
	}

	async writeValue<T>(value: T): Promise<void> {
		const formatter = this.getFormatter();
		this.lines.push(await formatter.formatValue(value, this.getOptions()));
	}

	async writeError(err: CLIError): Promise<void> {
		const formatter = this.getFormatter();
		this.lines.push(await formatter.formatError(err, this.getOptions()));
	}

	async flush(): Promise<void> {
		process.stdout.write(this.lines.join('\n'));
		this.lines = [];
	}

	registerFormat(name: string, format: IOutputFormat): void {
		this.formats[name] = format;
	}

	async build<T>(builder: (builder: IOutputBuilder) => Promise<void>, value?: T): Promise<void> {
		const outputBuilder = new OutputBuilder();
		await builder(outputBuilder);
		await this.writeText(await outputBuilder.get(), value);
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
