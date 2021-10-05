/**
 * Presets handler
 */

import { ItemsHandler } from '../base/items.js';
import { ITransport } from '../transport.js';
import { PresetType, DefaultType } from '../types.js';

export type PresetItem<T = DefaultType> = PresetType & T;

export class PresetsHandler<T = DefaultType> extends ItemsHandler<PresetItem<T>> {
	constructor(transport: ITransport) {
		super('directus_presets', transport);
	}
}
