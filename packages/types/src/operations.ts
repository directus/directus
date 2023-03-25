import type { ComponentOptions } from 'vue';
import type { Accountability } from './accountability.js';
import type { ApiExtensionContext } from './extensions.js';
import type { Field } from './fields.js';
import type { DeepPartial } from './misc.js';
import type { FlowRaw } from './flows.js';

export type OperationContext = ApiExtensionContext & {
	data: Record<string, unknown>;
	accountability: Accountability | null;
};

export type OperationHandler<Options = Record<string, unknown>> = (
	options: Options,
	context: OperationContext
) => unknown | Promise<unknown> | void;

export interface OperationAppConfig {
	id: string;
	name: string;
	icon: string;
	description?: string;

	overview:
		| ((
				options: Record<string, any>,
				{ flow }: { flow: FlowRaw }
		  ) => { label: string; text: string; copyable?: boolean }[])
		| ComponentOptions
		| null;
	options: DeepPartial<Field>[] | ((options: Record<string, any>) => DeepPartial<Field>[]) | ComponentOptions | null;
}

export interface OperationApiConfig<Options = Record<string, unknown>> {
	id: string;

	handler: OperationHandler<Options>;
}
