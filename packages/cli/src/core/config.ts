import * as path from 'path';
import * as yaml from 'js-yaml';
import fse from 'fs-extra';

import { IConfiguration, IBaseConfiguration, IStaticConfiguration } from '../config';
import { cosmiconfigSync as cosmiconfig } from 'cosmiconfig';

export type BaseConfigurationOptions<T> = {
	defaults: T;
};

export class BaseConfiguration<
	T extends object = any,
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

export class StaticConfiguration<T extends object = any>
	extends BaseConfiguration<T, StaticConfigurationOptions<T>>
	implements IStaticConfiguration<T> {
	constructor(options: StaticConfigurationOptions<T>) {
		super(options);

		const explorer = cosmiconfig(this._options.name, {
			searchPlaces: this._options.files,
		});

		const result = explorer.search();
		if (result) {
			this._data = result.config;
			this._path = result.filepath;
		}
	}
}

export type ConfigurationOptions<T> = BaseConfigurationOptions<T> & {
	name: string;
	directory: string;
	file: string;
};

export class YamlConfiguration<T extends object = any>
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
