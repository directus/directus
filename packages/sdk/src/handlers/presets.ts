/**
 * Presets handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { PresetType, DefaultType } from '../types';

export type PresetItem<T = DefaultType> = PresetType & T;

export class PresetsHandler<T = DefaultType> extends ItemsHandler<PresetItem<T>> {
	constructor(transport: ITransport) {
		super('directus_presets', transport);
	}
}
