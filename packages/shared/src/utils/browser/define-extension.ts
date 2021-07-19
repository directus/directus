import {
	InterfaceConfig,
	InterfaceDefineParam,
	DisplayConfig,
	DisplayDefineParam,
	LayoutConfig,
	LayoutContext,
	LayoutDefineParam,
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
