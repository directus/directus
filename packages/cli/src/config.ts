export type InstanceConfiguration = {
	endpoint: string;
	auth: 'public' | 'token' | 'credentials';
	data?: {
		[key: string]: any;
	};
};

export type SystemConfiguration = {
	instances: {
		[name: string]: InstanceConfiguration;
	};
};

export type ProjectConfiguration = {
	instance?: string;
	dev?: {
		root?: string;
	};
	experimental?: {
		community_extensions?: boolean;
		typescript?: {
			tsconfig?: string;
		};
	};
};

export interface IBaseConfiguration<T extends object = any> {
	readonly data: T;
	readonly path: string | undefined;
}

export interface IStaticConfiguration<T extends object = any> extends IBaseConfiguration<T> {}

export interface IConfiguration<T extends object = any> extends IBaseConfiguration<T> {
	save(): void;
}
