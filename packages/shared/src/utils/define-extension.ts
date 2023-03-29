import {
	InterfaceConfig,
	DisplayConfig,
	LayoutConfig,
	ModuleConfig,
	PanelConfig,
	HookConfig,
	EndpointConfig,
	OperationAppConfig,
	OperationApiConfig,
} from '../types';

export function defineInterface<T extends InterfaceConfig>(config: T): T {
	return config;
}

export function defineDisplay<T extends DisplayConfig>(config: T): T {
	return config;
}

export function defineLayout<Options = any, Query = any>(
	config: LayoutConfig<Options, Query>
): LayoutConfig<Options, Query> {
	return config;
}

export function defineModule<T extends ModuleConfig>(config: T): T {
	return config;
}

export function definePanel<T extends PanelConfig>(config: T): T {
	return config;
}

export function defineHook<T extends HookConfig>(config: T): T {
	return config;
}

export function defineEndpoint<T extends EndpointConfig>(config: T): T {
	return config;
}

export function defineOperationApp<T extends OperationAppConfig>(config: T): T {
	return config;
}

export function defineOperationApi<Options = Record<string, unknown>>(
	config: OperationApiConfig<Options>
): OperationApiConfig<Options> {
	return config;
}
