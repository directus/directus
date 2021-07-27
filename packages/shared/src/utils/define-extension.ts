import {
	InterfaceConfig,
	DisplayConfig,
	LayoutConfig,
	ModuleConfig,
	HookRegisterFunction,
	EndpointRegisterFunction,
} from '../types';

export function defineInterface(config: InterfaceConfig): InterfaceConfig {
	return config;
}

export function defineDisplay(config: DisplayConfig): DisplayConfig {
	return config;
}

export function defineLayout<Options = any, Query = any>(
	config: LayoutConfig<Options, Query>
): LayoutConfig<Options, Query> {
	return config;
}

export function defineModule(config: ModuleConfig): ModuleConfig {
	return config;
}

export function defineHook(config: HookRegisterFunction): HookRegisterFunction {
	return config;
}

export function defineEndpoint(config: EndpointRegisterFunction): EndpointRegisterFunction {
	return config;
}
