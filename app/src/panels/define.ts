import { PanelConfig, PanelDefineParam } from './types';

export function definePanel(config: PanelDefineParam): PanelConfig {
	let options: PanelConfig;

	if (typeof config === 'function') {
		options = config();
	} else {
		options = config;
	}

	return options;
}
