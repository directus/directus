import type { Accountability, DeepPartial, FlowRaw } from '@directus/types';
import type { ComponentOptions } from 'vue';
import type { ApiExtensionContext } from './api-extension-context.js';
import type { AppField } from './index.js';

export type OperationContext = ApiExtensionContext & {
	data: Record<string, unknown>;
	accountability: Accountability | null;
};

export type OperationHandler<Options = Record<string, unknown>> = (
	options: Options,
	context: OperationContext,
) => unknown | Promise<unknown> | void;

export interface OperationAppConfig {
	id: string;
	name: string;
	icon: string;
	description?: string;

	overview:
		| ((
				options: Record<string, any>,
				{ flow }: { flow: FlowRaw },
		  ) => { label: string; text: string; copyable?: boolean }[])
		| ComponentOptions
		| null;
	options:
		| DeepPartial<AppField>[]
		| ((options: Record<string, any>) => DeepPartial<AppField>[])
		| Exclude<ComponentOptions, any>
		| null;
}

export interface OperationApiConfig<Options = Record<string, unknown>> {
	id: string;

	handler: OperationHandler<Options>;
}
