/**
 * Presets handler
 */

import { ItemsHandler } from '../items';
import { Transport } from '../transport';
import { PresetType, DefaultType } from '../types';

export type PresetItem<T = DefaultType> = PresetType & T;

export class PresetsHandler<T = DefaultType> extends ItemsHandler<PresetItem<T>> {
	constructor(transport: Transport) {
		super('directus_presets', transport);
	}
}
