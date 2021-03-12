/**
 * Presets handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { PresetType } from '../types';

export type PresetItem<T extends object = {}> = PresetType & T;

export class PresetsHandler<T extends object> extends ItemsHandler<PresetItem<T>> {
	constructor(transport: ITransport) {
		super('directus_presets', transport);
	}
}
