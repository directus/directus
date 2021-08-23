import * as path from 'path';
import * as yaml from 'js-yaml';
import fse from 'fs-extra';
import JSON5 from 'json5';
import { Liquid } from 'liquidjs';

import { IConfiguration, IBaseConfiguration, IStaticConfiguration } from '../config';
import { cosmiconfigSync, defaultLoaders } from 'cosmiconfig';

export type BaseConfigurationOptions<T> = {
	defaults: T;
};

export class BaseConfiguration<
	T extends Record<string, unknown> = any,
	C extends BaseConfigurationOptions<T> = BaseConfigurationOptions<T>
> implements IBaseConfiguration<T> {
	protected _data?: T;
	protected _path?: string;
	protected _options: C;

	get path(): string | undefined {
		return this._path;
	}

	get data(): T {
		return (
			this._data ||
			(this._data = {
				...this._options.defaults,
			})
		);
	}

	constructor(options: C) {
		this._options = options;
	}
}

export type StaticConfigurationOptions<T> = BaseConfigurationOptions<T> & {
	name: string;
	files: string[];
};

export class StaticConfiguration<T extends Record<string, unknown> = any>
	extends BaseConfiguration<T, StaticConfigurationOptions<T>>
	implements IStaticConfiguration<T> {
	private engine: Liquid;

	constructor(options: StaticConfigurationOptions<T>) {
		super(options);
		this.engine = new Liquid();

		const explorer = cosmiconfigSync(this._options.name, {
			searchPlaces: this._options.files,
			loaders: {
				noExt: this.loadJson.bind(this),
				'.js': defaultLoaders['.js'],
				'.json': this.loadJson.bind(this),
				'.json5': this.loadJson.bind(this),
				'.yml': this.loadYaml.bind(this),
				'.yaml': this.loadYaml.bind(this),
			},
		});

		const result = explorer.search();
		if (result) {
			this._data = result.config;
			this._path = result.filepath;
		}
	}

	private loadJson(_: string, content: string): Record<string, unknown> | null {
		return JSON5.parse(this.transform(content));
	}

	private loadYaml(_: string, content: string): Record<string, unknown> | null {
		return yaml.load(this.transform(content)) as Record<string, unknown>;
	}

	private transform(content: string): string {
		return this.engine.parseAndRenderSync(content, {
			env: process.env,
		});
	}
}

export type ConfigurationOptions<T> = BaseConfigurationOptions<T> & {
	name: string;
	directory: string;
	file: string;
};

export class YamlConfiguration<T extends Record<string, unknown> = any>
	extends BaseConfiguration<T, ConfigurationOptions<T>>
	implements IConfiguration<T> {
	constructor(options: ConfigurationOptions<T>) {
		super(options);

		this._path = path.join(options.directory, options.file);

		fse.ensureDirSync(options.directory);
		if (!fse.existsSync(this._path)) {
			fse.outputFileSync(
				this._path,
				yaml.dump(options.defaults, {
					forceQuotes: true,
				})
			);
		}

		this._data = yaml.load(fse.readFileSync(this._path).toString(), {
			filename: this._path,
		}) as T;
	}

	save(): void {
		fse.outputFileSync(
			this._path!,
			yaml.dump(this.data, {
				forceQuotes: true,
			})
		);
	}
}
