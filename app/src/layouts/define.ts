import { LayoutConfig, LayoutContext, LayoutDefineParam } from './types';

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
