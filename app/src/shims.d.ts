/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */

declare module '*.vue' {
	import { ComponentOptions } from 'vue';
	const Component: ComponentOptions;
	export default Component;
}

declare module '*.md' {
	const value: string;
	export default value;
}

declare module '*.yaml' {
	const value: Record<string, any>;
	export default value;
}

declare module '*.json' {
	const value: { [key: string]: any };
	export default value;
}

declare module 'jsonlint-mod' {
	const x: any;
	export default x;
}

declare module '@directus-extensions-interface' {
	import { InterfaceConfig } from '@/interfaces/types';
	const interfaces: InterfaceConfig[];
	export default interfaces;
}

declare module '@directus-extensions-display' {
	import { DisplayConfig } from '@/displays/types';
	const displays: DisplayConfig[];
	export default displays;
}

declare module '@directus-extensions-layout' {
	import { LayoutConfig } from '@/layouts/types';
	const layouts: LayoutConfig[];
	export default layouts;
}

declare module '@directus-extensions-module' {
	import { ModuleConfig } from '@/modules/types';
	const modules: ModuleConfig[];
	export default modules;
}

type Primitive = string | number | boolean | bigint | symbol | undefined | null;
type Builtin = Primitive | Function | Date | Error | RegExp;
type IsTuple<T> = T extends [infer A]
	? T
	: T extends [infer A, infer B]
	? T
	: T extends [infer A, infer B, infer C]
	? T
	: T extends [infer A, infer B, infer C, infer D]
	? T
	: T extends [infer A, infer B, infer C, infer D, infer E]
	? T
	: never;

type DeepPartial<T> = T extends Primitive | Builtin
	? T
	: T extends Map<infer K, infer V>
	? Map<DeepPartial<K>, DeepPartial<V>>
	: T extends ReadonlyMap<infer K, infer V>
	? ReadonlyMap<DeepPartial<K>, DeepPartial<V>>
	: T extends WeakMap<infer K, infer V>
	? WeakMap<DeepPartial<K>, DeepPartial<V>>
	: T extends Set<infer U>
	? Set<DeepPartial<U>>
	: T extends ReadonlySet<infer U>
	? ReadonlySet<DeepPartial<U>>
	: T extends WeakSet<infer U>
	? WeakSet<DeepPartial<U>>
	: T extends Array<infer U>
	? T extends IsTuple<T>
		? { [K in keyof T]?: DeepPartial<T[K]> }
		: Array<DeepPartial<U>>
	: T extends Promise<infer U>
	? Promise<DeepPartial<U>>
	: T extends {}
	? { [K in keyof T]?: DeepPartial<T[K]> }
	: Partial<T>;
