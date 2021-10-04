/**
 * Presets handler
 */

import { ItemsHandler } from '@/src/base/items.js';
import { ITransport } from '@/src/transport.js';
import { PresetType, DefaultType } from '@/src/types.js';

export type PresetItem<T = DefaultType> = PresetType & T;

export class PresetsHandler<T = DefaultType> extends ItemsHandler<PresetItem<T>> {
	constructor(transport: ITransport) {
		super('directus_presets', transport);
	}
}
