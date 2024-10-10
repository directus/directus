import type { Prettify } from '@directus/types';
import type {
	DisplayConfig,
	EndpointConfig,
	HookConfig,
	InterfaceConfig,
	LayoutConfig,
	ModuleConfig,
	OperationApiConfig,
	OperationAppConfig,
	PanelConfig,
} from '../types/index.js';

type CustomConfig<T extends object> = Record<string, unknown> & T;

type ExtendedConfig<T extends object, C> = Prettify<T & Omit<C, keyof T>>;

export function defineInterface<Custom extends CustomConfig<InterfaceConfig>>(
	config: Custom,
): ExtendedConfig<InterfaceConfig, Custom> {
	return config;
}

export function defineDisplay<Custom extends CustomConfig<DisplayConfig>>(
	config: Custom,
): ExtendedConfig<DisplayConfig, Custom> {
	return config;
}

export function defineLayout<Options = any, Query = any>(
	config: LayoutConfig<Options, Query>,
): LayoutConfig<Options, Query> {
	return config;
}

export function defineModule<Custom extends CustomConfig<ModuleConfig>>(
	config: Custom,
): ExtendedConfig<ModuleConfig, Custom> {
	return config;
}

export function definePanel<Custom extends CustomConfig<PanelConfig>>(
	config: Custom,
): ExtendedConfig<PanelConfig, Custom> {
	return config;
}

export function defineHook(config: HookConfig): HookConfig {
	return config;
}

export function defineEndpoint(config: EndpointConfig): EndpointConfig {
	return config;
}

export function defineOperationApp<Custom extends CustomConfig<OperationAppConfig>>(
	config: Custom,
): ExtendedConfig<OperationAppConfig, Custom> {
	return config;
}

export function defineOperationApi<Options = Record<string, unknown>>(
	config: OperationApiConfig<Options>,
): OperationApiConfig<Options> {
	return config;
}
