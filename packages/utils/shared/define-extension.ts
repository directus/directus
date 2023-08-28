import type {
	InterfaceConfig,
	DisplayConfig,
	LayoutConfig,
	ModuleConfig,
	PanelConfig,
	HookConfig,
	EndpointConfig,
	OperationAppConfig,
	OperationApiConfig,
	SecureEndpointConfig,
	SecureHookConfig,
	SecureOperationApiConfig,
} from '@directus/types';

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

export function defineSecureEndpoint<T extends SecureEndpointConfig>(config: T): T {
	return config;
}


export function defineSecureHook<T extends SecureHookConfig>(config: T): T {
	return config;
}

export function defineSecureOperationApi<Options = Record<string, unknown>>(
	config: SecureOperationApiConfig<Options>
): SecureOperationApiConfig<Options> {
	return config;
}
