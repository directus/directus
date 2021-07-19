import {
	InterfaceConfig,
	InterfaceDefineParam,
	DisplayConfig,
	DisplayDefineParam,
	LayoutConfig,
	LayoutContext,
	LayoutDefineParam,
	ModuleConfig,
	ModuleDefineParam,
} from '../../types';

export function defineInterface(config: InterfaceDefineParam): InterfaceConfig {
	let options: InterfaceConfig;

	if (typeof config === 'function') {
		options = config();
	} else {
		options = config;
	}

	return options;
}

export function defineDisplay(config: DisplayDefineParam): DisplayConfig {
	let options: DisplayConfig;

	if (typeof config === 'function') {
		options = config();
	} else {
		options = config;
	}

	return options;
}

export function defineLayout<Options = any, Query = any>(
	config: LayoutDefineParam<Options, Query>
): LayoutConfig<Options, Query> {
	let options: LayoutConfig<Options, Query>;

	if (typeof config === 'function') {
		const context: LayoutContext = {};
		options = config(context);
	} else {
		options = config;
	}

	return options;
}

export function defineModule(config: ModuleDefineParam): ModuleConfig {
	let options: ModuleConfig;

	if (typeof config === 'function') {
		options = config();
	} else {
		options = config;
	}

	return options;
}
